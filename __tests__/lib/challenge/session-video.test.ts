import {
  buildChallengeFrameSnapshot,
  getPreferredRecordingFormat,
} from '@/lib/challenge/session-video'

describe('challenge session video helpers', () => {
  it('formats the burned-in hud labels from the temporal counter state', () => {
    expect(
      buildChallengeFrameSnapshot({
        status: 'live',
        countdownValue: null,
        repCount: 17,
        elapsedSeconds: 95,
        trackingScore: 83,
        bodyHeight: 0.42,
        counterPhase: 'down',
        supportActive: true,
        smoothedDepthSignal: 0.67,
        topThreshold: 0.34,
        bottomThreshold: 0.73,
      })
    ).toEqual({
      status: 'live',
      countdownValue: null,
      repCount: 17,
      elapsedLabel: '1:35',
      trackingLabel: '83%',
      bodyHeight: 0.42,
      counterPhaseLabel: 'DOWN',
      supportLabel: 'YES',
      signalLabel: '67%',
      topThresholdLabel: '34%',
      bottomThresholdLabel: '73%',
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
        counterPhase: 'search',
        supportActive: false,
        smoothedDepthSignal: 0,
        topThreshold: null,
        bottomThreshold: null,
      }).bodyHeight
    ).toBe(1)
  })

  it('prefers mp4 export over webm when both are available', () => {
    const format = getPreferredRecordingFormat((mimeType) =>
      [
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
        'video/webm',
      ].includes(mimeType)
    )

    expect(format).toEqual(
      expect.objectContaining({
        extension: 'mp4',
        isIPhoneFriendly: true,
        label: 'MP4',
      })
    )
  })
})
