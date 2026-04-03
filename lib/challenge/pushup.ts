export interface PosePoint {
  x: number
  y: number
  z?: number
  visibility?: number
}

export interface PushupFrameAnalysis {
  averageElbowAngle: number
  bodyHeight: number
  trackingConfidence: number
  supportConfidence: number
  torsoDrop: number
  depthSignal: number
  isConfident: boolean
  hasSupport: boolean
}

export interface PushupCounterState {
  phase: 'search' | 'down' | 'up'
  reps: number
  totalFrames: number
  confidentFrames: number
  latestBodyHeight: number
  supportFrames: number
  lostSupportFrames: number
  smoothedDepthSignal: number
  signalMin: number
  signalMax: number
  topThreshold: number | null
  bottomThreshold: number | null
  thresholdsLocked: boolean
  supportActive: boolean
  motionStarted: boolean
}

export interface PushupThresholds {
  minimumConfidence: number
  minimumSupportConfidence: number
  minimumSupportFrames: number
  maximumLostSupportFrames: number
  minimumSignalSpread: number
  smoothingFactor: number
  topThresholdRatio: number
  bottomThresholdRatio: number
}

export interface PushupCounterUpdate {
  nextState: PushupCounterState
  incremented: boolean
  startedMotion: boolean
}

export const defaultPushupThresholds: PushupThresholds = {
  minimumConfidence: 0.45,
  minimumSupportConfidence: 0.56,
  minimumSupportFrames: 5,
  maximumLostSupportFrames: 6,
  minimumSignalSpread: 0.18,
  smoothingFactor: 0.34,
  topThresholdRatio: 0.38,
  bottomThresholdRatio: 0.72,
}

export const poseIndexes = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

export const initialPushupCounterState: PushupCounterState = {
  phase: 'search',
  reps: 0,
  totalFrames: 0,
  confidentFrames: 0,
  latestBodyHeight: 1,
  supportFrames: 0,
  lostSupportFrames: 0,
  smoothedDepthSignal: 0,
  signalMin: 1,
  signalMax: 0,
  topThreshold: null,
  bottomThreshold: null,
  thresholdsLocked: false,
  supportActive: false,
  motionStarted: false,
}

export function calculateAngle(a: PosePoint, b: PosePoint, c: PosePoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  const degrees = Math.abs((radians * 180) / Math.PI)

  return degrees > 180 ? 360 - degrees : degrees
}

function calculate3DAngle(a: PosePoint, b: PosePoint, c: PosePoint): number {
  const ab = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z ?? 0) - (b.z ?? 0),
  }
  const cb = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: (c.z ?? 0) - (b.z ?? 0),
  }
  const magnitudeAb = Math.hypot(ab.x, ab.y, ab.z)
  const magnitudeCb = Math.hypot(cb.x, cb.y, cb.z)

  if (magnitudeAb === 0 || magnitudeCb === 0) {
    return 180
  }

  const cosine = clamp(
    (ab.x * cb.x + ab.y * cb.y + ab.z * cb.z) / (magnitudeAb * magnitudeCb),
    -1,
    1
  )

  return (Math.acos(cosine) * 180) / Math.PI
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function midpoint(a: PosePoint, b: PosePoint): PosePoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: ((a.z ?? 0) + (b.z ?? 0)) / 2,
    visibility: average([(a.visibility ?? 1), (b.visibility ?? 1)]),
  }
}

function distance(a: PosePoint, b: PosePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeScore(value: number, min: number, max: number) {
  if (max <= min) {
    return value >= max ? 1 : 0
  }

  return clamp((value - min) / (max - min), 0, 1)
}

function toWorldPoint(point: PosePoint) {
  return {
    x: point.x,
    y: point.y,
    z: point.z ?? 0,
    visibility: point.visibility,
  }
}

function resetSupportWindow(
  state: PushupCounterState,
  preserveMotionStarted: boolean
): PushupCounterState {
  return {
    ...state,
    phase: 'search',
    supportFrames: 0,
    smoothedDepthSignal: 0,
    signalMin: 1,
    signalMax: 0,
    topThreshold: null,
    bottomThreshold: null,
    thresholdsLocked: false,
    supportActive: false,
    motionStarted: preserveMotionStarted ? state.motionStarted : false,
  }
}

export function analyzePushupLandmarks(
  landmarks: PosePoint[],
  worldLandmarks?: PosePoint[]
): PushupFrameAnalysis | null {
  const leftShoulder = landmarks[poseIndexes.leftShoulder]
  const rightShoulder = landmarks[poseIndexes.rightShoulder]
  const leftElbow = landmarks[poseIndexes.leftElbow]
  const rightElbow = landmarks[poseIndexes.rightElbow]
  const leftWrist = landmarks[poseIndexes.leftWrist]
  const rightWrist = landmarks[poseIndexes.rightWrist]
  const leftHip = landmarks[poseIndexes.leftHip]
  const rightHip = landmarks[poseIndexes.rightHip]
  const nose = landmarks[poseIndexes.nose]

  const requiredPoints = [
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    nose,
  ]

  if (requiredPoints.some((point) => !point)) {
    return null
  }

  const leftShoulderWorld =
    worldLandmarks?.[poseIndexes.leftShoulder] ?? toWorldPoint(leftShoulder)
  const rightShoulderWorld =
    worldLandmarks?.[poseIndexes.rightShoulder] ?? toWorldPoint(rightShoulder)
  const leftElbowWorld =
    worldLandmarks?.[poseIndexes.leftElbow] ?? toWorldPoint(leftElbow)
  const rightElbowWorld =
    worldLandmarks?.[poseIndexes.rightElbow] ?? toWorldPoint(rightElbow)
  const leftWristWorld =
    worldLandmarks?.[poseIndexes.leftWrist] ?? toWorldPoint(leftWrist)
  const rightWristWorld =
    worldLandmarks?.[poseIndexes.rightWrist] ?? toWorldPoint(rightWrist)

  const confidenceValues = requiredPoints.map((point) => point.visibility ?? 1)
  const trackingConfidence = average(confidenceValues)
  const leftAngle = calculate3DAngle(leftShoulderWorld, leftElbowWorld, leftWristWorld)
  const rightAngle = calculate3DAngle(rightShoulderWorld, rightElbowWorld, rightWristWorld)
  const averageElbowAngle = average([leftAngle, rightAngle])
  const elbowCompression = 1 - clamp((averageElbowAngle - 80) / 90, 0, 1)
  const bodyHeight = clamp(1 - elbowCompression, 0, 1)

  const shoulderMid = midpoint(leftShoulder, rightShoulder)
  const hipMid = midpoint(leftHip, rightHip)
  const wristMid = midpoint(leftWrist, rightWrist)
  const elbowMid = midpoint(leftElbow, rightElbow)
  const shoulderWidth = Math.max(distance(leftShoulder, rightShoulder), 0.001)
  const wristWidth = distance(leftWrist, rightWrist)
  const averageArmReach = average([
    distance(leftShoulder, leftWrist),
    distance(rightShoulder, rightWrist),
  ])
  const torsoDrop = Math.abs(hipMid.y - shoulderMid.y)
  const handPlacementDelta = wristMid.y - shoulderMid.y
  const elbowPlacementDelta = elbowMid.y - shoulderMid.y
  const centeredOffset = Math.abs(nose.x - shoulderMid.x)
  const handPlacementScore = normalizeScore(handPlacementDelta, 0.05, 0.28)
  const elbowPlacementScore = normalizeScore(elbowPlacementDelta, -0.02, 0.2)
  const shoulderCoverageScore = normalizeScore(shoulderWidth, 0.1, 0.32)
  const wristSpreadScore = normalizeScore(wristWidth / shoulderWidth, 0.68, 1.9)
  const armReachScore = normalizeScore(averageArmReach / shoulderWidth, 0.9, 2.2)
  const centeredScore = 1 - normalizeScore(centeredOffset, 0.1, 0.3)
  const torsoSupportScore = 1 - normalizeScore(torsoDrop, 0.18, 0.42)
  const supportConfidence = clamp(
    average([
      handPlacementScore,
      elbowPlacementScore,
      shoulderCoverageScore,
      wristSpreadScore,
      armReachScore,
      centeredScore,
      torsoSupportScore,
    ]),
    0,
    1
  )

  const isConfident = trackingConfidence >= defaultPushupThresholds.minimumConfidence
  const hasSupport =
    isConfident &&
    supportConfidence >= defaultPushupThresholds.minimumSupportConfidence &&
    handPlacementDelta >= 0.05 &&
    shoulderWidth >= 0.09 &&
    centeredOffset <= 0.3 &&
    torsoDrop <= 0.26

  const headCompression = 1 - normalizeScore(wristMid.y - nose.y, 0.2, 0.62)
  const chestCompression = 1 - normalizeScore(wristMid.y - shoulderMid.y, 0.08, 0.42)
  const torsoCompression = 1 - normalizeScore(torsoDrop, 0.15, 0.36)
  const depthSignal = clamp(
    elbowCompression * 0.55 +
      headCompression * 0.2 +
      chestCompression * 0.2 +
      torsoCompression * 0.05,
    0,
    1
  )

  return {
    averageElbowAngle,
    bodyHeight,
    trackingConfidence,
    supportConfidence,
    torsoDrop,
    depthSignal,
    isConfident,
    hasSupport,
  }
}

export function updatePushupCounter(
  state: PushupCounterState,
  analysis: PushupFrameAnalysis,
  thresholds: PushupThresholds = defaultPushupThresholds
): PushupCounterUpdate {
  let nextState: PushupCounterState = {
    ...state,
    totalFrames: state.totalFrames + 1,
    confidentFrames: state.confidentFrames + (analysis.isConfident ? 1 : 0),
    latestBodyHeight: analysis.bodyHeight,
  }

  const canFinishActiveRep =
    analysis.isConfident &&
    state.phase === 'down' &&
    state.topThreshold !== null &&
    state.bottomThreshold !== null &&
    state.supportFrames >= thresholds.minimumSupportFrames &&
    analysis.supportConfidence >= thresholds.minimumSupportConfidence * 0.72 &&
    analysis.torsoDrop <= 0.27 &&
    analysis.depthSignal >= state.topThreshold - 0.18 &&
    analysis.depthSignal <= state.bottomThreshold + 0.12

  if (!analysis.isConfident || (!analysis.hasSupport && !canFinishActiveRep)) {
    nextState.supportActive = false
    nextState.lostSupportFrames = state.lostSupportFrames + 1

    if (nextState.lostSupportFrames > thresholds.maximumLostSupportFrames) {
      nextState = {
        ...resetSupportWindow(nextState, true),
        lostSupportFrames: nextState.lostSupportFrames,
      }
    }

    return {
      nextState,
      incremented: false,
      startedMotion: false,
    }
  }

  nextState.supportActive = true
  nextState.lostSupportFrames = 0
  nextState.supportFrames = state.supportFrames + 1
  nextState.smoothedDepthSignal = state.supportActive
    ? state.smoothedDepthSignal * (1 - thresholds.smoothingFactor) +
      analysis.depthSignal * thresholds.smoothingFactor
    : analysis.depthSignal

  if (!state.thresholdsLocked) {
    nextState.signalMin = Math.min(state.signalMin, nextState.smoothedDepthSignal)
    nextState.signalMax = Math.max(state.signalMax, nextState.smoothedDepthSignal)

    const signalSpread = nextState.signalMax - nextState.signalMin
    if (
      nextState.supportFrames >= thresholds.minimumSupportFrames &&
      signalSpread >= thresholds.minimumSignalSpread
    ) {
      nextState.topThreshold =
        nextState.signalMin + signalSpread * thresholds.topThresholdRatio
      nextState.bottomThreshold =
        nextState.signalMin + signalSpread * thresholds.bottomThresholdRatio
    }
  }

  if (nextState.topThreshold === null || nextState.bottomThreshold === null) {
    nextState.phase = 'search'

    return {
      nextState,
      incremented: false,
      startedMotion: false,
    }
  }

  let startedMotion = false
  if (!state.motionStarted && nextState.smoothedDepthSignal >= nextState.bottomThreshold) {
    nextState.motionStarted = true
    startedMotion = true
  }

  if (state.phase !== 'down' && nextState.smoothedDepthSignal >= nextState.bottomThreshold) {
    nextState.phase = 'down'

    return {
      nextState,
      incremented: false,
      startedMotion,
    }
  }

  if (state.phase === 'down' && nextState.smoothedDepthSignal <= nextState.topThreshold) {
    nextState.phase = 'up'
    nextState.reps = state.reps + 1
    nextState.thresholdsLocked = true

    return {
      nextState,
      incremented: true,
      startedMotion,
    }
  }

  if (nextState.smoothedDepthSignal <= nextState.topThreshold) {
    nextState.phase = 'up'
  } else if (state.phase === 'down') {
    nextState.phase = 'down'
  } else {
    nextState.phase = 'search'
  }

  return {
    nextState,
    incremented: false,
    startedMotion,
  }
}

export function calculateTrackingScore(state: PushupCounterState): number {
  if (state.totalFrames === 0) {
    return 0
  }

  return clamp((state.confidentFrames / state.totalFrames) * 100, 0, 100)
}

export function calculateEffortScore(reps: number, durationSeconds: number): number {
  const repsWeight = reps * 4.25
  const paceWeight = durationSeconds > 0 ? (reps / durationSeconds) * 300 : 0

  return clamp(Math.round(repsWeight + paceWeight), 0, 100)
}

export function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
