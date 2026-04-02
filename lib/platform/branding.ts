import type {
  BrandingSource,
  CurrentCoachRelationship,
  WorkoutAttributionSnapshot,
} from '@/lib/types/domain'

interface BrandingInput {
  relationship: CurrentCoachRelationship
  coachDisplayName?: string
  coachBookingUrl?: string
  coachAccentColor?: string
  appAccentColor?: string
}

export function resolveBrandingSource(
  relationship: CurrentCoachRelationship
): BrandingSource {
  return relationship.coachUserId ? 'coach' : 'app'
}

export function createWorkoutAttributionSnapshot(
  input: BrandingInput
): WorkoutAttributionSnapshot {
  const brandingSource = resolveBrandingSource(input.relationship)

  if (brandingSource === 'coach') {
    return {
      brandingSource,
      coachId: input.relationship.coachUserId,
      coachDisplayName: input.coachDisplayName ?? 'Coach',
      coachBookingUrl: input.coachBookingUrl ?? null,
      accentColor: input.coachAccentColor ?? '#f06d4f',
    }
  }

  return {
    brandingSource: 'app',
    coachId: null,
    coachDisplayName: null,
    coachBookingUrl: null,
    accentColor: input.appAccentColor ?? '#8ad1c2',
  }
}
