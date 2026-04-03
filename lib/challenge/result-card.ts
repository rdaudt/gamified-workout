import {
  sponsorBusinessName,
  sponsorChallengeTitle,
  sponsorCoachName,
  sponsorLogoPath,
} from '@/lib/challenge/campaign'
import { formatDuration } from '@/lib/challenge/pushup'
import type { ExerciseId, WorkoutAttributionSnapshot } from '@/lib/types/domain'

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

export async function createResultCardBlob(data: ResultCardData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = cardWidth
  canvas.height = cardHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context unavailable.')
  }

  const logo = await loadLogoImage()

  drawBackground(context, data.attribution.accentColor)
  drawHeader(context, logo)
  drawHero(context, data)
  drawStatStrip(context, data)
  drawBrandLockup(context, data)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  if (!blob) {
    throw new Error('Unable to create result card image.')
  }

  return blob
}

async function loadLogoImage() {
  return await new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = sponsorLogoPath
  })
}

function drawBackground(context: CanvasRenderingContext2D, accentColor: string) {
  const gradient = context.createLinearGradient(0, 0, 0, cardHeight)
  gradient.addColorStop(0, '#07111d')
  gradient.addColorStop(0.42, '#0b1930')
  gradient.addColorStop(1, '#050b13')
  context.fillStyle = gradient
  context.fillRect(0, 0, cardWidth, cardHeight)

  const blueGlow = context.createRadialGradient(cardWidth * 0.12, cardHeight * 0.1, 0, cardWidth * 0.12, cardHeight * 0.1, 280)
  blueGlow.addColorStop(0, 'rgba(97, 173, 255, 0.32)')
  blueGlow.addColorStop(1, 'rgba(97, 173, 255, 0)')
  context.fillStyle = blueGlow
  context.fillRect(0, 0, cardWidth, cardHeight)

  const emberGlow = context.createRadialGradient(cardWidth * 0.86, cardHeight * 0.18, 0, cardWidth * 0.86, cardHeight * 0.18, 260)
  emberGlow.addColorStop(0, 'rgba(241, 127, 81, 0.26)')
  emberGlow.addColorStop(1, 'rgba(241, 127, 81, 0)')
  context.fillStyle = emberGlow
  context.fillRect(0, 0, cardWidth, cardHeight)

  context.strokeStyle = `${accentColor}44`
  context.lineWidth = 2
  roundRect(context, 54, 54, cardWidth - 108, cardHeight - 108, 58)
  context.stroke()
}

function drawHeader(context: CanvasRenderingContext2D, logo: HTMLImageElement | null) {
  context.fillStyle = 'rgba(255, 255, 255, 0.06)'
  roundRect(context, 72, 86, cardWidth - 144, 300, 56)
  context.fill()

  context.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  context.lineWidth = 2
  roundRect(context, 72, 86, cardWidth - 144, 300, 56)
  context.stroke()

  if (logo) {
    context.drawImage(logo, 112, 118, 230, 170)
  }

  context.fillStyle = '#9cc8ff'
  context.font = '600 40px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText(sponsorCoachName.toUpperCase(), 392, 154)

  context.fillStyle = '#f7f3ea'
  context.font = '700 114px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText(sponsorChallengeTitle.toUpperCase(), 388, 258)

  context.fillStyle = '#ffd5b6'
  context.font = '600 30px Segoe UI'
  context.fillText(sponsorBusinessName.toUpperCase(), 392, 318)
}

function drawHero(context: CanvasRenderingContext2D, data: ResultCardData) {
  context.fillStyle = 'rgba(7, 18, 30, 0.75)'
  roundRect(context, 72, 438, cardWidth - 144, 566, 56)
  context.fill()

  context.strokeStyle = 'rgba(78, 144, 214, 0.35)'
  context.lineWidth = 3
  roundRect(context, 72, 438, cardWidth - 144, 566, 56)
  context.stroke()

  context.fillStyle = '#9cc8ff'
  context.font = '600 28px Segoe UI'
  context.fillText('RESULT CARD', 128, 520)

  context.fillStyle = '#fff2e4'
  context.font = '700 264px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText(data.reps.toString(), 118, 790)

  context.fillStyle = '#f2bb64'
  context.font = '700 54px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText('PUSHUPS', 132, 864)

  context.fillStyle = '#d7e3f8'
  context.font = '600 38px Segoe UI'
  context.fillText(`Elapsed ${formatDuration(data.durationSeconds)}`, 132, 930)
  context.fillText(new Date(data.occurredAt).toLocaleDateString(), 132, 982)
}

function drawStatStrip(context: CanvasRenderingContext2D, data: ResultCardData) {
  const cardY = 1088
  const cardWidthInner = (cardWidth - 188) / 2

  drawMiniStat(context, 94, cardY, cardWidthInner, 'Challenge', data.title)
  drawMiniStat(context, 94 + cardWidthInner + 24, cardY, cardWidthInner, 'Brand', sponsorBusinessName)

  context.fillStyle = 'rgba(255, 255, 255, 0.05)'
  roundRect(context, 72, 1406, cardWidth - 144, 274, 46)
  context.fill()

  context.fillStyle = '#9cc8ff'
  context.font = '600 28px Segoe UI'
  context.fillText('WHY THIS HITS', 118, 1482)

  context.fillStyle = '#f7f3ea'
  context.font = '700 76px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText('CARD FIRST.', 118, 1584)
  context.fillText('VIDEO PROOF SECOND.', 118, 1660)
}

function drawBrandLockup(context: CanvasRenderingContext2D, data: ResultCardData) {
  context.fillStyle = '#ffd5b6'
  context.font = '600 30px Segoe UI'
  context.fillText('Challenge campaign by', 88, 1798)

  context.fillStyle = '#f7f3ea'
  context.font = '700 64px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  context.fillText(`${sponsorCoachName} x ${sponsorBusinessName}`.toUpperCase(), 88, 1880)

  context.fillStyle = '#9fb6d7'
  context.font = '500 28px Segoe UI'
  context.fillText(
    getBrandingLine(data.attribution),
    88,
    1928
  )
}

function drawMiniStat(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
) {
  context.fillStyle = 'rgba(255, 255, 255, 0.05)'
  roundRect(context, x, y, width, 260, 38)
  context.fill()

  context.strokeStyle = 'rgba(78, 144, 214, 0.24)'
  context.lineWidth = 2
  roundRect(context, x, y, width, 260, 38)
  context.stroke()

  context.fillStyle = '#9cc8ff'
  context.font = '600 24px Segoe UI'
  context.fillText(label.toUpperCase(), x + 32, y + 54)

  context.fillStyle = '#f7f3ea'
  context.font = '700 56px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif'
  wrapText(context, value.toUpperCase(), x + 32, y + 124, width - 64, 62)
}

function getBrandingLine(attribution: WorkoutAttributionSnapshot) {
  return attribution.brandingSource === 'coach'
    ? `Coach-attached save: ${attribution.coachDisplayName ?? 'Current coach'}`
    : 'Guest or app-only result'
}

function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = value.split(' ')
  let line = ''
  let lineIndex = 0

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word

    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y + lineIndex * lineHeight)
      line = word
      lineIndex += 1
    } else {
      line = testLine
    }
  }

  if (line) {
    context.fillText(line, x, y + lineIndex * lineHeight)
  }
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
