import type {
  CoachDirectoryEntry,
  CurrentCoachRelationship,
  Profile,
  WorkoutSummary,
} from '@/lib/types/domain'
import { createWorkoutAttributionSnapshot } from '@/lib/platform/branding'

export const mockCurrentUser: Profile = {
  id: 'user-maya',
  userName: 'maya.moves',
  email: 'maya@example.com',
  firstName: 'Maya',
  lastName: 'Lopez',
  nationality: 'Canadian',
  city: 'Coquitlam',
  region: 'BC',
  roles: ['trainee'],
}

export const mockCoachDirectory: CoachDirectoryEntry[] = [
  {
    profile: {
      id: 'coach-lena',
      userName: 'lena.formlab',
      email: 'hidden@example.com',
      firstName: 'Lena',
      lastName: 'Park',
      roles: ['coach'],
    },
    coachProfile: {
      userId: 'coach-lena',
      nickname: 'Coach Lena',
      phoneNumber: 'private',
      pictureUrl:
        'https://images.unsplash.com/photo-1541534401786-2077eed87a72?auto=format&fit=crop&w=900&q=80',
      shortBio: 'Strength-first coach helping beginners build consistency and cleaner reps.',
      professionalCredentials: 'NASM CPT',
    },
    businessProfile: {
      userId: 'coach-lena',
      businessName: 'Formlab Coaching',
      businessMotto: 'Move cleaner. Build longer.',
      businessLocation: 'Vancouver, BC',
      instagramUrl: 'https://instagram.com/formlab',
      linkedinUrl: 'https://linkedin.com/in/lena-park',
    },
    directory: {
      userId: 'coach-lena',
      isApproved: true,
      visibilityEnabled: true,
      applicationStatus: 'approved',
    },
  },
  {
    profile: {
      id: 'coach-jules',
      userName: 'jules.training',
      email: 'hidden@example.com',
      firstName: 'Jules',
      lastName: 'Mendes',
      roles: ['coach'],
    },
    coachProfile: {
      userId: 'coach-jules',
      nickname: 'Jules',
      phoneNumber: 'private',
      pictureUrl:
        'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80',
      shortBio: 'Mobile-first coach for busy trainees who need short sessions and honest feedback.',
    },
    businessProfile: {
      userId: 'coach-jules',
      businessName: 'Mendes Motion',
      businessLocation: 'Burnaby, BC',
      youtubeUrl: 'https://youtube.com/@mendesmotion',
    },
    directory: {
      userId: 'coach-jules',
      isApproved: true,
      visibilityEnabled: true,
      applicationStatus: 'approved',
    },
  },
]

export const mockRelationship: CurrentCoachRelationship = {
  traineeUserId: mockCurrentUser.id,
  coachUserId: null,
  attachedVia: 'none',
  updatedAt: '2026-04-01T12:00:00Z',
}

export const mockHistory: WorkoutSummary[] = [
  {
    id: 'workout-1',
    exercise: 'push-ups',
    occurredAt: '2026-03-30T08:00:00Z',
    durationSeconds: 82,
    goodFormReps: 18,
    totalReps: 21,
    formScore: 85.7,
    effortScore: 67,
    attribution: createWorkoutAttributionSnapshot({
      relationship: {
        traineeUserId: mockCurrentUser.id,
        coachUserId: 'coach-lena',
        attachedVia: 'invite',
        updatedAt: '2026-03-30T08:00:00Z',
      },
      coachDisplayName: 'Coach Lena',
      coachBookingUrl: 'https://example.com/lena',
      coachAccentColor: '#f06d4f',
    }),
  },
  {
    id: 'workout-2',
    exercise: 'push-ups',
    occurredAt: '2026-04-01T08:00:00Z',
    durationSeconds: 88,
    goodFormReps: 20,
    totalReps: 23,
    formScore: 86.9,
    effortScore: 72,
    attribution: createWorkoutAttributionSnapshot({
      relationship: mockRelationship,
      appAccentColor: '#8ad1c2',
    }),
  },
]

export const mockPendingCoachProfiles: Profile[] = [
  {
    id: 'user-sora',
    userName: 'sora.strength',
    email: 'sora@example.com',
    firstName: 'Sora',
    lastName: 'Ng',
    roles: ['trainee'],
  },
]
