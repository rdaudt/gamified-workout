import { describe, expect, it } from 'vitest'
import {
  createWorkoutAttributionSnapshot,
  resolveBrandingSource,
} from '@/lib/platform/branding'
import type { CurrentCoachRelationship } from '@/lib/types/domain'

describe('resolveBrandingSource', () => {
  it('returns app when there is no current coach', () => {
    const relationship: CurrentCoachRelationship = {
      traineeUserId: 'trainee-1',
      coachUserId: null,
      attachedVia: 'none',
      updatedAt: '2026-04-01T00:00:00Z',
    }

    expect(resolveBrandingSource(relationship)).toBe('app')
  })

  it('returns coach when a current coach exists', () => {
    const relationship: CurrentCoachRelationship = {
      traineeUserId: 'trainee-1',
      coachUserId: 'coach-1',
      attachedVia: 'invite',
      updatedAt: '2026-04-01T00:00:00Z',
    }

    expect(resolveBrandingSource(relationship)).toBe('coach')
  })
})

describe('createWorkoutAttributionSnapshot', () => {
  it('builds an app-branded snapshot when no coach is attached', () => {
    const snapshot = createWorkoutAttributionSnapshot({
      relationship: {
        traineeUserId: 'trainee-1',
        coachUserId: null,
        attachedVia: 'none',
        updatedAt: '2026-04-01T00:00:00Z',
      },
      appAccentColor: '#8ad1c2',
    })

    expect(snapshot).toEqual({
      brandingSource: 'app',
      coachId: null,
      coachDisplayName: null,
      coachBookingUrl: null,
      accentColor: '#8ad1c2',
    })
  })

  it('builds a coach-branded snapshot when a coach is attached', () => {
    const snapshot = createWorkoutAttributionSnapshot({
      relationship: {
        traineeUserId: 'trainee-1',
        coachUserId: 'coach-1',
        attachedVia: 'directory',
        updatedAt: '2026-04-01T00:00:00Z',
      },
      coachDisplayName: 'Coach Jules',
      coachBookingUrl: 'https://example.com/book',
      coachAccentColor: '#f06d4f',
    })

    expect(snapshot).toEqual({
      brandingSource: 'coach',
      coachId: 'coach-1',
      coachDisplayName: 'Coach Jules',
      coachBookingUrl: 'https://example.com/book',
      accentColor: '#f06d4f',
    })
  })
})
