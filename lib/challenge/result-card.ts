import { formatDuration } from '@/lib/challenge/pushup'
import type {
  BrandingSource,
  ExerciseId,
  WorkoutAttributionSnapshot,
} from '@/lib/types/domain'

export interface ResultCardData {
  title: string
  exercise: ExerciseId
  reps: number
  durationSeconds: number
  occurredAt: string
  attribution: WorkoutAttributionSnapshot
}

const cardWidth = 1080
const cardHeight = 1920

export async function createResultCardBlob(
  data: ResultCardData
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = cardWidth
  canvas.height = cardHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context unavailable.')
  }

  drawBackground(context, data.attribution.accentColor)
  drawHeading(context, data)
  drawStatCard(context, data)
  drawBranding(context, data.attribution)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  if (!blob) {
    throw new Error('Unable to create result card image.')
  }

  return blob
}

function drawBackground(context: CanvasRenderingContext2D, accentColor: string) {
  const gradient = context.createLinearGradient(0, 0, 0, cardHeight)
  gradient.addColorStop(0, '#0b1624')
  gradient.addColorStop(0.55, '#101e31')
  gradient.addColorStop(1, '#09111b')

  context.fillStyle = gradient
  context.fillRect(0, 0, cardWidth, cardHeight)

  context.fillStyle = `${accentColor}33`
  context.beginPath()
  context.arc(cardWidth * 0.12, cardHeight * 0.12, 200, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = `${accentColor}22`
  context.beginPath()
  context.arc(cardWidth * 0.82, cardHeight * 0.25, 280, 0, Math.PI * 2)
  context.fill()
}

function drawHeading(context: CanvasRenderingContext2D, data: ResultCardData) {
  context.fillStyle = '#ffd1b0'
  context.font = '600 42px Segoe UI'
  context.fillText('Beat Past You', 88, 128)

  context.fillStyle = '#f4efe7'
  context.font = '700 118px Georgia'
  context.fillText(data.reps.toString(), 88, 390)

  context.font = '600 52px Segoe UI'
  context.fillText('pushups logged', 88, 462)

  context.fillStyle = '#9db0bc'
  context.font = '500 40px Segoe UI'
  context.fillText(formatDuration(data.durationSeconds), 88, 548)
  context.fillText(new Date(data.occurredAt).toLocaleDateString(), 88, 604)
}

function drawStatCard(context: CanvasRenderingContext2D, data: ResultCardData) {
  context.fillStyle = '#11212b'
  roundRect(context, 72, 700, cardWidth - 144, 760, 56)
  context.fill()

  context.strokeStyle = '#274252'
  context.lineWidth = 4
  roundRect(context, 72, 700, cardWidth - 144, 760, 56)
  context.stroke()

  context.fillStyle = '#8ad1c2'
  context.font = '600 34px Segoe UI'
  context.fillText('CHALLENGE RESULT', 124, 804)

  context.fillStyle = '#f4efe7'
  context.font = '700 88px Georgia'
  context.fillText(data.title, 124, 924)

  context.font = '500 46px Segoe UI'
  context.fillStyle = '#dce5ea'
  context.fillText('portrait pushup session', 124, 1004)

  drawMiniStat(context, 'Reps', data.reps.toString(), 124, 1138)
  drawMiniStat(context, 'Elapsed', formatDuration(data.durationSeconds), 124, 1316)
}

function drawBranding(
  context: CanvasRenderingContext2D,
  attribution: WorkoutAttributionSnapshot
) {
  context.fillStyle = '#ffd1b0'
  context.font = '600 36px Segoe UI'
  context.fillText('Visibility powered by', 88, 1620)

  context.fillStyle = '#f4efe7'
  context.font = '700 64px Georgia'
  context.fillText(getBrandingLine(attribution), 88, 1710)

  context.fillStyle = '#9db0bc'
  context.font = '500 30px Segoe UI'
  context.fillText(
    'Share the result. Keep the challenge moving.',
    88,
    1808
  )
}

function drawMiniStat(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number
) {
  context.fillStyle = '#152934'
  roundRect(context, x, y, cardWidth - 248, 128, 28)
  context.fill()

  context.fillStyle = '#8ad1c2'
  context.font = '600 28px Segoe UI'
  context.fillText(label.toUpperCase(), x + 32, y + 44)

  context.fillStyle = '#f4efe7'
  context.font = '700 54px Georgia'
  context.fillText(value, x + 32, y + 102)
}

function getBrandingLine(attribution: WorkoutAttributionSnapshot) {
  return attribution.brandingSource === 'coach'
    ? attribution.coachDisplayName ?? 'Current coach'
    : 'Beat Past You'
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
