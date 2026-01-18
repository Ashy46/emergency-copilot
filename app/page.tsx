'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSignalDetection } from '@/hooks/useSignalDetection'
import { useDescriptionVision } from '@/hooks/useDescriptionVision'
import { useSnapshotWebSocket } from '@/hooks/useSnapshotWebSocket'
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react'
import { LocalVideoTrack, Track } from 'livekit-client'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const videoIdRef = useRef<string | null>(null)
  const filenameRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // LiveKit state
  const [isStreaming, setIsStreaming] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const hasTransitioned = useRef(false) // Prevent multiple transitions
  const [transitionStatus, setTransitionStatus] = useState<string>('idle') // For debug display

  // Store WebSocket connection promise so onTransition can await it
  // Now just resolves when connection is ready (doesn't create incident yet)
  const wsConnectionPromise = useRef<Promise<void> | null>(null)

  // Location based on video filename - dynamically updated
  const [location, setLocation] = useState({ lat: 41.796483, lng: -87.606919 })

  // Coordinate mapping: Match specific filenames to locations
  const getLocationFromFilename = (filename: string): { lat: number; lng: number } => {
    const lowerFilename = filename.toLowerCase()

    // pov1.mov and pov2.mov - same location (close together)
    if (lowerFilename.includes('pov1')) {
      console.log('📍 POV1 location: Market Street, SF')
      return { lat: 37.7749, lng: -122.4194 }
    }
    if (lowerFilename.includes('pov2')) {
      console.log('📍 POV2 location: Near Market Street, SF (slightly offset)')
      return { lat: 37.7751, lng: -122.4190 } // Very close to pov1
    }

    // Other specific videos - different locations
    if (lowerFilename.includes('pov3')) {
      console.log('📍 POV3 location: SoMa, SF')
      return { lat: 37.7849, lng: -122.4094 }
    }
    if (lowerFilename.includes('pov4')) {
      console.log('📍 POV4 location: Mission District, SF')
      return { lat: 37.7649, lng: -122.4294 }
    }
    if (lowerFilename.includes('pov5')) {
      console.log('📍 POV5 location: Financial District, SF')
      return { lat: 37.7549, lng: -122.3994 }
    }

    // Default fallback
    console.log('📍 No specific match, using default location')
    return { lat: 41.796483, lng: -87.606919 }
  }

  // WebSocket for streaming snapshots to API
  const {
    connect: connectWebSocket,
    initialize: initializeWebSocket,
    disconnect: disconnectWebSocket,
    sendSnapshot,
    sendVideoEnded,
    isConnected: wsConnected,
    isInitialized: wsInitialized,
    incidentId
  } = useSnapshotWebSocket({
    onInitialized: (data) => {
      console.log('🎯 Video assigned to incident:', data.incidentId)
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    }
  })

  const {
    shouldStream,
    lastSignal,
    isDetecting,
    startDetection,
    stopDetection,
    resetSignal
  } = useSignalDetection({
    sensitivityThreshold: 0.5,
    signalThreshold: 3,
    onTransition: async (videoFile) => {
      // This fires IMMEDIATELY when 3rd signal detected!
      console.log('🔥 TRANSITION CALLBACK FIRED with video:', videoFile.name)
      setTransitionStatus('fired')

      if (hasTransitioned.current) {
        console.log('⚠️ Already transitioned, skipping')
        setTransitionStatus('skipped-already')
        return
      }

      hasTransitioned.current = true
      setTransitionStatus('starting')

      try {
        // 1. Wait for WebSocket connection to be ready (preempted on video upload)
        console.log('1. Waiting for WebSocket connection...')
        setTransitionStatus('waiting-ws')
        if (!wsConnectionPromise.current) {
          throw new Error('WebSocket connection not started - upload a video first')
        }
        await wsConnectionPromise.current
        console.log('✅ WebSocket connected')

        // 2. NOW create the incident/video (only after anomaly detected)
        console.log('2. Creating incident/video entry...')
        setTransitionStatus('creating-incident')
        const activeVideoId = videoIdRef.current ?? videoId ?? uuidv4()
        console.log('🆔 Using video ID for incident:', activeVideoId, '(ref:', videoIdRef.current, 'state:', videoId, ')')
        if (!videoIdRef.current) {
          videoIdRef.current = activeVideoId
          setVideoId(activeVideoId)
        }
        const activeFilename = filenameRef.current ?? filename ?? undefined
        const wsResult = await initializeWebSocket(activeVideoId, location.lat, location.lng, activeFilename)
        console.log('✅ Incident created:', wsResult.incidentId, 'videoId:', activeVideoId, 'filename:', activeFilename)

        // 3. Start description vision - snapshots will be sent via WebSocket
        console.log('3. Starting description vision...')
        setTransitionStatus('starting-vision')
        startVision(videoFile)

        // 4. Connect to LiveKit for video streaming
        console.log('4. Connecting to LiveKit...')
        setTransitionStatus('connecting-livekit')
        await connectAndStream()

        setTransitionStatus('complete')
        console.log('✅ Transition complete! Overshoot → WebSocket → API pipeline active.')
      } catch (error) {
        console.error('❌ Transition failed:', error)
        setTransitionStatus(`error: ${error}`)
        hasTransitioned.current = false
      }
    }
  })

  const { vision, startVision, clearVision } = useDescriptionVision({
    onSnapshot: (scenario, data) => {
      // Send snapshot to API via WebSocket
      console.log('📸 Snapshot ready to send:', { scenario, data })
      sendSnapshot(scenario, data)
    }
  })

  const connectWebSocketWithRetry = useCallback(async () => {
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 WS connect attempt ${attempt}/${maxAttempts}`)
        await connectWebSocket()
        console.log('✅ WS connected (preempted)')
        return
      } catch (err) {
        console.error(`❌ WS connect attempt ${attempt} failed:`, err)
        if (attempt === maxAttempts) {
          throw err
        }
        const delayMs = 500 * attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }, [connectWebSocket])

  // Log description vision status
  useEffect(() => {
    if (vision) {
      console.log('Description vision active:', vision)
    } else {
      console.log('Description vision inactive')
    }
  }, [vision])

  // Notify backend when video ends and stop all processing
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnded = () => {
      console.log('🎬 Video ended, stopping all processing...')

      // 1. Stop description vision (Overshoot) - this stops timeline events
      clearVision()
      console.log('✅ Description vision stopped')

      // 2. Stop signal detection
      stopDetection()
      console.log('✅ Signal detection stopped')

      // 3. Notify backend that video ended
      sendVideoEnded()
      console.log('✅ Backend notified')

      // 4. Stop streaming
      setIsStreaming(false)
      console.log('✅ Streaming stopped')
    }

    video.addEventListener('ended', handleVideoEnded)
    return () => {
      video.removeEventListener('ended', handleVideoEnded)
    }
  }, [sendVideoEnded, clearVision, stopDetection])

  const connectAndStream = async () => {
    try {
      const activeVideoId = videoIdRef.current ?? videoId ?? uuidv4()
      console.log('🎥 connectAndStream called with:', {
        videoIdRef: videoIdRef.current,
        videoIdState: videoId,
        activeVideoId,
      })

      if (!videoIdRef.current) {
        videoIdRef.current = activeVideoId
        setVideoId(activeVideoId)
      }

      // Use videoId as both room name and identity
      console.log('🎥 Fetching LiveKit token for room:', activeVideoId)
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: activeVideoId,
          identity: activeVideoId,
          role: 'caller',
        }),
      })

      const data = await response.json()
      console.log('🎥 LiveKit token received:', { url: data.url, hasToken: !!data.token })

      setUrl(data.url)
      setToken(data.token)
      setIsStreaming(true)

      console.log('✅ LiveKit streaming started for room:', activeVideoId)
    } catch (err) {
      console.error('❌ Failed to connect to LiveKit:', err)
      alert('Failed to start streaming')
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        // Clean up any existing connection first (allows multiple uploads without clicking Reset)
        console.log('🧹 Cleaning up previous session before new upload...')
        stopDetection()
        resetSignal()
        clearVision()
        disconnectWebSocket()
        setIsStreaming(false)
        setToken(null)
        setUrl(null)
        hasTransitioned.current = false
        wsConnectionPromise.current = null
        setTransitionStatus('idle')

        // Revoke old video URL if exists
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl)
        }

        // Wait for cleanup to fully complete before starting new session
        await new Promise(resolve => setTimeout(resolve, 500))

        // Parse filename and set location coordinates
        const coords = getLocationFromFilename(file.name)
        setLocation(coords)
        console.log(`🎬 Video uploaded: "${file.name}" → Location set to (${coords.lat}, ${coords.lng})`)

        // Store filename for backend to use for replay URL
        setFilename(file.name)
        filenameRef.current = file.name

        const newVideoId = uuidv4()
        console.log('🆔 New video ID generated:', newVideoId)
        setVideoId(newVideoId)
        videoIdRef.current = newVideoId
        const url = URL.createObjectURL(file)
        setVideoUrl(url)

        // Preempt WebSocket connection (just establish connection, don't create incident yet)
        console.log('📡 Preempting WebSocket connection (parallel with signal detection)...')
        wsConnectionPromise.current = connectWebSocketWithRetry()

        // Start signal detection
        startDetection(file)

        // Reset file input so the same file can be re-uploaded
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert('Please upload a valid video file')
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearVideo = () => {
    stopDetection()
    resetSignal()
    clearVision()
    disconnectWebSocket()
    setIsStreaming(false)
    setToken(null)
    setUrl(null)
    setVideoId(null)
    setFilename(null)
    videoIdRef.current = null
    filenameRef.current = null
    hasTransitioned.current = false
    wsConnectionPromise.current = null
    setTransitionStatus('idle')

    // Reset location to default
    setLocation({ lat: 41.796483, lng: -87.606919 })

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const statusItems: { label: string; state: 'ok' | 'warn' | 'down' | 'idle' }[] = [
    {
      label: 'Overshoot SDK',
      state: isDetecting ? 'ok' : 'idle',
    },
    {
      label: 'WebSocket',
      state: wsConnected && wsInitialized ? 'ok' : wsConnected ? 'warn' : 'down',
    },
    {
      label: 'LiveKit Stream',
      state: isStreaming && token ? 'ok' : shouldStream ? 'warn' : 'idle',
    },
    {
      label: 'Has Token',
      state: token ? 'ok' : 'down',
    },
  ]

  const toneMap: Record<
    'ok' | 'warn' | 'down' | 'idle',
    string
  > = {
    ok: 'bg-[#16a34a]',
    warn: 'bg-[#f7b84a]',
    down: 'bg-[#f87171]',
    idle: 'bg-[#6b7280]',
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-5">

        <div className="panel p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Anomaly detection</p>
              <h2 className="text-xl font-medium tracking-tight">Last event</h2>

            </div>
            <button
              onClick={resetSignal}
              className="rounded-md border border-[#2a2f36] bg-[#1a1e24] px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-[#5b8cff]/40 hover:text-white"
            >
              Clear
            </button>
          </div>
          {lastSignal ? (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-[#2a2f36] bg-white/5 px-3 py-2">
                <p className="text-muted">Type</p>
                <p className="text-white">{lastSignal.anomalyType}</p>
              </div>
              <div className="rounded-lg border border-[#2a2f36] bg-white/5 px-3 py-2">
                <p className="text-muted">Confidence</p>
                <p className="text-white">
                  {((lastSignal.confidence ?? 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg border border-[#2a2f36] bg-white/5 px-3 py-2">
                <p className="text-muted">Time</p>
                <p className="text-white">
                  {new Date(lastSignal.detectedAt ?? 0).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">
              Awaiting detections. Upload a video to arm the scanner.
            </p>
          )}
        </div>

        <div className="panel p-3 space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            className="hidden"
          />

          <div className="rounded-lg border border-[#2a2f36] bg-black/60 overflow-hidden">
            {videoUrl ? (
              <>
                {/* Single video element - never gets destroyed */}
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className="w-full"
                />
                {/* LiveKit room mounts separately for streaming - doesn't affect video */}
                {isStreaming && token && url && (
                  <LiveKitRoom
                    serverUrl={url}
                    token={token}
                    connect={true}
                    video={false}
                    audio={false}
                    onConnected={() => console.log('Connected to LiveKit room')}
                    onDisconnected={() => console.log('Disconnected from LiveKit room')}
                    className="hidden"
                  >
                    <StreamingPublisher videoRef={videoRef} />
                  </LiveKitRoom>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleButtonClick}
                className="group flex aspect-video min-h-[420px] w-full flex-col items-center justify-center gap-2 text-sm text-muted transition-colors hover:bg-white/5"
              >
                <span className="text-lg text-white">↑</span>
                <span className="text-white">Upload video</span>
                <span className="text-xs text-muted">MP4 / MOV / WebM</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted/80 leading-tight">
            <span className="py-1">
              Video ID: <span className="mono text-white">{videoId ?? 'N/A'}</span>
            </span>
            <span>
              Incident ID:{' '}
              <span className="mono text-white">
                {incidentId ?? 'N/A'}
              </span>
            </span>
            <span>
              Location:{' '}
              <span className="mono text-white">
                ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
              </span>
            </span>
            {videoUrl && (
              <button
                onClick={handleClearVideo}
                className="ml-auto rounded-md border border-[#2a2f36] bg-[#1a1e24] px-3 py-1 text-[11px] text-muted transition-colors hover:border-[#f87171]/40 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <div className="text-[11px] text-muted/70 leading-tight">
          Sensitivity 0.5 · Cooldown 3s · Threshold 3 hits · LiveKit publishes after anomaly transition.
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-white">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${toneMap[item.state]}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Debug Panel */}
        <div className="mt-4 p-3 rounded-lg border border-[#2a2f36] bg-[#1a1e24] text-[10px] font-mono space-y-1">
          <div className="text-muted mb-2 uppercase tracking-wide">Debug Info</div>
          <div>isStreaming: <span className={isStreaming ? 'text-green-400' : 'text-red-400'}>{String(isStreaming)}</span></div>
          <div>hasToken: <span className={token ? 'text-green-400' : 'text-red-400'}>{String(!!token)}</span></div>
          <div>hasUrl: <span className={url ? 'text-green-400' : 'text-red-400'}>{String(!!url)}</span></div>
          <div>wsConnected: <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>{String(wsConnected)}</span></div>
          <div>wsInitialized: <span className={wsInitialized ? 'text-green-400' : 'text-red-400'}>{String(wsInitialized)}</span></div>
          <div>shouldStream: <span className={shouldStream ? 'text-green-400' : 'text-gray-400'}>{String(shouldStream)}</span></div>
          <div>transitionStatus: <span className="text-yellow-400">{transitionStatus}</span></div>
        </div>
      </div>
    </div>
  )
}

// This component only handles publishing to LiveKit - no video rendering
function StreamingPublisher({
  videoRef
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
}) {
  const { localParticipant } = useLocalParticipant()

  useEffect(() => {
    let currentTrack: LocalVideoTrack | null = null
    let isActive = true
    let pauseHandler: (() => void) | null = null

    console.log('🎬 StreamingPublisher useEffect triggered', {
      hasVideo: !!videoRef.current,
      hasLocalParticipant: !!localParticipant,
      participantIdentity: localParticipant?.identity,
    })

    const publishVideoStream = async () => {
      const video = videoRef.current
      if (!video || !localParticipant || !isActive) {
        console.error('❌ Video element or participant not ready', {
          hasVideo: !!video,
          hasLocalParticipant: !!localParticipant,
          isActive,
        })
        return
      }

      try {
        // Wait for video to be ready
        if (video.readyState < 2) {
          console.log('Waiting for video metadata...')
          await new Promise<void>((resolve) => {
            video.addEventListener('loadedmetadata', () => resolve(), { once: true })
          })
        }

        if (!isActive) return

        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight)

        // Wait for video to be actually playing
        await new Promise<void>((resolve) => {
          const checkPlaying = () => {
            if (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2) {
              resolve()
            } else {
              setTimeout(checkPlaying, 50)
            }
          }
          checkPlaying()
        })

        console.log('Video is actively playing, capturing stream...')

        if (!isActive) return

        // Capture stream directly from video element
        // @ts-expect-error - captureStream exists but not in all TS types
        const videoStream = video.captureStream(30) as MediaStream
        const videoTrack = videoStream.getVideoTracks()[0]

        if (!videoTrack) {
          console.error('Could not get video track from video element')
          return
        }

        console.log('Video track obtained:', videoTrack.getSettings())

        // Ensure video keeps playing during streaming (but NOT after it ends)
        pauseHandler = () => {
          if (video.ended) {
            console.log('Video ended, not restarting')
            return
          }
          if (video.paused && isActive && currentTrack) {
            console.log('Video paused mid-stream, restarting...')
            video.play().catch(console.error)
          }
        }

        video.addEventListener('pause', pauseHandler)

        // Create LiveKit track from the video stream
        const track = new LocalVideoTrack(videoTrack)
        currentTrack = track

        console.log('Publishing track to room...')
        await localParticipant.publishTrack(track, {
          name: 'emergency-video-stream',
          source: Track.Source.Camera,
          simulcast: false
        })

        console.log('✓ Published emergency video stream to room')
      } catch (error) {
        console.error('Failed to publish video stream:', error)
      }
    }

    publishVideoStream()

    // Cleanup
    return () => {
      console.log('Cleaning up video stream publisher')
      isActive = false

      const video = videoRef.current
      if (video && pauseHandler) {
        video.removeEventListener('pause', pauseHandler)
      }

      if (currentTrack && localParticipant) {
        localParticipant.unpublishTrack(currentTrack).catch(console.error)
        currentTrack.stop()
      }
    }
  }, [localParticipant, videoRef])

  // This component doesn't render anything visible - it just publishes the stream
  return null
}
