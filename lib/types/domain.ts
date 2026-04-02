export type UserRole = 'trainee' | 'coach' | 'admin'

export type CoachApplicationStatus = 'pending' | 'approved' | 'rejected'

export type BrandingSource = 'app' | 'coach'

export type ExerciseType =
  | 'push-ups'
  | 'squats'
  | 'crunches'
  | 'burpees'
  | 'lunges'

export interface Profile {
  id: string
  userName: string
  email: string
  firstName?: string
  lastName?: string
  nationality?: string
  city?: string
  region?: string
  roles: UserRole[]
}

export interface CoachProfile {
  userId: string
  nickname: string
  phoneNumber: string
  pictureUrl: string
  shortBio?: string
  professionalCredentials?: string
}

export interface CoachBusinessProfile {
  userId: string
  businessName?: string
  businessMotto?: string
  businessLogoUrl?: string
  businessLocation?: string
  businessPhoneNumber?: string
  businessEmail?: string
  instagramUrl?: string
  youtubeUrl?: string
  facebookUrl?: string
  linkedinUrl?: string
}

export interface CoachDirectorySettings {
  userId: string
  isApproved: boolean
  visibilityEnabled: boolean
  applicationStatus: CoachApplicationStatus
}

export interface CurrentCoachRelationship {
  traineeUserId: string
  coachUserId: string | null
  attachedVia: 'invite' | 'directory' | 'none'
  updatedAt: string
}

export interface WorkoutAttributionSnapshot {
  brandingSource: BrandingSource
  coachId: string | null
  coachDisplayName: string | null
  coachBookingUrl: string | null
  accentColor: string
}

export interface WorkoutSummary {
  id: string
  exercise: ExerciseType
  occurredAt: string
  goodFormReps: number
  totalReps: number
  formScore: number
  effortScore: number
  attribution: WorkoutAttributionSnapshot
}

export interface CoachDirectoryEntry {
  profile: Profile
  coachProfile: CoachProfile
  businessProfile: CoachBusinessProfile
  directory: CoachDirectorySettings
}

export interface GuestSessionResult {
  exercise: ExerciseType
  goodFormReps: number
  totalReps: number
  formScore: number
  effortScore: number
  brandingSource: BrandingSource
}
