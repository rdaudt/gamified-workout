import {
  analyzePushupLandmarks,
  calculateEffortScore,
  calculateTrackingScore,
  formatDuration,
  initialPushupCounterState,
  updatePushupCounter,
} from '@/lib/challenge/pushup'

function createLandmarks(leftElbowAngle: number, rightElbowAngle = leftElbowAngle) {
  const angleToPoint = (angle: number) => {
    const radians = (angle * Math.PI) / 180

    return {
      x: Math.cos(radians),
      y: Math.sin(radians),
      visibility: 0.95,
    }
  }

  const leftShoulder = { x: -1, y: 0, visibility: 0.95 }
  const leftElbow = { x: 0, y: 0, visibility: 0.95 }
  const leftWrist = angleToPoint(leftElbowAngle)
  const rightShoulder = { x: 1, y: 0, visibility: 0.95 }
  const rightElbow = { x: 2, y: 0, visibility: 0.95 }
  const rightPoint = angleToPoint(180 - rightElbowAngle)
  const rightWrist = {
    x: rightElbow.x + rightPoint.x,
    y: rightElbow.y + rightPoint.y,
    visibility: 0.95,
  }

  return [
    { x: 0.5, y: -1, visibility: 0.95 },
    ...Array.from({ length: 10 }, () => ({ x: 0, y: 0, visibility: 0.95 })),
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
  ]
}

describe('pushup challenge helpers', () => {
  it('analyzes pose landmarks into depth and confidence signals', () => {
    const analysis = analyzePushupLandmarks(createLandmarks(95))

    expect(analysis).toEqual(
      expect.objectContaining({
        isConfident: true,
        trackingConfidence: expect.any(Number),
      })
    )
    expect(analysis?.averageElbowAngle).toBeGreaterThanOrEqual(90)
    expect(analysis?.averageElbowAngle).toBeLessThanOrEqual(100)
    expect(analysis?.bodyHeight).toBeGreaterThanOrEqual(0)
    expect(analysis?.bodyHeight).toBeLessThanOrEqual(1)
  })

  it('increments a rep only after a down and lockout cycle', () => {
    const down = {
      averageElbowAngle: 92,
      bodyHeight: 0.05,
      trackingConfidence: 0.95,
      isConfident: true,
    }
    const up = {
      averageElbowAngle: 170,
      bodyHeight: 1,
      trackingConfidence: 0.95,
      isConfident: true,
    }

    const afterDown = updatePushupCounter(initialPushupCounterState, down)
    const afterUp = updatePushupCounter(afterDown.nextState, up)

    expect(afterDown.incremented).toBe(false)
    expect(afterDown.nextState.phase).toBe('down')
    expect(afterUp.incremented).toBe(true)
    expect(afterUp.nextState.reps).toBe(1)
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
