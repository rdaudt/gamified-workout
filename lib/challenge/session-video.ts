import { formatDuration, type PosePoint } from '@/lib/challenge/pushup'

export type SessionVideoStatus = 'idle' | 'countdown' | 'live' | 'paused' | 'complete'

export interface PoseConnection {
  start: number
  end: number
}

export interface ChallengeFrameSnapshot {
  status: SessionVideoStatus
  countdownValue: number | null
  repCount: number
  elapsedLabel: string
  trackingLabel: string
  bodyHeight: number
}

export interface RecordingFormat {
  extension: 'mp4' | 'webm'
  isIPhoneFriendly: boolean
  label: 'MP4' | 'WebM'
  mimeType: string
}

interface BuildChallengeFrameSnapshotOptions {
  status: SessionVideoStatus
  countdownValue: number | null
  repCount: number
  elapsedSeconds: number
  trackingScore: number
  bodyHeight: number
}

interface DrawPoseOverlayOptions {
  mirrored?: boolean
  lineWidth?: number
  landmarkRadius?: number
  connectionColor?: string
  landmarkColor?: string
}

interface DrawComposedChallengeFrameOptions {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  video: HTMLVideoElement
  snapshot: ChallengeFrameSnapshot
  landmarks: PosePoint[] | null
  connections: PoseConnection[]
}

const defaultConnectionColor = '#ff6b68'
const defaultLandmarkColor = '#ffd1b0'

export function buildChallengeFrameSnapshot(
  options: BuildChallengeFrameSnapshotOptions
): ChallengeFrameSnapshot {
  return {
    status: options.status,
    countdownValue: options.countdownValue,
    repCount: options.repCount,
    elapsedLabel: formatDuration(options.elapsedSeconds),
    trackingLabel: `${options.trackingScore}%`,
    bodyHeight: clamp(options.bodyHeight, 0, 1),
  }
}

export function drawPoseOverlay(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  landmarks: PosePoint[],
  connections: PoseConnection[],
  options: DrawPoseOverlayOptions = {}
) {
  const mirrored = options.mirrored ?? false
  const lineWidth = options.lineWidth ?? 4
  const landmarkRadius = options.landmarkRadius ?? 3
  const connectionColor = options.connectionColor ?? defaultConnectionColor
  const landmarkColor = options.landmarkColor ?? defaultLandmarkColor

  context.save()

  if (mirrored) {
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
  }

  context.strokeStyle = connectionColor
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const connection of connections) {
    const start = landmarks[connection.start]
    const end = landmarks[connection.end]

    if (!start || !end) {
      continue
    }

    context.beginPath()
    context.moveTo(start.x * canvas.width, start.y * canvas.height)
    context.lineTo(end.x * canvas.width, end.y * canvas.height)
    context.stroke()
  }

  context.fillStyle = landmarkColor

  for (const landmark of landmarks) {
    context.beginPath()
    context.arc(
      landmark.x * canvas.width,
      landmark.y * canvas.height,
      landmarkRadius,
      0,
      Math.PI * 2
    )
    context.fill()
  }

  context.restore()
}

export function drawComposedChallengeFrame(
  options: DrawComposedChallengeFrameOptions
) {
  const { canvas, context, video, snapshot, landmarks, connections } = options

  context.save()
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#02060b'
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (video.videoWidth > 0 && video.videoHeight > 0) {
    context.save()
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    context.restore()
  }

  drawFrameGradients(context, canvas)

  if (landmarks) {
    drawPoseOverlay(context, canvas, landmarks, connections, {
      mirrored: true,
      lineWidth: Math.max(3, canvas.width * 0.005),
      landmarkRadius: Math.max(3, canvas.width * 0.004),
    })
  }

  drawFrontCameraBadge(context, canvas)
  drawTrackingBadge(context, canvas, snapshot.trackingLabel)
  drawBottomStats(context, canvas, snapshot)
  drawSideElevator(context, canvas, snapshot.bodyHeight)

  if (snapshot.countdownValue !== null) {
    drawCountdownOverlay(context, canvas, snapshot.countdownValue)
  }

  context.restore()
}

export function syncCanvasSize(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) {
    return
  }

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
  }
}

export function supportsVideoRecording() {
  return typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined'
}

export function getPreferredRecordingFormat(
  isTypeSupported?: (mimeType: string) => boolean
): RecordingFormat | null {
  const checker =
    isTypeSupported ??
    (supportsVideoRecording()
      ? (mimeType: string) => MediaRecorder.isTypeSupported(mimeType)
      : null)

  if (!checker) {
    return null
  }

  const candidates: RecordingFormat[] = [
    {
      mimeType: 'video/mp4;codecs=avc1.42E01E',
      extension: 'mp4',
      isIPhoneFriendly: true,
      label: 'MP4',
    },
    {
      mimeType: 'video/mp4',
      extension: 'mp4',
      isIPhoneFriendly: true,
      label: 'MP4',
    },
    {
      mimeType: 'video/webm;codecs=vp9',
      extension: 'webm',
      isIPhoneFriendly: false,
      label: 'WebM',
    },
    {
      mimeType: 'video/webm;codecs=vp8',
      extension: 'webm',
      isIPhoneFriendly: false,
      label: 'WebM',
    },
    {
      mimeType: 'video/webm',
      extension: 'webm',
      isIPhoneFriendly: false,
      label: 'WebM',
    },
  ]

  return candidates.find((candidate) => checker(candidate.mimeType)) ?? null
}

function drawFrameGradients(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const topGradient = context.createLinearGradient(0, 0, 0, canvas.height * 0.24)
  topGradient.addColorStop(0, 'rgba(8, 14, 24, 0.72)')
  topGradient.addColorStop(1, 'rgba(8, 14, 24, 0)')
  context.fillStyle = topGradient
  context.fillRect(0, 0, canvas.width, canvas.height * 0.24)

  const bottomGradient = context.createLinearGradient(
    0,
    canvas.height,
    0,
    canvas.height * 0.6
  )
  bottomGradient.addColorStop(0, 'rgba(8, 14, 24, 0.88)')
  bottomGradient.addColorStop(1, 'rgba(8, 14, 24, 0)')
  context.fillStyle = bottomGradient
  context.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4)
}

function drawFrontCameraBadge(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
) {
  const paddingX = canvas.width * 0.05
  const paddingY = canvas.height * 0.055
  const width = canvas.width * 0.3
  const height = canvas.height * 0.055

  context.fillStyle = 'rgba(0, 0, 0, 0.5)'
  roundRect(context, paddingX, paddingY, width, height, height / 2)
  context.fill()

  context.fillStyle = '#8ad1c2'
  context.font = `600 ${Math.round(canvas.width * 0.026)}px Segoe UI`
  context.textBaseline = 'middle'
  context.fillText('Front camera / portrait', paddingX + width * 0.11, paddingY + height / 2)
}

function drawTrackingBadge(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  trackingLabel: string
) {
  const width = canvas.width * 0.18
  const height = canvas.height * 0.06
  const x = canvas.width - width - canvas.width * 0.05
  const y = canvas.height * 0.055

  context.fillStyle = 'rgba(10, 18, 30, 0.68)'
  roundRect(context, x, y, width, height, height / 2)
  context.fill()

  context.fillStyle = '#ffd1b0'
  context.font = `600 ${Math.round(canvas.width * 0.023)}px Segoe UI`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(`Tracking ${trackingLabel}`, x + width / 2, y + height / 2)
  context.textAlign = 'left'
}

function drawBottomStats(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  snapshot: ChallengeFrameSnapshot
) {
  const sectionWidth = canvas.width * 0.24
  const sectionHeight = canvas.height * 0.12
  const gap = canvas.width * 0.024
  const startX = canvas.width * 0.06
  const y = canvas.height - sectionHeight - canvas.height * 0.055

  drawStatCard(context, startX, y, sectionWidth, sectionHeight, 'Reps', snapshot.repCount.toString())
  drawStatCard(
    context,
    startX + sectionWidth + gap,
    y,
    sectionWidth,
    sectionHeight,
    'Elapsed',
    snapshot.elapsedLabel
  )
  drawStatCard(
    context,
    startX + (sectionWidth + gap) * 2,
    y,
    sectionWidth,
    sectionHeight,
    'Status',
    snapshot.status === 'paused' ? 'Paused' : snapshot.status === 'live' ? 'Live' : 'Ready'
  )
}

function drawStatCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string
) {
  context.fillStyle = 'rgba(10, 18, 30, 0.8)'
  roundRect(context, x, y, width, height, height * 0.24)
  context.fill()

  context.strokeStyle = 'rgba(138, 209, 194, 0.28)'
  context.lineWidth = 2
  roundRect(context, x, y, width, height, height * 0.24)
  context.stroke()

  context.fillStyle = '#8ad1c2'
  context.font = `600 ${Math.round(width * 0.14)}px Segoe UI`
  context.textBaseline = 'top'
  context.fillText(label.toUpperCase(), x + width * 0.12, y + height * 0.16)

  context.fillStyle = '#f4efe7'
  context.font = `700 ${Math.round(width * 0.22)}px Georgia`
  context.fillText(value, x + width * 0.12, y + height * 0.48)
}

function drawSideElevator(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bodyHeight: number
) {
  const railWidth = canvas.width * 0.028
  const railHeight = canvas.height * 0.58
  const x = canvas.width - railWidth - canvas.width * 0.04
  const y = canvas.height * 0.2

  context.fillStyle = 'rgba(7, 20, 31, 0.72)'
  roundRect(context, x, y, railWidth, railHeight, railWidth / 2)
  context.fill()

  const innerPadding = railWidth * 0.18
  const innerX = x + innerPadding
  const innerY = y + innerPadding
  const innerWidth = railWidth - innerPadding * 2
  const innerHeight = railHeight - innerPadding * 2

  const railGradient = context.createLinearGradient(0, innerY + innerHeight, 0, innerY)
  railGradient.addColorStop(0, '#143846')
  railGradient.addColorStop(1, '#244a57')
  context.fillStyle = railGradient
  roundRect(context, innerX, innerY, innerWidth, innerHeight, innerWidth / 2)
  context.fill()

  const markerHeight = canvas.height * 0.046
  const clampedBodyHeight = clamp(bodyHeight, 0, 1)
  const markerY = innerY + (1 - clampedBodyHeight) * (innerHeight - markerHeight)

  context.fillStyle = '#36b1ff'
  context.strokeStyle = '#cfeeff'
  context.lineWidth = 2
  roundRect(context, x - railWidth * 0.22, markerY, railWidth * 1.44, markerHeight, markerHeight / 2)
  context.fill()
  roundRect(context, x - railWidth * 0.22, markerY, railWidth * 1.44, markerHeight, markerHeight / 2)
  context.stroke()
}

function drawCountdownOverlay(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  countdownValue: number
) {
  context.fillStyle = 'rgba(0, 0, 0, 0.32)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const width = canvas.width * 0.4
  const height = canvas.height * 0.22
  const x = (canvas.width - width) / 2
  const y = (canvas.height - height) / 2

  context.fillStyle = 'rgba(0, 0, 0, 0.54)'
  context.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  context.lineWidth = 2
  roundRect(context, x, y, width, height, height * 0.18)
  context.fill()
  roundRect(context, x, y, width, height, height * 0.18)
  context.stroke()

  context.textAlign = 'center'
  context.fillStyle = '#8ad1c2'
  context.font = `600 ${Math.round(canvas.width * 0.026)}px Segoe UI`
  context.fillText('GET READY', x + width / 2, y + height * 0.28)

  context.fillStyle = '#f4efe7'
  context.font = `700 ${Math.round(canvas.width * 0.11)}px Georgia`
  context.fillText(countdownValue.toString(), x + width / 2, y + height * 0.72)
  context.textAlign = 'left'
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
