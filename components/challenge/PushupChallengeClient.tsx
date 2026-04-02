'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { createResultCardBlob } from '@/lib/challenge/result-card'
import {
  analyzePushupLandmarks,
  calculateEffortScore,
  calculateTrackingScore,
  defaultPushupThresholds,
  formatDuration,
  initialPushupCounterState,
  updatePushupCounter,
  type PosePoint,
  type PushupCounterState,
} from '@/lib/challenge/pushup'
import {
  buildChallengeFrameSnapshot,
  drawComposedChallengeFrame,
  drawPoseOverlay,
  getPreferredRecordingFormat,
  supportsVideoRecording,
  syncCanvasSize,
  type PoseConnection,
  type RecordingFormat,
  type SessionVideoStatus,
} from '@/lib/challenge/session-video'
import { createWorkoutAttributionSnapshot } from '@/lib/platform/branding'
import { getExerciseById } from '@/lib/platform/exercises'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { hasSupabasePublicEnv } from '@/lib/supabase/env'
import type { WorkoutAttributionSnapshot } from '@/lib/types/domain'

type SessionStatus = SessionVideoStatus
type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'guest' | 'error'

interface ViewerContext {
  userId: string | null
  label: string
  attribution: WorkoutAttributionSnapshot
}

type RelationshipPreview = Pick<
  Tables<'trainee_coach_relationships'>,
  'coach_user_id' | 'attached_via' | 'updated_at'
>
type CoachBrandingPreview = Pick<
  Tables<'coach_profiles'>,
  'nickname' | 'booking_url' | 'accent_color'
>
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']

const exercise = getExerciseById('push-ups')
const wasmPath =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const modelAssetPath =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const appAccentColor = '#8ad1c2'
const coachAccentColor = '#f06d4f'

export function PushupChallengeClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const compositionCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const compositionStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordedVideoUrlRef = useRef<string | null>(null)
  const recordingFormatRef = useRef<RecordingFormat | null>(null)
  const stopRecordingResolverRef = useRef<(() => void) | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const poseConnectionsRef = useRef<PoseConnection[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef(-1)
  const sessionStatusRef = useRef<SessionStatus>('idle')
  const counterStateRef = useRef<PushupCounterState>(initialPushupCounterState)
  const challengeStartMsRef = useRef<number | null>(null)
  const pauseStartedAtRef = useRef<number | null>(null)
  const pausedMsRef = useRef(0)
  const sessionOccurredAtRef = useRef<string | null>(null)
  const elapsedSecondsRef = useRef(0)
  const bodyHeightRef = useRef(1)
  const countdownValueRef = useRef<number | null>(null)
  const viewerContextRef = useRef<ViewerContext>({
    userId: null,
    label: 'Guest challenger',
    attribution: createWorkoutAttributionSnapshot({
      relationship: {
        traineeUserId: 'guest',
        coachUserId: null,
        attachedVia: 'none',
        updatedAt: new Date().toISOString(),
      },
      appAccentColor,
    }),
  })

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [repCount, setRepCount] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [bodyHeight, setBodyHeight] = useState(1)
  const [trackingScore, setTrackingScore] = useState(0)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [viewerLabel, setViewerLabel] = useState('Guest challenger')
  const [countdownValue, setCountdownValue] = useState<number | null>(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [recordingFormatLabel, setRecordingFormatLabel] = useState<'MP4' | 'WebM'>('MP4')
  const [recordingMessage, setRecordingMessage] = useState<string | null>(null)
  const [branding, setBranding] = useState<WorkoutAttributionSnapshot>(
    viewerContextRef.current.attribution
  )

  const canStart = cameraStatus === 'ready' && sessionStatus === 'idle'
  const accentStyle = useMemo(
    () => ({ boxShadow: `0 0 0 1px ${branding.accentColor}33 inset` }),
    [branding.accentColor]
  )

  useEffect(() => {
    let cancelled = false

    async function loadViewerContext() {
      if (!hasSupabasePublicEnv()) {
        return
      }

      try {
        const supabase = createSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || cancelled) {
          return
        }

        const { data: relationshipData } = await supabase
          .from('trainee_coach_relationships')
          .select('coach_user_id, attached_via, updated_at')
          .eq('trainee_user_id', user.id)
          .maybeSingle()
        const relationship = relationshipData as RelationshipPreview | null

        const label =
          typeof user.user_metadata.user_name === 'string'
            ? user.user_metadata.user_name
            : user.email?.split('@')[0] ?? 'Registered challenger'

        let attribution = createWorkoutAttributionSnapshot({
          relationship: {
            traineeUserId: user.id,
            coachUserId: relationship?.coach_user_id ?? null,
            attachedVia: relationship?.attached_via ?? 'none',
            updatedAt: relationship?.updated_at ?? new Date().toISOString(),
          },
          appAccentColor,
        })

        if (relationship?.coach_user_id) {
          const { data: coachProfileData } = await supabase
            .from('coach_profiles')
            .select('nickname, booking_url, accent_color')
            .eq('user_id', relationship.coach_user_id)
            .maybeSingle()
          const coachProfile = coachProfileData as CoachBrandingPreview | null

          attribution = createWorkoutAttributionSnapshot({
            relationship: {
              traineeUserId: user.id,
              coachUserId: relationship.coach_user_id,
              attachedVia: relationship.attached_via,
              updatedAt: relationship.updated_at,
            },
            coachDisplayName: coachProfile?.nickname ?? 'Current coach',
            coachBookingUrl: coachProfile?.booking_url ?? undefined,
            coachAccentColor: coachProfile?.accent_color ?? coachAccentColor,
            appAccentColor,
          })
        }

        if (!cancelled) {
          const nextContext = {
            userId: user.id,
            label,
            attribution,
          }

          viewerContextRef.current = nextContext
          setViewerLabel(label)
          setBranding(attribution)
        }
      } catch {
        // Guest mode remains available even if viewer bootstrap fails.
      }
    }

    loadViewerContext()

    return () => {
      cancelled = true
      stopCountdown()
      void stopVideoRecording({ discard: true })
      stopAnimationLoop()
      stopCameraStream()
      clearRecordedVideo()
      poseLandmarkerRef.current?.close()
      poseLandmarkerRef.current = null
      compositionCanvasRef.current = null
      compositionStreamRef.current = null
      recordingFormatRef.current = null
    }
  }, [])

  useEffect(() => {
    if (sessionStatus !== 'countdown') {
      stopCountdown()
      setCountdownValue(null)
      countdownValueRef.current = null

      return
    }

    setCountdownValue(3)
    countdownValueRef.current = 3
    countdownTimerRef.current = window.setInterval(() => {
      setCountdownValue((currentValue) => {
        if (currentValue === null || currentValue <= 1) {
          stopCountdown()
          sessionStatusRef.current = 'live'
          setSessionStatus('live')
          countdownValueRef.current = null

          return null
        }

        const nextValue = currentValue - 1
        countdownValueRef.current = nextValue

        return nextValue
      })
    }, 1000)

    return stopCountdown
  }, [sessionStatus])

  async function enableCamera() {
    if (cameraStatus === 'requesting' || cameraStatus === 'ready') {
      return
    }

    setCameraStatus('requesting')
    setCameraError(null)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera capture is not available in this browser.')
      }

      const video = videoRef.current
      const canvas = overlayRef.current

      if (!video || !canvas) {
        throw new Error('Challenge capture elements are not mounted.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      streamRef.current = stream
      video.srcObject = stream
      await video.play()

      const vision = await import('@mediapipe/tasks-vision')
      const fileset = await vision.FilesetResolver.forVisionTasks(wasmPath)
      const poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error('Overlay canvas could not be initialized.')
      }

      poseLandmarkerRef.current = poseLandmarker
      poseConnectionsRef.current = vision.PoseLandmarker.POSE_CONNECTIONS
      setCameraStatus('ready')
      startAnimationLoop()
    } catch (error) {
      stopCameraStream()
      setCameraStatus('error')
      setCameraError(error instanceof Error ? error.message : 'Unable to access camera.')
    }
  }

  function startSession() {
    clearRecordedVideo()
    counterStateRef.current = initialPushupCounterState
    challengeStartMsRef.current = null
    pauseStartedAtRef.current = null
    pausedMsRef.current = 0
    sessionOccurredAtRef.current = null
    elapsedSecondsRef.current = 0
    sessionStatusRef.current = 'countdown'
    setSessionStatus('countdown')
    setRepCount(0)
    setElapsedSeconds(0)
    setTrackingScore(0)
    setBodyHeight(1)
    bodyHeightRef.current = 1
    setSaveStatus('idle')
    setSaveMessage(null)
    setRecordingMessage(null)
    void startVideoRecording()
  }

  function pauseSession() {
    if (sessionStatusRef.current !== 'live') {
      return
    }

    pauseStartedAtRef.current = performance.now()
    sessionStatusRef.current = 'paused'
    setSessionStatus('paused')
  }

  function resumeSession() {
    if (sessionStatusRef.current !== 'paused') {
      return
    }

    if (pauseStartedAtRef.current) {
      pausedMsRef.current += performance.now() - pauseStartedAtRef.current
    }

    pauseStartedAtRef.current = null
    sessionStatusRef.current = 'live'
    setSessionStatus('live')
  }

  async function stopSession() {
    if (sessionStatusRef.current === 'idle') {
      return
    }

    const durationSeconds = computeElapsedSeconds()
    elapsedSecondsRef.current = durationSeconds
    sessionStatusRef.current = 'complete'
    setSessionStatus('complete')
    setElapsedSeconds(durationSeconds)
    await stopVideoRecording()

    const context = viewerContextRef.current

    if (!context.userId) {
      setSaveStatus('guest')
      setSaveMessage('Guest mode keeps the result shareable but does not persist it.')
      return
    }

    if (counterStateRef.current.reps <= 0) {
      setSaveStatus('idle')
      setSaveMessage('No reps were captured, so nothing was saved.')
      return
    }

    setSaveStatus('saving')
    setSaveMessage('Saving your challenge result...')

    try {
      const supabase = createSupabaseBrowserClient()
      const tracking = Math.round(calculateTrackingScore(counterStateRef.current))
      const effort = calculateEffortScore(counterStateRef.current.reps, durationSeconds)
      const workoutInsert: WorkoutInsert = {
        user_id: context.userId,
        exercise: 'push-ups',
        occurred_at: sessionOccurredAtRef.current ?? new Date().toISOString(),
        duration_seconds: durationSeconds,
        good_form_reps: counterStateRef.current.reps,
        total_reps: counterStateRef.current.reps,
        form_score: tracking,
        effort_score: effort,
        session_classification: 'pushup-challenge',
        branding_source: context.attribution.brandingSource,
        coach_id: context.attribution.coachId,
        coach_display_name: context.attribution.coachDisplayName,
        coach_booking_url: context.attribution.coachBookingUrl,
        accent_color: context.attribution.accentColor,
      }

      const { error } = await supabase.from('workouts').insert(workoutInsert as never)

      if (error) {
        throw error
      }

      setSaveStatus('saved')
      setSaveMessage('Challenge result saved to your history.')
    } catch (error) {
      setSaveStatus('error')
      setSaveMessage(
        error instanceof Error ? error.message : 'Unable to save your challenge result.'
      )
    }
  }

  function resetSession() {
    stopCountdown()
    void stopVideoRecording({ discard: true })
    sessionStatusRef.current = 'idle'
    counterStateRef.current = initialPushupCounterState
    challengeStartMsRef.current = null
    pauseStartedAtRef.current = null
    pausedMsRef.current = 0
    sessionOccurredAtRef.current = null
    elapsedSecondsRef.current = 0
    bodyHeightRef.current = 1
    setSessionStatus('idle')
    setRepCount(0)
    setElapsedSeconds(0)
    setTrackingScore(0)
    setBodyHeight(1)
    setSaveStatus('idle')
    setSaveMessage(null)
    setCountdownValue(null)
    countdownValueRef.current = null
    setRecordingMessage(null)
    setRecordingFormatLabel('MP4')
    clearRecordedVideo()
  }

  function cancelChallenge() {
    resetSession()
    stopAnimationLoop()
    stopCameraStream()
    lastVideoTimeRef.current = -1
    poseLandmarkerRef.current?.close()
    poseLandmarkerRef.current = null

    const video = videoRef.current
    const canvas = overlayRef.current

    if (video) {
      video.pause()
      video.srcObject = null
    }

    if (canvas) {
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
    }

    setCameraStatus('idle')
    setCameraError(null)
  }

  async function startVideoRecording() {
    if (!supportsVideoRecording()) {
      setRecordingMessage('Debug video capture is not supported in this browser.')

      return
    }

    if (!streamRef.current || mediaRecorderRef.current) {
      return
    }

    try {
      recordedChunksRef.current = []
      const compositionCanvas = getOrCreateCompositionCanvas()
      syncCanvasToVideo(compositionCanvas)
      const compositionStream = compositionCanvas.captureStream(30)
      compositionStreamRef.current = compositionStream
      const recordingFormat = getPreferredRecordingFormat()

      if (!recordingFormat) {
        throw new Error('No supported recording format was found.')
      }

      recordingFormatRef.current = recordingFormat
      setRecordingFormatLabel(recordingFormat.label)

      const mediaRecorder = new MediaRecorder(compositionStream, {
        mimeType: recordingFormat.mimeType,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const resolver = stopRecordingResolverRef.current
        stopRecordingResolverRef.current = null

        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, {
            type: mediaRecorder.mimeType || recordingFormat.mimeType,
          })
          const url = URL.createObjectURL(blob)
          updateRecordedVideoUrl(url)
          setRecordingMessage(
            recordingFormat.isIPhoneFriendly
              ? 'Session video is ready to download as MP4.'
              : 'Session video is ready to download, but this browser only supports WebM export.'
          )
        } else {
          setRecordingMessage('No session video was captured for this run.')
        }

        mediaRecorderRef.current = null
        stopCompositionStream()
        recordingFormatRef.current = null
        recordedChunksRef.current = []
        resolver?.()
      }

      mediaRecorder.onerror = () => {
        const resolver = stopRecordingResolverRef.current
        stopRecordingResolverRef.current = null
        mediaRecorderRef.current = null
        stopCompositionStream()
        recordingFormatRef.current = null
        recordedChunksRef.current = []
        setRecordingMessage('Session video capture failed for this run.')
        resolver?.()
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setRecordingMessage(
        recordingFormat.isIPhoneFriendly
          ? 'Recording session video with burned-in challenge HUD as MP4.'
          : 'Recording session video with burned-in challenge HUD as WebM.'
      )
    } catch {
      stopCompositionStream()
      recordingFormatRef.current = null
      setRecordingMessage('Session video capture could not be started in this browser.')
    }
  }

  async function stopVideoRecording(options?: { discard?: boolean }) {
    const mediaRecorder = mediaRecorderRef.current

    if (!mediaRecorder) {
      if (options?.discard) {
        clearRecordedVideo()
      }

      return
    }

    if (options?.discard) {
      mediaRecorder.ondataavailable = null
      mediaRecorder.onstop = null
      mediaRecorder.onerror = null
      mediaRecorderRef.current = null
      recordedChunksRef.current = []

      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      }

      stopCompositionStream()
      recordingFormatRef.current = null
      stopRecordingResolverRef.current = null
      clearRecordedVideo()
      setRecordingMessage(null)

      return
    }

    await new Promise<void>((resolve) => {
      stopRecordingResolverRef.current = resolve

      if (mediaRecorder.state === 'inactive') {
        resolve()

        return
      }

      mediaRecorder.stop()
    })
  }

  function updateRecordedVideoUrl(url: string | null) {
    if (recordedVideoUrlRef.current) {
      URL.revokeObjectURL(recordedVideoUrlRef.current)
    }

    recordedVideoUrlRef.current = url
    setRecordedVideoUrl(url)
  }

  function clearRecordedVideo() {
    updateRecordedVideoUrl(null)
  }

  function getOrCreateCompositionCanvas() {
    if (!compositionCanvasRef.current) {
      compositionCanvasRef.current = document.createElement('canvas')
    }

    return compositionCanvasRef.current
  }

  function syncCanvasToVideo(canvas: HTMLCanvasElement) {
    const video = videoRef.current

    if (!video) {
      return
    }

    syncCanvasSize(canvas, video)
  }

  function stopCompositionStream() {
    compositionStreamRef.current?.getTracks().forEach((track) => track.stop())
    compositionStreamRef.current = null
  }

  function downloadSessionVideo() {
    if (!recordedVideoUrl) {
      return
    }

    const anchor = document.createElement('a')
    anchor.href = recordedVideoUrl
    anchor.download = `beat-past-you-session-video.${
      recordingFormatRef.current?.extension ??
      (recordingFormatLabel === 'MP4' ? 'mp4' : 'webm')
    }`
    anchor.click()
  }

  async function shareResult() {
    try {
      const blob = await createCardBlob()
      const file = new File([blob], 'beat-past-you-pushup-result.png', {
        type: 'image/png',
      })
      const shareData = {
        files: [file],
        title: 'Beat Past You result',
        text: `I logged ${repCount} pushups in ${formatDuration(elapsedSeconds)} on Beat Past You.`,
      }

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData)
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
        })
        return
      }

      await downloadResult()
    } catch {
      // Ignore user-cancelled share interactions.
    }
  }

  async function downloadResult() {
    const blob = await createCardBlob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'beat-past-you-pushup-result.png'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function createCardBlob() {
    return createResultCardBlob({
      title: 'Pushup challenge',
      exercise: 'push-ups',
      reps: repCount,
      durationSeconds: elapsedSecondsRef.current || elapsedSeconds,
      occurredAt: sessionOccurredAtRef.current ?? new Date().toISOString(),
      attribution: branding,
    })
  }

  function startAnimationLoop() {
    stopAnimationLoop()

    const loop = () => {
      const video = videoRef.current
      const canvas = overlayRef.current
      const compositionCanvas = compositionCanvasRef.current
      const poseLandmarker = poseLandmarkerRef.current

      if (!video || !canvas || !poseLandmarker) {
        animationFrameRef.current = requestAnimationFrame(loop)
        return
      }

      const context = canvas.getContext('2d')

      if (!context) {
        animationFrameRef.current = requestAnimationFrame(loop)
        return
      }

      syncCanvasSize(canvas, video)
      context.clearRect(0, 0, canvas.width, canvas.height)

      const now = performance.now()
      let latestLandmarks: PosePoint[] | null = null
      let latestAnalysis: ReturnType<typeof analyzePushupLandmarks> | null = null
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const result = poseLandmarker.detectForVideo(video, now)
        const landmarks = result.landmarks[0]

        if (landmarks) {
          latestLandmarks = landmarks as PosePoint[]
          drawPoseOverlay(context, canvas, latestLandmarks, poseConnectionsRef.current)

          const analysis = analyzePushupLandmarks(latestLandmarks)

          if (analysis) {
            latestAnalysis = analysis
            const nextAnalysis = analysis
            const nextBodyHeight = bodyHeightRef.current * 0.7 + nextAnalysis.bodyHeight * 0.3
            bodyHeightRef.current = nextBodyHeight
            setBodyHeight(nextBodyHeight)

            if (sessionStatusRef.current === 'live') {
              const update = updatePushupCounter(
                counterStateRef.current,
                nextAnalysis,
                defaultPushupThresholds
              )

              counterStateRef.current = update.nextState
              setTrackingScore(
                Math.round(calculateTrackingScore(counterStateRef.current))
              )

              if (
                challengeStartMsRef.current === null &&
                update.nextState.eligibleFrames >= defaultPushupThresholds.minimumReadyFrames &&
                nextAnalysis.averageElbowAngle <= defaultPushupThresholds.downAngle
              ) {
                challengeStartMsRef.current = performance.now()
                sessionOccurredAtRef.current = new Date().toISOString()
              }

              if (update.incremented) {
                setRepCount(update.nextState.reps)
              }
            }
          }
        }
      }

      if (compositionCanvas) {
        syncCanvasSize(compositionCanvas, video)
        const compositionContext = compositionCanvas.getContext('2d')

        if (compositionContext) {
          const snapshot = buildChallengeFrameSnapshot({
            status: sessionStatusRef.current,
            countdownValue: countdownValueRef.current,
            repCount: counterStateRef.current.reps,
            elapsedSeconds: elapsedSecondsRef.current || elapsedSeconds,
            trackingScore: Math.round(calculateTrackingScore(counterStateRef.current)),
            bodyHeight: latestAnalysis?.bodyHeight ?? bodyHeightRef.current,
            counterPhase: counterStateRef.current.phase,
            averageElbowAngle: latestAnalysis?.averageElbowAngle ?? null,
            postureConfidence: latestAnalysis?.postureConfidence ?? null,
            isPushupReady: latestAnalysis?.isPushupReady ?? false,
            eligibleFrames: counterStateRef.current.eligibleFrames,
          })

          drawComposedChallengeFrame({
            canvas: compositionCanvas,
            context: compositionContext,
            video,
            snapshot,
            landmarks: latestLandmarks,
            connections: poseConnectionsRef.current,
          })
        }
      }

      if (sessionStatusRef.current === 'live') {
        if (challengeStartMsRef.current !== null) {
          const nextElapsedSeconds = computeElapsedSeconds()

          if (nextElapsedSeconds !== elapsedSecondsRef.current) {
            elapsedSecondsRef.current = nextElapsedSeconds
            setElapsedSeconds(nextElapsedSeconds)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop)
    }

    animationFrameRef.current = requestAnimationFrame(loop)
  }

  function stopAnimationLoop() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  function stopCountdown() {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  function stopCameraStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function computeElapsedSeconds() {
    if (!challengeStartMsRef.current) {
      return elapsedSecondsRef.current
    }

    const now = performance.now()
    const activePauseMs =
      sessionStatusRef.current === 'paused' && pauseStartedAtRef.current
        ? now - pauseStartedAtRef.current
        : 0

    return Math.max(
      0,
      Math.round((now - challengeStartMsRef.current - pausedMsRef.current - activePauseMs) / 1000)
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="rounded-[2rem] border border-line bg-panel p-4 shadow-glow">
        <div className="rounded-[1.75rem] border border-line bg-canvas/80 p-3">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-[3/4] w-full scale-x-[-1] object-cover"
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-accentSoft">
              Front camera / portrait
            </div>
            {countdownValue !== null ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/28">
                <div className="rounded-[1.75rem] border border-white/20 bg-black/45 px-8 py-6 text-center shadow-glow">
                  <p className="text-xs uppercase tracking-[0.32em] text-accentSoft">
                    Get ready
                  </p>
                  <p className="mt-3 font-display text-7xl text-ink">{countdownValue}</p>
                </div>
              </div>
            ) : null}
            <div className="absolute bottom-4 right-3 flex h-[58%] w-6 items-end rounded-full border border-line bg-canvas/60 p-1">
              <div className="relative w-full rounded-full bg-panelAlt">
                <div
                  className="absolute inset-x-0 h-8 rounded-full border border-canvas bg-signal transition-[bottom]"
                  style={{ bottom: `${bodyHeight * 100}%` }}
                />
                <div className="h-48 rounded-full bg-gradient-to-t from-[#143846] to-[#244a57]" />
              </div>
            </div>
          </div>

          <div
            className="mt-4 rounded-[1.5rem] border border-line bg-panel p-4"
            style={accentStyle}
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <StatTile label="Reps" value={repCount.toString()} />
              <StatTile label="Elapsed" value={formatDuration(elapsedSeconds)} />
              <StatTile label="Tracking" value={`${trackingScore}%`} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {(cameraStatus === 'idle' || cameraStatus === 'error') && (
                <button
                  onClick={enableCamera}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
                >
                  {cameraStatus === 'error' ? 'Try camera again' : 'Enable front camera'}
                </button>
              )}

              {cameraStatus === 'requesting' && (
                <button
                  disabled
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas/70"
                >
                  Connecting camera...
                </button>
              )}

              {canStart && (
                <button
                  onClick={startSession}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
                >
                  Get ready
                </button>
              )}

              {sessionStatus === 'live' && (
                <>
                  <button
                    onClick={pauseSession}
                    className="rounded-full border border-line px-4 py-2 text-sm text-ink/75"
                  >
                    Pause
                  </button>
                  <button
                    onClick={stopSession}
                    className="rounded-full border border-accent px-4 py-2 text-sm text-accentSoft"
                  >
                    Stop
                  </button>
                </>
              )}

              {sessionStatus === 'paused' && (
                <>
                  <button
                    onClick={resumeSession}
                    className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas"
                  >
                    Resume
                  </button>
                  <button
                    onClick={stopSession}
                    className="rounded-full border border-accent px-4 py-2 text-sm text-accentSoft"
                  >
                    Finish
                  </button>
                </>
              )}

              {sessionStatus === 'complete' && (
                <button
                  onClick={resetSession}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink/75"
                >
                  Reset
                </button>
              )}

              {cameraStatus === 'ready' && (
                <button
                  onClick={cancelChallenge}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink/75"
                >
                  Cancel challenge
                </button>
              )}
            </div>

            {cameraError ? (
              <p className="mt-3 text-sm text-accentSoft">{cameraError}</p>
            ) : sessionStatus === 'countdown' ? (
              <p className="mt-3 text-sm text-ink/68">
                Countdown is live. The timer will begin only when the first valid pushup
                motion starts.
              </p>
            ) : sessionStatus === 'live' && challengeStartMsRef.current === null ? (
              <p className="mt-3 text-sm text-ink/68">
                Hold your setup. Elapsed time stays at zero until the first valid pushup
                descent is detected.
              </p>
            ) : (
              <p className="mt-3 text-sm text-ink/68">
                Prop the phone low in front of you, stay centered, and let the body-height
                rail echo your pushup depth live.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <article className="rounded-[2rem] border border-line bg-panel p-6 shadow-glow">
          <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
            {exercise.name}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight">
            Challenge yourself first. Share it before the moment cools off.
          </h2>
          <p className="mt-4 text-sm text-ink/72">
            Beat Past You is tuned for portrait, front-camera pushup sessions that stay
            quick, visual, and easy to share. Reps and elapsed time are the core signal.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-ink/75">
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Pose overlay tracks the challenge in real time.
            </div>
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Guests can finish and share instantly with no account required.
            </div>
            <div className="rounded-2xl bg-panelAlt px-4 py-3">
              Signed-in challengers save sessions and coach branding snapshots automatically.
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-line bg-panel p-6 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-signal">Result card</p>
              <h2 className="mt-2 font-display text-3xl">Share-ready by default</h2>
            </div>
            <div className="rounded-full border border-line bg-panelAlt px-3 py-1 text-xs text-ink/70">
              {viewerLabel}
            </div>
          </div>

          <div className="mt-4 rounded-[1.75rem] border border-line bg-[#0d1725] p-5">
            <div className="rounded-[1.35rem] border border-line bg-gradient-to-b from-[#101f30] to-[#0b1521] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
                Beat Past You
              </p>
              <h3 className="mt-4 font-display text-6xl text-ink">{repCount}</h3>
              <p className="mt-2 text-sm uppercase tracking-[0.28em] text-signal">
                pushups logged
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MetricCard label="Elapsed" value={formatDuration(elapsedSeconds)} />
                <MetricCard
                  label="Branding"
                  value={
                    branding.brandingSource === 'coach'
                      ? branding.coachDisplayName ?? 'Current coach'
                      : 'Beat Past You'
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={shareResult}
              disabled={sessionStatus !== 'complete'}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-canvas disabled:cursor-not-allowed disabled:opacity-60"
            >
              Share
            </button>
            <button
              onClick={downloadResult}
              disabled={sessionStatus !== 'complete'}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink/75 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Download
            </button>
            <button
              onClick={downloadSessionVideo}
              disabled={sessionStatus !== 'complete' || !recordedVideoUrl}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink/75 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {`Download session video (${recordingFormatLabel})`}
            </button>
          </div>

          <p className="mt-3 text-sm text-ink/68">
            Share uses the mobile system share sheet when available. Direct Instagram posting
            stays out of scope for this release.
          </p>

          {saveMessage ? (
            <p
              className={`mt-3 text-sm ${
                saveStatus === 'error' ? 'text-accentSoft' : 'text-signal'
              }`}
            >
              {saveMessage}
            </p>
          ) : null}

          {recordingMessage ? (
            <p className="mt-3 text-sm text-ink/68">{recordingMessage}</p>
          ) : null}
        </article>
      </section>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-panelAlt px-3 py-4">
      <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-[#132336] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.28em] text-ink/45">{label}</p>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
    </div>
  )
}
