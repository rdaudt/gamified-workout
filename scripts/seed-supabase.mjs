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

  for (const candidate of ['.env.local', '.env', '.env.example']) {
    loadEnvFile(path.join(cwd, candidate))
  }
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
}

function getPublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim()
}

const seedPassword = 'BeatPastYou123!'

const workoutIds = {
  mayaCoachSession: '00000000-0000-0000-0000-000000000101',
  mayaAppSession: '00000000-0000-0000-0000-000000000102',
}

const applicationIds = {
  sora: '00000000-0000-0000-0000-000000000201',
}

const usersToSeed = [
  {
    email: 'alex.admin@example.com',
    password: seedPassword,
    userName: 'alex.admin',
    firstName: 'Alex',
    lastName: 'Rivera',
    roles: ['trainee', 'admin'],
    city: 'Vancouver',
    region: 'BC',
    nationality: 'Canadian',
  },
  {
    email: 'maya.moves@example.com',
    password: seedPassword,
    userName: 'maya.moves',
    firstName: 'Maya',
    lastName: 'Lopez',
    roles: ['trainee'],
    city: 'Coquitlam',
    region: 'BC',
    nationality: 'Canadian',
  },
  {
    email: 'lena.formlab@example.com',
    password: seedPassword,
    userName: 'lena.formlab',
    firstName: 'Lena',
    lastName: 'Park',
    roles: ['trainee', 'coach'],
    city: 'Vancouver',
    region: 'BC',
    nationality: 'Canadian',
    coachProfile: {
      nickname: 'Coach Lena',
      phone_number: '+1-604-555-0101',
      picture_url: 'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=600&q=80',
      short_bio:
        'Strength-first coach helping beginners build consistency and cleaner reps.',
      professional_credentials: 'NASM CPT',
      booking_url: 'https://formlab.example.com/book',
      accent_color: '#f06d4f',
    },
    coachBusinessProfile: {
      business_name: 'Formlab Coaching',
      business_motto: 'Move cleaner. Build longer.',
      business_logo_url: null,
      business_location: 'Vancouver, BC',
      business_phone_number: null,
      business_email: 'hello@formlab.example.com',
      instagram_url: 'https://instagram.com/formlab',
      youtube_url: null,
      facebook_url: null,
      linkedin_url: 'https://linkedin.com/in/lena-park',
    },
    coachDirectorySettings: {
      application_status: 'approved',
      visibility_enabled: true,
    },
  },
  {
    email: 'jules.training@example.com',
    password: seedPassword,
    userName: 'jules.training',
    firstName: 'Jules',
    lastName: 'Mendes',
    roles: ['trainee', 'coach'],
    city: 'Burnaby',
    region: 'BC',
    nationality: 'Canadian',
    coachProfile: {
      nickname: 'Jules',
      phone_number: '+1-604-555-0102',
      picture_url: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=80',
      short_bio:
        'Mobile-first coach for busy trainees who need short sessions and honest feedback.',
      professional_credentials: null,
      booking_url: 'https://mendesmotion.example.com/book',
      accent_color: '#f08a4b',
    },
    coachBusinessProfile: {
      business_name: 'Mendes Motion',
      business_motto: null,
      business_logo_url: null,
      business_location: 'Burnaby, BC',
      business_phone_number: null,
      business_email: 'book@mendesmotion.example.com',
      instagram_url: null,
      youtube_url: 'https://youtube.com/@mendesmotion',
      facebook_url: null,
      linkedin_url: null,
    },
    coachDirectorySettings: {
      application_status: 'approved',
      visibility_enabled: true,
    },
  },
  {
    email: 'sora.strength@example.com',
    password: seedPassword,
    userName: 'sora.strength',
    firstName: 'Sora',
    lastName: 'Ng',
    roles: ['trainee'],
    city: 'New Westminster',
    region: 'BC',
    nationality: 'Canadian',
    coachApplication: {
      id: applicationIds.sora,
      status: 'pending',
      payload: {
        motivation:
          'I coach beginner-friendly bodyweight programs and want to use the directory.',
        years_experience: 3,
      },
      review_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      submitted_at: '2026-04-01T18:00:00Z',
    },
    coachDirectorySettings: {
      application_status: 'pending',
      visibility_enabled: false,
    },
  },
]

async function ensureUser(authAdmin, config) {
  let page = 1
  let existingUser = null

  while (!existingUser) {
    const { data, error } = await authAdmin.listUsers({ page, perPage: 200 })

    if (error) {
      throw error
    }

    existingUser = data.users.find((user) => user.email === config.email) ?? null

    if (existingUser || data.users.length < 200) {
      break
    }

    page += 1
  }

  if (!existingUser) {
    const { data, error } = await authAdmin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true,
      user_metadata: {
        user_name: config.userName,
        first_name: config.firstName,
        last_name: config.lastName,
        city: config.city,
        region: config.region,
        nationality: config.nationality,
        is_age_confirmed: true,
      },
    })

    if (error) {
      throw error
    }

    existingUser = data.user
  } else {
    const { error } = await authAdmin.updateUserById(existingUser.id, {
      password: config.password,
      email_confirm: true,
      user_metadata: {
        user_name: config.userName,
        first_name: config.firstName,
        last_name: config.lastName,
        city: config.city,
        region: config.region,
        nationality: config.nationality,
        is_age_confirmed: true,
      },
    })

    if (error) {
      throw error
    }
  }

  return existingUser
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

  const adminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const authAdmin = adminClient.auth.admin
  const usersByEmail = new Map()

  for (const userConfig of usersToSeed) {
    const user = await ensureUser(authAdmin, userConfig)
    usersByEmail.set(userConfig.email, user)
  }

  const profiles = usersToSeed.map((config) => {
    const user = usersByEmail.get(config.email)

    return {
      id: user.id,
      user_name: config.userName,
      email: config.email,
      first_name: config.firstName,
      last_name: config.lastName,
      nationality: config.nationality,
      city: config.city,
      region: config.region,
      is_age_confirmed: true,
    }
  })

  const userRoles = usersToSeed.flatMap((config) => {
    const user = usersByEmail.get(config.email)

    return config.roles.map((role) => ({
      user_id: user.id,
      role,
    }))
  })

  const coachProfiles = usersToSeed
    .filter((config) => config.coachProfile)
    .map((config) => {
      const user = usersByEmail.get(config.email)

      return {
        user_id: user.id,
        ...config.coachProfile,
      }
    })

  const coachBusinessProfiles = usersToSeed
    .filter((config) => config.coachBusinessProfile)
    .map((config) => {
      const user = usersByEmail.get(config.email)

      return {
        user_id: user.id,
        ...config.coachBusinessProfile,
      }
    })

  const coachDirectorySettings = usersToSeed
    .filter((config) => config.coachDirectorySettings)
    .map((config) => {
      const user = usersByEmail.get(config.email)

      return {
        user_id: user.id,
        ...config.coachDirectorySettings,
      }
    })

  const coachApplications = usersToSeed
    .filter((config) => config.coachApplication)
    .map((config) => {
      const user = usersByEmail.get(config.email)

      return {
        user_id: user.id,
        ...config.coachApplication,
      }
    })

  const maya = usersByEmail.get('maya.moves@example.com')
  const lena = usersByEmail.get('lena.formlab@example.com')

  const traineeRelationships = [
    {
      trainee_user_id: maya.id,
      coach_user_id: lena.id,
      attached_via: 'directory',
    },
  ]

  const workouts = [
    {
      id: workoutIds.mayaCoachSession,
      user_id: maya.id,
      exercise: 'push-ups',
      occurred_at: '2026-03-30T08:00:00Z',
      good_form_reps: 18,
      total_reps: 21,
      form_score: 85.7,
      effort_score: 67,
      duration_seconds: 82,
      session_classification: 'coach-guided',
      branding_source: 'coach',
      coach_id: lena.id,
      coach_display_name: 'Coach Lena',
      coach_booking_url: 'https://formlab.example.com/book',
      accent_color: '#f06d4f',
    },
    {
      id: workoutIds.mayaAppSession,
      user_id: maya.id,
      exercise: 'push-ups',
      occurred_at: '2026-04-01T08:00:00Z',
      good_form_reps: 20,
      total_reps: 23,
      form_score: 86.9,
      effort_score: 72,
      duration_seconds: 88,
      session_classification: 'solo',
      branding_source: 'app',
      coach_id: null,
      coach_display_name: null,
      coach_booking_url: null,
      accent_color: '#8ad1c2',
    },
  ]

  const operations = [
    adminClient.from('profiles').upsert(profiles, { onConflict: 'id' }),
    adminClient.from('user_roles').upsert(userRoles, { onConflict: 'user_id,role' }),
    adminClient.from('coach_profiles').upsert(coachProfiles, { onConflict: 'user_id' }),
    adminClient
      .from('coach_business_profiles')
      .upsert(coachBusinessProfiles, { onConflict: 'user_id' }),
    adminClient
      .from('coach_directory_settings')
      .upsert(coachDirectorySettings, { onConflict: 'user_id' }),
    adminClient.from('coach_applications').upsert(coachApplications, { onConflict: 'id' }),
    adminClient
      .from('trainee_coach_relationships')
      .upsert(traineeRelationships, { onConflict: 'trainee_user_id' }),
    adminClient.from('workouts').upsert(workouts, { onConflict: 'id' }),
  ]

  for (const operation of operations) {
    const { error } = await operation

    if (error) {
      throw error
    }
  }

  console.log('Supabase seed completed.')
  console.log('')
  console.log('Created or updated users:')

  for (const config of usersToSeed) {
    console.log(`- ${config.email}  password: ${config.password}`)
  }

  console.log('')
  console.log('Seeded domain data:')
  console.log('- 5 profiles')
  console.log('- 7 role assignments')
  console.log('- 2 approved public coaches')
  console.log('- 1 pending coach application')
  console.log('- 1 trainee-coach relationship')
  console.log('- 2 workouts for Maya')
}

run().catch((error) => {
  console.error('Supabase seed failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
