export interface SupabasePublicEnv {
  url: string
  publishableKey: string
}

export function selectSupabasePublicKey(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const publishableKey =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  return publishableKey || null
}

export function getSupabasePublicEnv(
  env: NodeJS.ProcessEnv = process.env
): SupabasePublicEnv | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey = selectSupabasePublicKey(env)

  if (!url || !publishableKey) {
    return null
  }

  return {
    url,
    publishableKey,
  }
}

export function hasSupabasePublicEnv(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return getSupabasePublicEnv(env) !== null
}

export function requireSupabasePublicEnv(
  env: NodeJS.ProcessEnv = process.env
): SupabasePublicEnv {
  const publicEnv = getSupabasePublicEnv(env)

  if (!publicEnv) {
    throw new Error(
      'Missing Supabase public environment. Set NEXT_PUBLIC_SUPABASE_URL plus NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  return publicEnv
}

export function getSupabaseServiceRoleKey(
  env: NodeJS.ProcessEnv = process.env
): string | null {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return key || null
}

export function requireSupabaseServiceRoleKey(
  env: NodeJS.ProcessEnv = process.env
): string {
  const key = getSupabaseServiceRoleKey(env)

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.')
  }

  return key
}
