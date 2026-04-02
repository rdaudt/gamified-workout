import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const raw = fs.readFileSync(filePath, 'utf8')
  const lines = raw.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (!key || process.env[key]) {
      continue
    }

    process.env[key] = value.replace(/^['"]|['"]$/g, '')
  }
}

function loadEnv() {
  const cwd = process.cwd()
  const candidates = ['.env.local', '.env', '.env.example']

  for (const candidate of candidates) {
    loadEnvFile(path.join(cwd, candidate))
  }
}

function getPublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
}

async function run() {
  loadEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
  const publicKey = getPublicKey()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || ''

  requireEnv('NEXT_PUBLIC_SUPABASE_URL', url)
  requireEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    publicKey
  )
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey)

  const publicClient = createClient(url, publicKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const checks = []

  const {
    count: publicDirectoryCount,
    error: publicDirectoryError,
  } = await publicClient
    .from('coach_directory_settings')
    .select('user_id', { head: true, count: 'exact' })

  if (publicDirectoryError) {
    checks.push({
      name: 'public directory read',
      ok: false,
      detail: publicDirectoryError.message,
    })
  } else {
    checks.push({
      name: 'public directory read',
      ok: true,
      detail: 'Public client reached coach_directory_settings successfully.',
    })
  }

  const adminTables = [
    'profiles',
    'user_roles',
    'coach_profiles',
    'coach_business_profiles',
    'coach_applications',
    'coach_directory_settings',
    'trainee_coach_relationships',
    'workouts',
  ]

  for (const table of adminTables) {
    const { error } = await adminClient.from(table).select('*', { head: true, count: 'exact' })

    checks.push({
      name: `admin read ${table}`,
      ok: !error,
      detail: error ? error.message : 'OK',
    })
  }

  const failures = checks.filter((check) => !check.ok)

  console.log('Supabase access check')
  console.log(`URL host: ${new URL(url).host}`)
  console.log(`Public key type: ${publicKey.startsWith('sb_publishable_') ? 'publishable' : 'legacy anon'}`)
  console.log(`Rows visible to public directory query: ${publicDirectoryCount ?? 0}`)
  console.log('')

  for (const check of checks) {
    console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name}  ${check.detail}`)
  }

  if (failures.length > 0) {
    process.exitCode = 1
    return
  }

  console.log('')
  console.log('All Supabase connectivity checks passed.')
}

run().catch((error) => {
  console.error('Supabase access check failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
