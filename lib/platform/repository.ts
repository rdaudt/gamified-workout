import type { User } from '@supabase/supabase-js'
import {
  mockCoachDirectory,
  mockCurrentUser,
  mockHistory,
  mockPendingCoachProfiles,
  mockRelationship,
} from '@/lib/platform/mock-data'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { hasSupabasePublicEnv } from '@/lib/supabase/env'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type {
  CoachBusinessProfile,
  CoachDirectoryEntry,
  CoachDirectorySettings,
  CoachProfile,
  CurrentCoachRelationship,
  PublicCoachProfile,
  Profile,
  UserRole,
  WorkoutSummary,
} from '@/lib/types/domain'

type ProfileRow = Tables<'profiles'>
type UserRoleRow = Tables<'user_roles'>
type CoachProfileRow = Tables<'coach_profiles'>
type CoachBusinessProfileRow = Tables<'coach_business_profiles'>
type CoachDirectorySettingsRow = Tables<'coach_directory_settings'>
type TraineeCoachRelationshipRow = Tables<'trainee_coach_relationships'>
type WorkoutRow = Tables<'workouts'>
type CoachApplicationRow = Tables<'coach_applications'>

export type PlatformDataSource = 'mock' | 'supabase'

export interface AccountPageData {
  source: PlatformDataSource
  currentUser: Profile | null
  relationship: CurrentCoachRelationship | null
  currentCoachName: string | null
}

export interface CoachDirectoryPageData {
  source: PlatformDataSource
  coaches: CoachDirectoryEntry[]
}

export interface HistoryPageData {
  source: PlatformDataSource
  currentUser: Profile | null
  workouts: WorkoutSummary[]
}

export interface AdminPageData {
  source: PlatformDataSource
  currentUser: Profile | null
  pendingProfiles: Profile[]
  isAdmin: boolean
}

export interface CoachPublicPageData {
  source: PlatformDataSource
  coach: PublicCoachProfile | null
}

interface CoachDirectoryBundle {
  profiles: ProfileRow[]
  coachProfiles: CoachProfileRow[]
  businessProfiles: CoachBusinessProfileRow[]
  settings: CoachDirectorySettingsRow[]
}

export function mapProfileRow(profile: ProfileRow, roles: UserRole[]): Profile {
  return {
    id: profile.id,
    userName: profile.user_name,
    email: profile.email,
    firstName: profile.first_name ?? undefined,
    lastName: profile.last_name ?? undefined,
    nationality: profile.nationality ?? undefined,
    city: profile.city ?? undefined,
    region: profile.region ?? undefined,
    roles,
  }
}

export function mapRelationshipRow(
  relationship: TraineeCoachRelationshipRow
): CurrentCoachRelationship {
  return {
    traineeUserId: relationship.trainee_user_id,
    coachUserId: relationship.coach_user_id,
    attachedVia: relationship.attached_via,
    updatedAt: relationship.updated_at,
  }
}

export function mapWorkoutRow(workout: WorkoutRow): WorkoutSummary {
  return {
    id: workout.id,
    exercise: workout.exercise,
    occurredAt: workout.occurred_at,
    durationSeconds: workout.duration_seconds ?? 0,
    goodFormReps: workout.good_form_reps,
    totalReps: workout.total_reps,
    formScore: Number(workout.form_score),
    effortScore: Number(workout.effort_score),
    attribution: {
      brandingSource: workout.branding_source,
      coachId: workout.coach_id,
      coachDisplayName: workout.coach_display_name,
      coachBookingUrl: workout.coach_booking_url,
      accentColor: workout.accent_color,
    },
  }
}

export function buildCoachDirectoryEntries(
  bundle: CoachDirectoryBundle
): CoachDirectoryEntry[] {
  const profileMap = new Map(bundle.profiles.map((profile) => [profile.id, profile]))
  const coachProfileMap = new Map(
    bundle.coachProfiles.map((profile) => [profile.user_id, profile])
  )
  const businessProfileMap = new Map(
    bundle.businessProfiles.map((profile) => [profile.user_id, profile])
  )

  return bundle.settings.flatMap((setting) => {
    const entry = buildCoachProfileFromRows(
      profileMap.get(setting.user_id),
      coachProfileMap.get(setting.user_id),
      businessProfileMap.get(setting.user_id),
      setting
    )

    return entry ? [entry] : []
  })
}

export function mapPendingCoachApplicantProfiles(
  applications: CoachApplicationRow[],
  profiles: ProfileRow[]
): Profile[] {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))

  return applications.flatMap((application) => {
    const profile = profileMap.get(application.user_id)

    if (!profile) {
      return []
    }

    return [mapProfileRow(profile, ['trainee'])]
  })
}

function mapCoachProfileRow(profile: CoachProfileRow): CoachProfile {
  return {
    userId: profile.user_id,
    nickname: profile.nickname,
    phoneNumber: profile.phone_number,
    pictureUrl: profile.picture_url,
    shortBio: profile.short_bio ?? undefined,
    professionalCredentials: profile.professional_credentials ?? undefined,
  }
}

function mapCoachBusinessProfileRow(
  profile: CoachBusinessProfileRow | undefined,
  userId: string
): CoachBusinessProfile {
  return {
    userId,
    businessName: profile?.business_name ?? undefined,
    businessMotto: profile?.business_motto ?? undefined,
    businessLogoUrl: profile?.business_logo_url ?? undefined,
    businessLocation: profile?.business_location ?? undefined,
    businessPhoneNumber: profile?.business_phone_number ?? undefined,
    businessEmail: profile?.business_email ?? undefined,
    instagramUrl: profile?.instagram_url ?? undefined,
    youtubeUrl: profile?.youtube_url ?? undefined,
    facebookUrl: profile?.facebook_url ?? undefined,
    linkedinUrl: profile?.linkedin_url ?? undefined,
  }
}

function mapCoachDirectorySettingsRow(
  setting: CoachDirectorySettingsRow
): CoachDirectorySettings {
  return {
    userId: setting.user_id,
    isApproved: setting.is_approved,
    visibilityEnabled: setting.visibility_enabled,
    applicationStatus: setting.application_status,
  }
}

function buildCoachProfileFromRows(
  profile: ProfileRow | undefined,
  coachProfile: CoachProfileRow | undefined,
  businessProfile: CoachBusinessProfileRow | undefined,
  setting: CoachDirectorySettingsRow
): PublicCoachProfile | null {
  if (!profile || !coachProfile) {
    return null
  }

  return {
    profile: mapProfileRow(profile, ['coach']),
    coachProfile: mapCoachProfileRow(coachProfile),
    businessProfile: mapCoachBusinessProfileRow(businessProfile, setting.user_id),
    directory: mapCoachDirectorySettingsRow(setting),
  }
}

function buildFallbackProfileFromUser(
  user: User,
  roles: UserRole[],
  profile: ProfileRow | null
): Profile {
  if (profile) {
    return mapProfileRow(profile, roles)
  }

  const metadata = user.user_metadata
  const userName =
    typeof metadata.user_name === 'string' && metadata.user_name.trim().length > 0
      ? metadata.user_name
      : user.email?.split('@')[0] ?? 'member'

  return {
    id: user.id,
    userName,
    email: user.email ?? '',
    firstName:
      typeof metadata.first_name === 'string' ? metadata.first_name : undefined,
    lastName: typeof metadata.last_name === 'string' ? metadata.last_name : undefined,
    nationality:
      typeof metadata.nationality === 'string' ? metadata.nationality : undefined,
    city: typeof metadata.city === 'string' ? metadata.city : undefined,
    region: typeof metadata.region === 'string' ? metadata.region : undefined,
    roles,
  }
}

function buildUnassignedRelationship(userId: string): CurrentCoachRelationship {
  return {
    traineeUserId: userId,
    coachUserId: null,
    attachedVia: 'none',
    updatedAt: new Date(0).toISOString(),
  }
}

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

async function fetchUserRoles(
  userId: string
): Promise<Database['public']['Enums']['user_role'][]> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  const roles = (data ?? []).map((row: Pick<UserRoleRow, 'role'>) => row.role)

  return roles.length > 0 ? roles : ['trainee']
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, user_name, email, first_name, last_name, nationality, city, region, is_age_confirmed, created_at, updated_at'
    )
    .eq('id', userId)
    .maybeSingle()

  return data
}

async function fetchRelationship(
  userId: string
): Promise<TraineeCoachRelationshipRow | null> {
  const supabase = createSupabaseServerClient()
  const { data } = await supabase
    .from('trainee_coach_relationships')
    .select('trainee_user_id, coach_user_id, attached_via, created_at, updated_at')
    .eq('trainee_user_id', userId)
    .maybeSingle()

  return data
}

async function fetchCoachDisplayName(coachUserId: string): Promise<string | null> {
  const supabase = createSupabaseServerClient()
  const [{ data: coachProfileData }, { data: profileData }] = await Promise.all([
    supabase
      .from('coach_profiles')
      .select('nickname')
      .eq('user_id', coachUserId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('first_name, last_name, user_name')
      .eq('id', coachUserId)
      .maybeSingle(),
  ])

  const coachProfile = coachProfileData as Pick<CoachProfileRow, 'nickname'> | null
  const profile = profileData as Pick<
    ProfileRow,
    'first_name' | 'last_name' | 'user_name'
  > | null

  if (coachProfile?.nickname) {
    return coachProfile.nickname
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')

  return fullName || profile?.user_name || null
}

export async function getAccountPageData(): Promise<AccountPageData> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'mock',
      currentUser: mockCurrentUser,
      relationship: mockRelationship,
      currentCoachName: null,
    }
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      source: 'supabase',
      currentUser: null,
      relationship: null,
      currentCoachName: null,
    }
  }

  const [roles, profile, relationshipRow] = await Promise.all([
    fetchUserRoles(user.id),
    fetchProfile(user.id),
    fetchRelationship(user.id),
  ])

  const relationship = relationshipRow
    ? mapRelationshipRow(relationshipRow)
    : buildUnassignedRelationship(user.id)

  const currentCoachName = relationship.coachUserId
    ? await fetchCoachDisplayName(relationship.coachUserId)
    : null

  return {
    source: 'supabase',
    currentUser: buildFallbackProfileFromUser(user, roles, profile),
    relationship,
    currentCoachName,
  }
}

export async function getCoachDirectoryPageData(): Promise<CoachDirectoryPageData> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'mock',
      coaches: mockCoachDirectory,
    }
  }

  const supabase = createSupabaseServerClient()
  const { data: settingsData } = await supabase
    .from('coach_directory_settings')
    .select(
      'user_id, is_approved, visibility_enabled, application_status, created_at, updated_at'
    )
    .eq('application_status', 'approved')
    .eq('visibility_enabled', true)
    .order('updated_at', { ascending: false })

  const settings = (settingsData ?? []) as CoachDirectorySettingsRow[]

  if (!settings || settings.length === 0) {
    return {
      source: 'supabase',
      coaches: [],
    }
  }

  const userIds = settings.map((setting) => setting.user_id)
  const [
    { data: profilesData },
    { data: coachProfilesData },
    { data: businessProfilesData },
  ] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, user_name, email, first_name, last_name, nationality, city, region, is_age_confirmed, created_at, updated_at'
        )
        .in('id', userIds),
      supabase
        .from('coach_profiles')
        .select(
          'user_id, nickname, phone_number, picture_url, short_bio, professional_credentials, booking_url, accent_color, created_at, updated_at'
        )
        .in('user_id', userIds),
      supabase
        .from('coach_business_profiles')
        .select(
          'user_id, business_name, business_motto, business_logo_url, business_location, business_phone_number, business_email, instagram_url, youtube_url, facebook_url, linkedin_url, created_at, updated_at'
        )
        .in('user_id', userIds),
    ])

  const profiles = (profilesData ?? []) as ProfileRow[]
  const coachProfiles = (coachProfilesData ?? []) as CoachProfileRow[]
  const businessProfiles = (businessProfilesData ?? []) as CoachBusinessProfileRow[]

  return {
    source: 'supabase',
    coaches: buildCoachDirectoryEntries({
      profiles,
      coachProfiles,
      businessProfiles,
      settings,
    }),
  }
}

export async function getCoachPublicPageData(
  slug: string
): Promise<CoachPublicPageData> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'mock',
      coach:
        mockCoachDirectory.find((entry) => entry.profile.userName === slug) ?? null,
    }
  }

  const supabase = createSupabaseServerClient()
  const { data: profileData } = await supabase
    .from('profiles')
    .select(
      'id, user_name, email, first_name, last_name, nationality, city, region, is_age_confirmed, created_at, updated_at'
    )
    .eq('user_name', slug)
    .maybeSingle()

  const profile = profileData as ProfileRow | null

  if (!profile) {
    return {
      source: 'supabase',
      coach: null,
    }
  }

  const [{ data: coachProfileData }, { data: businessProfileData }, { data: settingsData }] =
    await Promise.all([
      supabase
        .from('coach_profiles')
        .select(
          'user_id, nickname, phone_number, picture_url, short_bio, professional_credentials, booking_url, accent_color, created_at, updated_at'
        )
        .eq('user_id', profile.id)
        .maybeSingle(),
      supabase
        .from('coach_business_profiles')
        .select(
          'user_id, business_name, business_motto, business_logo_url, business_location, business_phone_number, business_email, instagram_url, youtube_url, facebook_url, linkedin_url, created_at, updated_at'
        )
        .eq('user_id', profile.id)
        .maybeSingle(),
      supabase
        .from('coach_directory_settings')
        .select(
          'user_id, is_approved, visibility_enabled, application_status, created_at, updated_at'
        )
        .eq('user_id', profile.id)
        .maybeSingle(),
    ])

  const coachProfile = coachProfileData as CoachProfileRow | null
  const businessProfile = businessProfileData as CoachBusinessProfileRow | null
  const settings = settingsData as CoachDirectorySettingsRow | null

  if (
    !coachProfile ||
    !settings ||
    settings.application_status !== 'approved' ||
    !settings.visibility_enabled
  ) {
    return {
      source: 'supabase',
      coach: null,
    }
  }

  return {
    source: 'supabase',
    coach: buildCoachProfileFromRows(
      profile,
      coachProfile,
      businessProfile ?? undefined,
      settings
    ),
  }
}

export async function getHistoryPageData(): Promise<HistoryPageData> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'mock',
      currentUser: mockCurrentUser,
      workouts: mockHistory,
    }
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      source: 'supabase',
      currentUser: null,
      workouts: [],
    }
  }

  const [roles, profile, workouts] = await Promise.all([
    fetchUserRoles(user.id),
    fetchProfile(user.id),
    createSupabaseServerClient()
      .from('workouts')
      .select(
        'id, user_id, exercise, occurred_at, good_form_reps, total_reps, form_score, effort_score, duration_seconds, session_classification, branding_source, coach_id, coach_display_name, coach_booking_url, accent_color, created_at'
      )
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false }),
  ])

  return {
    source: 'supabase',
    currentUser: buildFallbackProfileFromUser(user, roles, profile),
    workouts: (workouts.data ?? []).map(mapWorkoutRow),
  }
}

export async function getAdminPageData(): Promise<AdminPageData> {
  if (!hasSupabasePublicEnv()) {
    return {
      source: 'mock',
      currentUser: mockCurrentUser,
      pendingProfiles: mockPendingCoachProfiles,
      isAdmin: true,
    }
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      source: 'supabase',
      currentUser: null,
      pendingProfiles: [],
      isAdmin: false,
    }
  }

  const [roles, profile] = await Promise.all([fetchUserRoles(user.id), fetchProfile(user.id)])
  const currentUser = buildFallbackProfileFromUser(user, roles, profile)
  const isAdmin = currentUser.roles.includes('admin')

  if (!isAdmin) {
    return {
      source: 'supabase',
      currentUser,
      pendingProfiles: [],
      isAdmin: false,
    }
  }

  const supabase = createSupabaseServerClient()
  const { data: applicationsData } = await supabase
    .from('coach_applications')
    .select(
      'id, user_id, status, payload, review_notes, reviewed_at, reviewed_by, submitted_at, created_at'
    )
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })

  const applications = (applicationsData ?? []) as CoachApplicationRow[]
  const applicantIds = (applications ?? []).map((application) => application.user_id)
  const { data: profilesData } =
    applicantIds.length > 0
      ? await supabase
          .from('profiles')
          .select(
            'id, user_name, email, first_name, last_name, nationality, city, region, is_age_confirmed, created_at, updated_at'
          )
          .in('id', applicantIds)
      : { data: [] as ProfileRow[] }

  const profiles = (profilesData ?? []) as ProfileRow[]

  return {
    source: 'supabase',
    currentUser,
    pendingProfiles: mapPendingCoachApplicantProfiles(applications, profiles),
    isAdmin: true,
  }
}
