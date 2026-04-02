import {
  analyzePushupLandmarks,
  calculateEffortScore,
  calculateTrackingScore,
  formatDuration,
  initialPushupCounterState,
  updatePushupCounter,
  type PosePoint,
  type PushupCounterState,
} from '@/lib/challenge/pushup'

function createBlankLandmarks() {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }))
}

function createWorldLandmarks(landmarks: PosePoint[]) {
  return landmarks.map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
    visibility: point.visibility,
  }))
}

function createStandingPose() {
  const landmarks = createBlankLandmarks()

  landmarks[0] = { x: 0.5, y: 0.12, z: -0.02, visibility: 0.95 }
  landmarks[11] = { x: 0.42, y: 0.22, z: 0, visibility: 0.95 }
  landmarks[12] = { x: 0.58, y: 0.22, z: 0, visibility: 0.95 }
  landmarks[13] = { x: 0.4, y: 0.34, z: 0.03, visibility: 0.95 }
  landmarks[14] = { x: 0.6, y: 0.34, z: 0.03, visibility: 0.95 }
  landmarks[15] = { x: 0.38, y: 0.48, z: 0.06, visibility: 0.95 }
  landmarks[16] = { x: 0.62, y: 0.48, z: 0.06, visibility: 0.95 }
  landmarks[23] = { x: 0.45, y: 0.5, z: 0.01, visibility: 0.95 }
  landmarks[24] = { x: 0.55, y: 0.5, z: 0.01, visibility: 0.95 }

  return landmarks
}

function createFrontFacingPose(position: 'up' | 'down') {
  const landmarks = createBlankLandmarks()
  const isDown = position === 'down'

  landmarks[0] = { x: 0.5, y: isDown ? 0.52 : 0.3, z: isDown ? -0.08 : -0.02, visibility: 0.95 }
  landmarks[11] = { x: 0.34, y: isDown ? 0.44 : 0.33, z: isDown ? -0.05 : 0, visibility: 0.95 }
  landmarks[12] = { x: 0.66, y: isDown ? 0.44 : 0.33, z: isDown ? -0.05 : 0, visibility: 0.95 }
  landmarks[13] = { x: 0.23, y: isDown ? 0.52 : 0.49, z: isDown ? -0.02 : 0.05, visibility: 0.95 }
  landmarks[14] = { x: 0.77, y: isDown ? 0.52 : 0.49, z: isDown ? -0.02 : 0.05, visibility: 0.95 }
  landmarks[15] = { x: 0.15, y: 0.8, z: 0.1, visibility: 0.95 }
  landmarks[16] = { x: 0.85, y: 0.8, z: 0.1, visibility: 0.95 }
  landmarks[23] = { x: 0.45, y: isDown ? 0.5 : 0.44, z: isDown ? -0.03 : 0.01, visibility: 0.95 }
  landmarks[24] = { x: 0.55, y: isDown ? 0.5 : 0.44, z: isDown ? -0.03 : 0.01, visibility: 0.95 }

  return landmarks
}

function createSideFacingPose(position: 'up' | 'down') {
  const landmarks = createBlankLandmarks()
  const isDown = position === 'down'

  landmarks[0] = { x: 0.33, y: isDown ? 0.49 : 0.24, z: isDown ? -0.08 : -0.01, visibility: 0.95 }
  landmarks[11] = { x: 0.25, y: isDown ? 0.45 : 0.29, z: isDown ? -0.05 : 0, visibility: 0.95 }
  landmarks[12] = { x: 0.37, y: isDown ? 0.45 : 0.29, z: isDown ? -0.05 : 0, visibility: 0.95 }
  landmarks[13] = { x: 0.18, y: isDown ? 0.52 : 0.43, z: isDown ? -0.02 : 0.04, visibility: 0.95 }
  landmarks[14] = { x: 0.44, y: isDown ? 0.52 : 0.43, z: isDown ? -0.02 : 0.04, visibility: 0.95 }
  landmarks[15] = { x: 0.14, y: 0.74, z: 0.08, visibility: 0.95 }
  landmarks[16] = { x: 0.5, y: 0.74, z: 0.08, visibility: 0.95 }
  landmarks[23] = { x: 0.5, y: isDown ? 0.48 : 0.33, z: isDown ? -0.03 : 0.02, visibility: 0.95 }
  landmarks[24] = { x: 0.6, y: isDown ? 0.48 : 0.33, z: isDown ? -0.03 : 0.02, visibility: 0.95 }

  return landmarks
}

function createKneelingSetupPose() {
  const landmarks = createBlankLandmarks()

  landmarks[0] = { x: 0.5, y: 0.28, z: -0.02, visibility: 0.95 }
  landmarks[11] = { x: 0.38, y: 0.34, z: 0, visibility: 0.95 }
  landmarks[12] = { x: 0.62, y: 0.34, z: 0, visibility: 0.95 }
  landmarks[13] = { x: 0.33, y: 0.47, z: 0.02, visibility: 0.95 }
  landmarks[14] = { x: 0.67, y: 0.47, z: 0.02, visibility: 0.95 }
  landmarks[15] = { x: 0.28, y: 0.76, z: 0.08, visibility: 0.95 }
  landmarks[16] = { x: 0.72, y: 0.76, z: 0.08, visibility: 0.95 }
  landmarks[23] = { x: 0.44, y: 0.58, z: 0.04, visibility: 0.95 }
  landmarks[24] = { x: 0.56, y: 0.58, z: 0.04, visibility: 0.95 }

  return landmarks
}

function analyzeFrame(landmarks: PosePoint[]) {
  return analyzePushupLandmarks(landmarks, createWorldLandmarks(landmarks))
}

function advanceCounter(state: PushupCounterState, analyses: ReturnType<typeof analyzeFrame>[]) {
  let nextState = state
  const updates = []

  for (const analysis of analyses) {
    if (!analysis) {
      throw new Error('Synthetic analysis unexpectedly returned null.')
    }

    const update = updatePushupCounter(nextState, analysis)
    nextState = update.nextState
    updates.push(update)
  }

  return {
    nextState,
    updates,
  }
}

function repeatAnalysis(analysis: ReturnType<typeof analyzeFrame>, count: number) {
  return Array.from({ length: count }, () => analysis)
}

describe('pushup challenge helpers', () => {
  it('detects support from front and side pushup setups while rejecting standing posture', () => {
    const frontUp = analyzeFrame(createFrontFacingPose('up'))
    const sideUp = analyzeFrame(createSideFacingPose('up'))
    const standing = analyzeFrame(createStandingPose())

    expect(frontUp).toEqual(
      expect.objectContaining({
        isConfident: true,
        hasSupport: true,
      })
    )
    expect(sideUp).toEqual(
      expect.objectContaining({
        isConfident: true,
        hasSupport: true,
      })
    )
    expect(standing).toEqual(
      expect.objectContaining({
        isConfident: true,
        hasSupport: false,
      })
    )
  })

  it('counts a front-facing pushup cycle and starts timing on the first valid descent', () => {
    const frontUp = analyzeFrame(createFrontFacingPose('up'))
    const frontDown = analyzeFrame(createFrontFacingPose('down'))

    const { updates } = advanceCounter(initialPushupCounterState, [
      ...repeatAnalysis(frontUp, 8),
      ...repeatAnalysis(frontDown, 5),
      ...repeatAnalysis(frontUp, 6),
    ])

    const startedMotion = updates.some((update) => update.startedMotion)
    const finalState = updates.at(-1)?.nextState

    expect(startedMotion).toBe(true)
    expect(finalState?.reps).toBe(1)
    expect(finalState?.phase).toBe('up')
    expect(finalState?.thresholdsLocked).toBe(true)
  })

  it('counts a side-view pushup cycle with the same temporal counter', () => {
    const sideUp = analyzeFrame(createSideFacingPose('up'))
    const sideDown = analyzeFrame(createSideFacingPose('down'))

    const { nextState } = advanceCounter(initialPushupCounterState, [
      ...repeatAnalysis(sideUp, 8),
      ...repeatAnalysis(sideDown, 5),
      ...repeatAnalysis(sideUp, 6),
    ])

    expect(nextState.reps).toBe(1)
    expect(nextState.bottomThreshold).not.toBeNull()
    expect(nextState.topThreshold).not.toBeNull()
  })

  it('does not count walking into frame or holding a kneeling setup without a full cycle', () => {
    const standing = analyzeFrame(createStandingPose())
    const kneeling = analyzeFrame(createKneelingSetupPose())

    const standingResult = advanceCounter(initialPushupCounterState, repeatAnalysis(standing, 18))
    const kneelingResult = advanceCounter(initialPushupCounterState, repeatAnalysis(kneeling, 18))

    expect(standingResult.nextState.reps).toBe(0)
    expect(standingResult.nextState.supportActive).toBe(false)
    expect(kneelingResult.nextState.reps).toBe(0)
  })

  it('survives brief support loss without instantly losing a valid cycle', () => {
    const frontUp = analyzeFrame(createFrontFacingPose('up'))
    const frontDown = analyzeFrame(createFrontFacingPose('down'))
    const standing = analyzeFrame(createStandingPose())

    const { nextState } = advanceCounter(initialPushupCounterState, [
      ...repeatAnalysis(frontUp, 8),
      ...repeatAnalysis(frontDown, 4),
      ...repeatAnalysis(standing, 2),
      ...repeatAnalysis(frontUp, 5),
    ])

    expect(nextState.reps).toBe(1)
    expect(nextState.lostSupportFrames).toBe(0)
  })

  it('does not add reps after the user stands up and picks up the phone', () => {
    const frontUp = analyzeFrame(createFrontFacingPose('up'))
    const frontDown = analyzeFrame(createFrontFacingPose('down'))
    const standing = analyzeFrame(createStandingPose())

    const { nextState } = advanceCounter(initialPushupCounterState, [
      ...repeatAnalysis(frontUp, 8),
      ...repeatAnalysis(frontDown, 5),
      ...repeatAnalysis(frontUp, 6),
      ...repeatAnalysis(standing, 10),
    ])

    expect(nextState.reps).toBe(1)
    expect(nextState.phase).toBe('search')
    expect(nextState.topThreshold).toBeNull()
    expect(nextState.bottomThreshold).toBeNull()
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
