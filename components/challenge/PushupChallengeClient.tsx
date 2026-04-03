'use client'

import { useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import {
  buildSponsorShareText,
  sponsorBusinessName,
  sponsorCardFilename,
  sponsorChallengeTitle,
  sponsorCoachName,
  sponsorLogoPath,
  sponsorVideoFilenameBase,
} from '@/lib/challenge/campaign'
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
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database, Tables } from '@/lib/supabase/database.types'
import { hasSupabasePublicEnv } from '@/lib/supabase/env'
import type { WorkoutAttributionSnapshot } from '@/lib/types/domain'

type SessionStatus = SessionVideoStatus
type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error'
type SaveStatus = 'idle' | 'saving' | 'saved' | 'guest' | 'error'
type ActiveTab = 'challenge' | 'share'

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

const wasmPath =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
const modelAssetPath =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'
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
  const cardPreviewUrlRef = useRef<string | null>(null)
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
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null)
  const [recordingFormatLabel, setRecordingFormatLabel] = useState<'MP4' | 'WebM'>('MP4')
  const [recordingMessage, setRecordingMessage] = useState<string | null>(null)
  const [branding, setBranding] = useState<WorkoutAttributionSnapshot>(
    viewerContextRef.current.attribution
  )
  const [activeTab, setActiveTab] = useState<ActiveTab>('challenge')

  const canStart = cameraStatus === 'ready' && sessionStatus === 'idle'
  const shareReady = sessionStatus === 'complete' && repCount > 0

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
      clearCardPreview()
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

  useEffect(() => {
    if (!shareReady) {
      clearCardPreview()
      setActiveTab('challenge')

      return
    }

    let cancelled = false

    async function loadCardPreview() {
      try {
        const blob = await createCardBlob()

        if (cancelled) {
          return
        }

        updateCardPreviewUrl(URL.createObjectURL(blob))
      } catch {
        if (!cancelled) {
          clearCardPreview()
        }
      }
    }

    loadCardPreview()

    return () => {
      cancelled = true
    }
  }, [shareReady, repCount, elapsedSeconds, branding])

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
    clearCardPreview()
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

  function updateCardPreviewUrl(url: string | null) {
    if (cardPreviewUrlRef.current) {
      URL.revokeObjectURL(cardPreviewUrlRef.current)
    }

    cardPreviewUrlRef.current = url
    setCardPreviewUrl(url)
  }

  function clearCardPreview() {
    updateCardPreviewUrl(null)
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
    anchor.download = `${sponsorVideoFilenameBase}.${
      recordingFormatRef.current?.extension ??
      (recordingFormatLabel === 'MP4' ? 'mp4' : 'webm')
    }`
    anchor.click()
  }

  async function shareResult() {
    try {
      const blob = await createCardBlob()
      const file = new File([blob], sponsorCardFilename, {
        type: 'image/png',
      })
      const shareData = {
        files: [file],
        title: `${sponsorCoachName} ${sponsorChallengeTitle}`,
        text: buildSponsorShareText(repCount, elapsedSeconds),
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
    anchor.download = sponsorCardFilename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function createCardBlob() {
    return createResultCardBlob({
      title: sponsorChallengeTitle,
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
      let latestWorldLandmarks: PosePoint[] | null = null
      let latestAnalysis: ReturnType<typeof analyzePushupLandmarks> | null = null
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime
        const result = poseLandmarker.detectForVideo(video, now)
        const landmarks = result.landmarks[0]
        const worldLandmarks = result.worldLandmarks[0]

        if (landmarks) {
          latestLandmarks = landmarks as PosePoint[]
          latestWorldLandmarks = (worldLandmarks as PosePoint[] | undefined) ?? null
          drawPoseOverlay(context, canvas, latestLandmarks, poseConnectionsRef.current)

          const analysis = analyzePushupLandmarks(
            latestLandmarks,
            latestWorldLandmarks ?? undefined
          )

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

              if (challengeStartMsRef.current === null && update.startedMotion) {
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
            supportActive: counterStateRef.current.supportActive,
            smoothedDepthSignal: counterStateRef.current.smoothedDepthSignal,
            topThreshold: counterStateRef.current.topThreshold,
            bottomThreshold: counterStateRef.current.bottomThreshold,
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
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(80,145,255,0.24),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(255,128,72,0.16),_transparent_28%),linear-gradient(180deg,_#04070d_0%,_#091523_45%,_#050910_100%)] px-3 py-4 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl justify-center">
        <div className="w-full max-w-[420px] sm:max-w-[470px] sm:rounded-[3.3rem] sm:border sm:border-[#2f4259] sm:bg-[#d7dee8]/10 sm:p-3 sm:shadow-[0_30px_100px_rgba(4,8,18,0.65)]">
          <section className="relative overflow-hidden rounded-[2.7rem] border border-white/10 bg-[#07111d] text-[#f7f3ea] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,_rgba(77,152,255,0.26),_transparent_22%),radial-gradient(circle_at_86%_12%,_rgba(255,126,81,0.22),_transparent_18%),linear-gradient(180deg,_rgba(17,38,62,0.88)_0%,_rgba(8,16,28,0.95)_55%,_rgba(5,10,18,1)_100%)]" />
            <div className="absolute inset-x-[24%] top-0 hidden h-7 rounded-b-[1.35rem] border-x border-b border-white/10 bg-[#0f1f31] sm:block" />
            <div className="relative z-10 p-4 sm:p-5">
              <header className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.02))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-24 items-center justify-center rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.08),_rgba(2,6,14,0.25))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <img
                      src={sponsorLogoPath}
                      alt={sponsorBusinessName}
                      className="max-h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-[#9cc8ff]">
                      {sponsorCoachName}
                    </p>
                    <h1 className="mt-1 font-display text-[2.35rem] uppercase leading-[0.9] tracking-[0.02em] text-[#eff4ff] sm:text-[2.8rem]">
                      {sponsorChallengeTitle}
                    </h1>
                    <p className="mt-2 max-w-[18rem] text-xs uppercase tracking-[0.24em] text-[#ffd5b6]/85">
                      Strength. power. fun. built to be shared fast.
                    </p>
                  </div>
                </div>
              </header>

              <div className="mt-4 flex gap-2 rounded-[1.6rem] border border-white/10 bg-[#09192a]/75 p-2">
                <TabButton
                  active={activeTab === 'challenge'}
                  disabled={false}
                  onClick={() => setActiveTab('challenge')}
                >
                  Challenge yourself
                </TabButton>
                <TabButton
                  active={activeTab === 'share'}
                  disabled={!shareReady}
                  onClick={() => {
                    if (shareReady) {
                      setActiveTab('share')
                    }
                  }}
                >
                  Share
                </TabButton>
              </div>

              {activeTab === 'challenge' ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-[2rem] border border-[#28476c] bg-[linear-gradient(180deg,_rgba(8,18,30,0.92),_rgba(8,17,27,0.98))] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    <div className="relative overflow-hidden rounded-[1.6rem] border border-[#2e4b6e] bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
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
                      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-[#07111d]/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9cc8ff]">
                        {sponsorBusinessName}
                      </div>
                      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-[#2f547c] bg-[#0d2035]/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd5b6]">
                        Front camera / portrait
                      </div>
                      {countdownValue !== null ? (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#02050bcc]">
                          <div className="rounded-[1.9rem] border border-white/10 bg-[#081525]/82 px-10 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#9cc8ff]">
                              Get ready
                            </p>
                            <p className="mt-3 font-display text-7xl leading-none text-[#fff4e8]">
                              {countdownValue}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <div className="absolute bottom-4 right-3 flex h-[58%] w-6 items-end rounded-full border border-[#2f547c] bg-[#07111d]/70 p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
                        <div className="relative w-full rounded-full bg-[#0d2035]">
                          <div
                            className="absolute inset-x-0 h-8 rounded-full border border-[#e9f6ff] bg-[#4aa9ff] transition-[bottom]"
                            style={{ bottom: `${bodyHeight * 100}%` }}
                          />
                          <div className="h-48 rounded-full bg-gradient-to-t from-[#123c67] to-[#2d7de0]" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <MicrositeStat label="Reps" value={repCount.toString()} accent="signal" />
                      <MicrositeStat
                        label="Elapsed"
                        value={formatDuration(elapsedSeconds)}
                        accent="accent"
                      />
                      <MicrositeStat
                        label="Tracking"
                        value={`${trackingScore}%`}
                        accent="ink"
                      />
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[#09192a]/88 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                    <div className="grid grid-cols-2 gap-3">
                      {(cameraStatus === 'idle' || cameraStatus === 'error') && (
                        <ActionButton
                          onClick={enableCamera}
                          variant="primary"
                          className="col-span-2"
                        >
                          {cameraStatus === 'error' ? 'Try camera again' : 'Enable camera'}
                        </ActionButton>
                      )}

                      {cameraStatus === 'requesting' && (
                        <ActionButton disabled variant="primary" className="col-span-2">
                          Connecting camera...
                        </ActionButton>
                      )}

                      {canStart && (
                        <ActionButton onClick={startSession} variant="primary">
                          Get ready
                        </ActionButton>
                      )}

                      {sessionStatus === 'live' && (
                        <>
                          <ActionButton onClick={pauseSession} variant="secondary">
                            Pause
                          </ActionButton>
                          <ActionButton onClick={stopSession} variant="outline">
                            Stop
                          </ActionButton>
                        </>
                      )}

                      {sessionStatus === 'paused' && (
                        <>
                          <ActionButton onClick={resumeSession} variant="primary">
                            Resume
                          </ActionButton>
                          <ActionButton onClick={stopSession} variant="outline">
                            Finish
                          </ActionButton>
                        </>
                      )}

                      {sessionStatus === 'complete' && (
                        <>
                          <ActionButton
                            onClick={() => setActiveTab('share')}
                            variant="primary"
                            disabled={!shareReady}
                          >
                            Open share
                          </ActionButton>
                          <ActionButton onClick={resetSession} variant="secondary">
                            New challenge
                          </ActionButton>
                        </>
                      )}

                      {cameraStatus === 'ready' && sessionStatus !== 'complete' && (
                        <ActionButton
                          onClick={cancelChallenge}
                          variant="ghost"
                          className="col-span-2"
                        >
                          Cancel challenge
                        </ActionButton>
                      )}
                    </div>

                    <div className="mt-4 rounded-[1.5rem] border border-[#1f3955] bg-[#071523] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cc8ff]">
                        Arena status
                      </p>
                      {cameraError ? (
                        <p className="mt-2 text-sm text-[#ffbca5]">{cameraError}</p>
                      ) : sessionStatus === 'countdown' ? (
                        <p className="mt-2 text-sm text-[#d7e3f8]/78">
                          Countdown is live. Timing starts only when the first valid pushup
                          motion is detected.
                        </p>
                      ) : sessionStatus === 'live' && challengeStartMsRef.current === null ? (
                        <p className="mt-2 text-sm text-[#d7e3f8]/78">
                          Hold your setup. Stay centered and let the counter arm off your
                          first descent.
                        </p>
                      ) : shareReady ? (
                        <p className="mt-2 text-sm text-[#d7e3f8]/78">
                          Session complete. Your share card and session video are ready in the
                          Share tab.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-[#d7e3f8]/78">
                          Prop the phone low, keep your whole upper body in frame, and let the
                          rail echo your depth live.
                        </p>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-[#d7e3f8]/78">
                      <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-3">
                        Pose overlay and elevator stay visible so testers can trust what was
                        captured.
                      </div>
                      <div className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-3">
                        The share tab unlocks after a completed result with reps and elapsed
                        time.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="rounded-[2rem] border border-[#28476c] bg-[linear-gradient(180deg,_rgba(8,18,30,0.92),_rgba(8,17,27,0.98))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9cc8ff]">
                          Share artifact
                        </p>
                        <h2 className="mt-2 font-display text-3xl uppercase leading-none text-[#f7f3ea]">
                          Card first
                        </h2>
                      </div>
                      <div className="rounded-full border border-[#2f547c] bg-[#0d2035]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ffd5b6]">
                        {viewerLabel}
                      </div>
                    </div>

                    <div className="mt-4 rounded-[1.7rem] border border-[#355678] bg-[#06111d] p-3">
                      <div className="overflow-hidden rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(16,31,53,0.92),_rgba(6,12,20,1))]">
                        {cardPreviewUrl ? (
                          <img
                            src={cardPreviewUrl}
                            alt="Pushup challenge result card"
                            className="aspect-[9/16] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[9/16] items-center justify-center px-8 text-center text-sm text-[#d7e3f8]/72">
                            Finish a challenge to unlock the branded result card preview.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <ActionButton
                        onClick={shareResult}
                        disabled={!shareReady}
                        variant="primary"
                        className="w-full"
                      >
                        Share card
                      </ActionButton>
                      <ActionButton
                        onClick={downloadResult}
                        disabled={!shareReady}
                        variant="secondary"
                        className="w-full"
                      >
                        Download card
                      </ActionButton>
                      <ActionButton
                        onClick={downloadSessionVideo}
                        disabled={!shareReady || !recordedVideoUrl}
                        variant="secondary"
                        className="w-full"
                      >
                        {`Download session video (${recordingFormatLabel})`}
                      </ActionButton>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[#09192a]/88 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
                    <div className="grid gap-3">
                      <ShareInfoCard
                        label="Brand"
                        value={`${sponsorCoachName} x ${sponsorBusinessName}`}
                      />
                      <ShareInfoCard
                        label="Result"
                        value={`${repCount} reps / ${formatDuration(elapsedSeconds)}`}
                      />
                      <ShareInfoCard
                        label="Session video"
                        value={
                          recordedVideoUrl
                            ? `Ready to download as ${recordingFormatLabel}`
                            : 'Generated after a completed run'
                        }
                      />
                    </div>

                    <p className="mt-4 text-sm text-[#d7e3f8]/78">
                      Mobile sharing uses the system share sheet when available. Card is the
                      hero artifact; the burned-in session video is the proof layer.
                    </p>

                    {saveMessage ? (
                      <p
                        className={`mt-3 text-sm ${
                          saveStatus === 'error' ? 'text-[#ffbca5]' : 'text-[#9bdccf]'
                        }`}
                      >
                        {saveMessage}
                      </p>
                    ) : null}

                    {recordingMessage ? (
                      <p className="mt-3 text-sm text-[#d7e3f8]/78">{recordingMessage}</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'bg-[linear-gradient(135deg,#f17f51,#f0b368)] text-[#08131f] shadow-[0_10px_26px_rgba(241,127,81,0.34)]'
          : 'border border-white/10 bg-white/5 text-[#d7e3f8]/82'
      } disabled:cursor-not-allowed disabled:opacity-35`}
    >
      {children}
    </button>
  )
}

function ActionButton({
  children,
  className = '',
  disabled = false,
  onClick,
  variant,
}: {
  children: string
  className?: string
  disabled?: boolean
  onClick?: () => void
  variant: 'primary' | 'secondary' | 'outline' | 'ghost'
}) {
  const base =
    'rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45'
  const variants = {
    primary:
      'bg-[linear-gradient(135deg,#f17f51,#f2bb64)] text-[#08131f] shadow-[0_14px_30px_rgba(241,127,81,0.28)]',
    secondary:
      'border border-[#34587d] bg-[#0f2136] text-[#f5f0e9]',
    outline:
      'border border-[#f08a62] bg-transparent text-[#ffd5b6]',
    ghost:
      'border border-white/10 bg-white/5 text-[#d7e3f8]/82',
  } as const

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

function MicrositeStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'signal' | 'accent' | 'ink'
}) {
  const accentTone = {
    signal: 'text-[#9bdccf]',
    accent: 'text-[#ffd5b6]',
    ink: 'text-[#eff4ff]',
  } as const

  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] px-3 py-4 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9fb6d7]/70">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl uppercase ${accentTone[accent]}`}>{value}</p>
    </div>
  )
}

function ShareInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-[#1f3955] bg-[#071523] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9cc8ff]">
        {label}
      </p>
      <p className="mt-2 text-sm text-[#f7f3ea]">{value}</p>
    </div>
  )
}
