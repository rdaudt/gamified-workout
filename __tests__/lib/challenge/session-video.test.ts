import { buildChallengeFrameSnapshot } from '@/lib/challenge/session-video'

describe('challenge session video helpers', () => {
  it('formats the burned-in hud labels from session state', () => {
    expect(
      buildChallengeFrameSnapshot({
        status: 'live',
        countdownValue: null,
        repCount: 17,
        elapsedSeconds: 95,
        trackingScore: 83,
        bodyHeight: 0.42,
      })
    ).toEqual({
      status: 'live',
      countdownValue: null,
      repCount: 17,
      elapsedLabel: '1:35',
      trackingLabel: '83%',
      bodyHeight: 0.42,
    })
  })

  it('clamps body height into the drawable range', () => {
    expect(
      buildChallengeFrameSnapshot({
        status: 'countdown',
        countdownValue: 3,
        repCount: 0,
        elapsedSeconds: 0,
        trackingScore: 0,
        bodyHeight: 2.5,
      }).bodyHeight
    ).toBe(1)
  })
})
