export interface PosePoint {
  x: number
  y: number
  visibility?: number
}

export interface PushupFrameAnalysis {
  averageElbowAngle: number
  bodyHeight: number
  trackingConfidence: number
  isConfident: boolean
}

export interface PushupCounterState {
  phase: 'ready' | 'down' | 'up'
  reps: number
  totalFrames: number
  confidentFrames: number
  latestBodyHeight: number
}

export interface PushupThresholds {
  downAngle: number
  upAngle: number
  minimumConfidence: number
}

export interface PushupCounterUpdate {
  nextState: PushupCounterState
  incremented: boolean
}

export const defaultPushupThresholds: PushupThresholds = {
  downAngle: 100,
  upAngle: 155,
  minimumConfidence: 0.45,
}

export const poseIndexes = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
} as const

export const initialPushupCounterState: PushupCounterState = {
  phase: 'ready',
  reps: 0,
  totalFrames: 0,
  confidentFrames: 0,
  latestBodyHeight: 1,
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

export function analyzePushupLandmarks(landmarks: PosePoint[]): PushupFrameAnalysis | null {
  const points = [
    landmarks[poseIndexes.leftShoulder],
    landmarks[poseIndexes.leftElbow],
    landmarks[poseIndexes.leftWrist],
    landmarks[poseIndexes.rightShoulder],
    landmarks[poseIndexes.rightElbow],
    landmarks[poseIndexes.rightWrist],
    landmarks[poseIndexes.nose],
  ]

  if (points.some((point) => !point)) {
    return null
  }

  const confidenceValues = points.map((point) => point.visibility ?? 1)
  const trackingConfidence = average(confidenceValues)
  const leftAngle = calculateAngle(points[0], points[1], points[2])
  const rightAngle = calculateAngle(points[3], points[4], points[5])
  const averageElbowAngle = average([leftAngle, rightAngle])
  const bodyHeight = clamp((averageElbowAngle - 90) / 80, 0, 1)

  return {
    averageElbowAngle,
    bodyHeight,
    trackingConfidence,
    isConfident: trackingConfidence >= defaultPushupThresholds.minimumConfidence,
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
  }

  if (!analysis.isConfident || analysis.trackingConfidence < thresholds.minimumConfidence) {
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
