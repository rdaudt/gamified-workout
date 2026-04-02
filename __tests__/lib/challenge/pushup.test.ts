import {
  analyzePushupLandmarks,
  calculateEffortScore,
  calculateTrackingScore,
  defaultPushupThresholds,
  formatDuration,
  initialPushupCounterState,
  updatePushupCounter,
} from '@/lib/challenge/pushup'

function createBlankLandmarks() {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.95,
  }))
}

function createPushupPose() {
  const landmarks = createBlankLandmarks()

  landmarks[0] = { x: 0.32, y: 0.28, visibility: 0.95 }
  landmarks[11] = { x: 0.28, y: 0.32, visibility: 0.95 }
  landmarks[12] = { x: 0.38, y: 0.32, visibility: 0.95 }
  landmarks[13] = { x: 0.24, y: 0.45, visibility: 0.95 }
  landmarks[14] = { x: 0.42, y: 0.45, visibility: 0.95 }
  landmarks[15] = { x: 0.18, y: 0.7, visibility: 0.95 }
  landmarks[16] = { x: 0.48, y: 0.7, visibility: 0.95 }
  landmarks[23] = { x: 0.5, y: 0.35, visibility: 0.95 }
  landmarks[24] = { x: 0.58, y: 0.35, visibility: 0.95 }
  landmarks[25] = { x: 0.72, y: 0.37, visibility: 0.95 }
  landmarks[26] = { x: 0.78, y: 0.37, visibility: 0.95 }
  landmarks[27] = { x: 0.9, y: 0.39, visibility: 0.95 }
  landmarks[28] = { x: 0.96, y: 0.39, visibility: 0.95 }

  return landmarks
}

function createStandingPose() {
  const landmarks = createBlankLandmarks()

  landmarks[0] = { x: 0.5, y: 0.12, visibility: 0.95 }
  landmarks[11] = { x: 0.42, y: 0.22, visibility: 0.95 }
  landmarks[12] = { x: 0.58, y: 0.22, visibility: 0.95 }
  landmarks[13] = { x: 0.4, y: 0.34, visibility: 0.95 }
  landmarks[14] = { x: 0.6, y: 0.34, visibility: 0.95 }
  landmarks[15] = { x: 0.38, y: 0.48, visibility: 0.95 }
  landmarks[16] = { x: 0.62, y: 0.48, visibility: 0.95 }
  landmarks[23] = { x: 0.45, y: 0.5, visibility: 0.95 }
  landmarks[24] = { x: 0.55, y: 0.5, visibility: 0.95 }
  landmarks[25] = { x: 0.46, y: 0.7, visibility: 0.95 }
  landmarks[26] = { x: 0.54, y: 0.7, visibility: 0.95 }
  landmarks[27] = { x: 0.47, y: 0.92, visibility: 0.95 }
  landmarks[28] = { x: 0.53, y: 0.92, visibility: 0.95 }

  return landmarks
}

describe('pushup challenge helpers', () => {
  it('recognizes a stable pushup posture and rejects upright walking posture', () => {
    const pushupAnalysis = analyzePushupLandmarks(createPushupPose())
    const standingAnalysis = analyzePushupLandmarks(createStandingPose())

    expect(pushupAnalysis).toEqual(
      expect.objectContaining({
        isConfident: true,
        isPushupReady: true,
      })
    )
    expect(pushupAnalysis?.postureConfidence).toBeGreaterThan(
      defaultPushupThresholds.minimumPostureConfidence
    )
    expect(standingAnalysis).toEqual(
      expect.objectContaining({
        isConfident: true,
        isPushupReady: false,
      })
    )
    expect(standingAnalysis?.postureConfidence).toBeLessThan(
      defaultPushupThresholds.minimumPostureConfidence
    )
  })

  it('requires a stable ready posture before a rep can increment', () => {
    const down = {
      averageElbowAngle: 92,
      bodyHeight: 0.05,
      trackingConfidence: 0.95,
      postureConfidence: 0.9,
      isConfident: true,
      isPushupReady: true,
    }
    const up = {
      averageElbowAngle: 170,
      bodyHeight: 1,
      trackingConfidence: 0.95,
      postureConfidence: 0.9,
      isConfident: true,
      isPushupReady: true,
    }

    let state = initialPushupCounterState

    for (let index = 0; index < defaultPushupThresholds.minimumReadyFrames - 1; index += 1) {
      const update = updatePushupCounter(state, up)
      state = update.nextState
      expect(update.incremented).toBe(false)
    }

    const afterDown = updatePushupCounter(state, down)
    const afterUp = updatePushupCounter(afterDown.nextState, up)

    expect(afterDown.incremented).toBe(false)
    expect(afterDown.nextState.phase).toBe('down')
    expect(afterUp.incremented).toBe(true)
    expect(afterUp.nextState.reps).toBe(1)
  })

  it('drops back to ready when posture becomes invalid', () => {
    const readyState = {
      ...initialPushupCounterState,
      phase: 'down' as const,
      eligibleFrames: defaultPushupThresholds.minimumReadyFrames,
    }
    const invalidFrame = {
      averageElbowAngle: 120,
      bodyHeight: 0.4,
      trackingConfidence: 0.95,
      postureConfidence: 0.25,
      isConfident: true,
      isPushupReady: false,
    }

    const update = updatePushupCounter(readyState, invalidFrame)

    expect(update.incremented).toBe(false)
    expect(update.nextState.phase).toBe('ready')
    expect(update.nextState.eligibleFrames).toBe(0)
  })

  it('reports tracking and effort metrics in bounded form', () => {
    const tracked = calculateTrackingScore({
      ...initialPushupCounterState,
      totalFrames: 120,
      confidentFrames: 96,
    })

    expect(tracked).toBe(80)
    expect(calculateEffortScore(24, 60)).toBeGreaterThan(0)
    expect(formatDuration(95)).toBe('1:35')
  })
})
