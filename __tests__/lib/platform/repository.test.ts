import {
  buildCoachDirectoryEntries,
  mapPendingCoachApplicantProfiles,
  mapWorkoutRow,
} from '@/lib/platform/repository'
import type { Tables } from '@/lib/supabase/database.types'

describe('platform repository helpers', () => {
  it('builds coach directory entries from separate table payloads', () => {
    const entries = buildCoachDirectoryEntries({
      settings: [
        {
          user_id: 'coach-1',
          application_status: 'approved',
          is_approved: true,
          visibility_enabled: true,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ],
      profiles: [
        {
          id: 'coach-1',
          user_name: 'coach.one',
          email: 'coach@example.com',
          first_name: 'Coach',
          last_name: 'One',
          nationality: null,
          city: 'Vancouver',
          region: 'BC',
          is_age_confirmed: true,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ],
      coachProfiles: [
        {
          user_id: 'coach-1',
          nickname: 'Coach One',
          phone_number: '555-555-0000',
          picture_url: '/coach-one.jpg',
          short_bio: 'Strength coach',
          professional_credentials: 'CPT',
          booking_url: 'https://example.com/book',
          accent_color: '#f06d4f',
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ],
      businessProfiles: [],
    })

    expect(entries).toHaveLength(1)
    expect(entries[0]?.profile.userName).toBe('coach.one')
    expect(entries[0]?.coachProfile.nickname).toBe('Coach One')
    expect(entries[0]?.directory.visibilityEnabled).toBe(true)
  })

  it('maps pending applications back to profile rows', () => {
    const pendingProfiles = mapPendingCoachApplicantProfiles(
      [
        {
          id: 'application-1',
          user_id: 'user-1',
          status: 'pending',
          payload: {},
          review_notes: null,
          reviewed_at: null,
          reviewed_by: null,
          submitted_at: '2026-04-01T00:00:00Z',
          created_at: '2026-04-01T00:00:00Z',
        },
      ],
      [
        {
          id: 'user-1',
          user_name: 'maya.moves',
          email: 'maya@example.com',
          first_name: 'Maya',
          last_name: 'Lopez',
          nationality: null,
          city: null,
          region: null,
          is_age_confirmed: true,
          created_at: '2026-04-01T00:00:00Z',
          updated_at: '2026-04-01T00:00:00Z',
        },
      ]
    )

    expect(pendingProfiles).toEqual([
      expect.objectContaining({
        id: 'user-1',
        userName: 'maya.moves',
        roles: ['trainee'],
      }),
    ])
  })

  it('maps workout rows into the public domain shape', () => {
    const workout = mapWorkoutRow({
      id: 'workout-1',
      user_id: 'user-1',
      exercise: 'push-ups',
      occurred_at: '2026-04-01T00:00:00Z',
      good_form_reps: 20,
      total_reps: 24,
      form_score: 83.5,
      effort_score: 71.25,
      duration_seconds: 90,
      session_classification: 'baseline',
      branding_source: 'coach',
      coach_id: 'coach-1',
      coach_display_name: 'Coach One',
      coach_booking_url: 'https://example.com/book',
      accent_color: '#f06d4f',
      created_at: '2026-04-01T00:00:00Z',
    } satisfies Tables<'workouts'>)

    expect(workout).toEqual(
      expect.objectContaining({
        exercise: 'push-ups',
        formScore: 83.5,
        attribution: expect.objectContaining({
          brandingSource: 'coach',
          coachId: 'coach-1',
        }),
      })
    )
  })
})
