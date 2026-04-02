export interface PosePoint {
  x: number
  y: number
  visibility?: number
}

export interface PushupFrameAnalysis {
  averageElbowAngle: number
  bodyHeight: number
  trackingConfidence: number
  postureConfidence: number
  isConfident: boolean
  isPushupReady: boolean
}

export interface PushupCounterState {
  phase: 'ready' | 'down' | 'up'
  reps: number
  totalFrames: number
  confidentFrames: number
  latestBodyHeight: number
  eligibleFrames: number
}

export interface PushupThresholds {
  downAngle: number
  upAngle: number
  minimumConfidence: number
  minimumPostureConfidence: number
  minimumReadyFrames: number
}

export interface PushupCounterUpdate {
  nextState: PushupCounterState
  incremented: boolean
}

export const defaultPushupThresholds: PushupThresholds = {
  downAngle: 100,
  upAngle: 155,
  minimumConfidence: 0.45,
  minimumPostureConfidence: 0.5,
  minimumReadyFrames: 6,
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
  phase: 'ready',
  reps: 0,
  totalFrames: 0,
  confidentFrames: 0,
  latestBodyHeight: 1,
  eligibleFrames: 0,
}

export function calculateAngle(a: PosePoint, b: PosePoint, c: PosePoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  const degrees = Math.abs((radians * 180) / Math.PI)

  return degrees > 180 ? 360 - degrees : degrees
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function midpoint(a: PosePoint, b: PosePoint): PosePoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
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

export function analyzePushupLandmarks(landmarks: PosePoint[]): PushupFrameAnalysis | null {
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

  const confidenceValues = requiredPoints.map((point) => point.visibility ?? 1)
  const trackingConfidence = average(confidenceValues)
  const leftAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
  const rightAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
  const averageElbowAngle = average([leftAngle, rightAngle])
  const bodyHeight = clamp((averageElbowAngle - 90) / 80, 0, 1)
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
  const torsoSupportScore = 1 - normalizeScore(torsoDrop, 0.14, 0.34)
  const handPlacementScore = normalizeScore(wristMid.y - shoulderMid.y, 0.06, 0.28)
  const elbowPlacementScore = normalizeScore(elbowMid.y - shoulderMid.y, 0.01, 0.22)
  const wristSpreadScore = normalizeScore(wristWidth / shoulderWidth, 0.72, 1.9)
  const armReachScore = normalizeScore(averageArmReach / shoulderWidth, 0.9, 2.45)
  const headAlignmentScore =
    1 - normalizeScore(Math.abs(nose.x - shoulderMid.x), 0.08, 0.28)
  const postureConfidence = clamp(
    average([
      torsoSupportScore,
      handPlacementScore,
      elbowPlacementScore,
      wristSpreadScore,
      armReachScore,
      headAlignmentScore,
    ]),
    0,
    1
  )
  const hasPushupShape =
    torsoDrop <= 0.18 &&
    wristMid.y - shoulderMid.y >= 0.06 &&
    elbowMid.y - shoulderMid.y >= 0.01 &&
    wristWidth / shoulderWidth >= 0.72 &&
    averageArmReach / shoulderWidth >= 0.9
  const isConfident = trackingConfidence >= defaultPushupThresholds.minimumConfidence
  const isPushupReady =
    isConfident &&
    hasPushupShape &&
    postureConfidence >= defaultPushupThresholds.minimumPostureConfidence

  return {
    averageElbowAngle,
    bodyHeight,
    trackingConfidence,
    postureConfidence,
    isConfident,
    isPushupReady,
  }
}

export function updatePushupCounter(
  state: PushupCounterState,
  analysis: PushupFrameAnalysis,
  thresholds: PushupThresholds = defaultPushupThresholds
): PushupCounterUpdate {
  const nextState: PushupCounterState = {
    ...state,
    totalFrames: state.totalFrames + 1,
    confidentFrames: state.confidentFrames + (analysis.isConfident ? 1 : 0),
    latestBodyHeight: analysis.bodyHeight,
    eligibleFrames: analysis.isPushupReady ? state.eligibleFrames + 1 : 0,
  }

  if (
    !analysis.isConfident ||
    analysis.trackingConfidence < thresholds.minimumConfidence ||
    !analysis.isPushupReady
  ) {
    nextState.phase = 'ready'

    return {
      nextState,
      incremented: false,
    }
  }

  if (nextState.eligibleFrames < thresholds.minimumReadyFrames) {
    nextState.phase = 'ready'

    return {
      nextState,
      incremented: false,
    }
  }

  if (analysis.averageElbowAngle <= thresholds.downAngle) {
    nextState.phase = 'down'

    return {
      nextState,
      incremented: false,
    }
  }

  if (
    state.phase === 'down' &&
    analysis.averageElbowAngle >= thresholds.upAngle
  ) {
    nextState.phase = 'up'
    nextState.reps = state.reps + 1

    return {
      nextState,
      incremented: true,
    }
  }

  if (analysis.averageElbowAngle >= thresholds.upAngle) {
    nextState.phase = 'ready'
  }

  return {
    nextState,
    incremented: false,
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
