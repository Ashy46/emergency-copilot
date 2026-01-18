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
  const videoIdRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // LiveKit state
  const [isStreaming, setIsStreaming] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const hasTransitioned = useRef(false) // Prevent multiple transitions

  // Store WebSocket connection promise so onTransition can await it
  // Now just resolves when connection is ready (doesn't create incident yet)
  const wsConnectionPromise = useRef<Promise<void> | null>(null)

  // Mock location for now - in production, get from GPS
  const [location] = useState({ lat: 41.796483, lng: -87.606919 })

  // WebSocket for streaming snapshots to API
  const {
    connect: connectWebSocket,
    initialize: initializeWebSocket,
    disconnect: disconnectWebSocket,
    sendSnapshot,
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

      if (hasTransitioned.current) {
        console.log('⚠️ Already transitioned, skipping')
        return
      }

      hasTransitioned.current = true

      try {
        // 1. Wait for WebSocket connection to be ready (preempted on video upload)
        console.log('1. Waiting for WebSocket connection...')
        if (!wsConnectionPromise.current) {
          throw new Error('WebSocket connection not started - upload a video first')
        }
        await wsConnectionPromise.current
        console.log('✅ WebSocket connected')

        // 2. NOW create the incident/video (only after anomaly detected)
        console.log('2. Creating incident/video entry...')
        const activeVideoId = videoIdRef.current ?? videoId ?? uuidv4()
        if (!videoIdRef.current) {
          videoIdRef.current = activeVideoId
          setVideoId(activeVideoId)
        }
        const wsResult = await initializeWebSocket(activeVideoId, location.lat, location.lng)
        console.log('✅ Incident created:', wsResult.incidentId)

        // 3. Start description vision - snapshots will be sent via WebSocket
        console.log('3. Starting description vision...')
        startVision(videoFile)

        // 4. Connect to LiveKit for video streaming
        console.log('4. Connecting to LiveKit...')
        await connectAndStream()

        console.log('✅ Transition complete! Overshoot → WebSocket → API pipeline active.')
      } catch (error) {
        console.error('❌ Transition failed:', error)
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

  const connectAndStream = async () => {
    try {
      const activeVideoId = videoIdRef.current ?? videoId ?? uuidv4()
      if (!videoIdRef.current) {
        videoIdRef.current = activeVideoId
        setVideoId(activeVideoId)
      }
      // Use videoId as both room name and identity
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
      setUrl(data.url)
      setToken(data.token)
      setIsStreaming(true)

      console.log('✓ Connected to LiveKit room:', activeVideoId)
    } catch (err) {
      console.error('Failed to connect to LiveKit:', err)
      alert('Failed to start streaming')
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        // Add 300ms delay for smooth UX
        await new Promise(resolve => setTimeout(resolve, 300))

        const newVideoId = uuidv4()
        setVideoId(newVideoId)
        videoIdRef.current = newVideoId
        const url = URL.createObjectURL(file)
        setVideoUrl(url)

        // Preempt WebSocket connection (just establish connection, don't create incident yet)
        console.log('📡 Preempting WebSocket connection (parallel with signal detection)...')
        wsConnectionPromise.current = connectWebSocketWithRetry()

        // Start signal detection
        startDetection(file)
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
    videoIdRef.current = null
    hasTransitioned.current = false
    wsConnectionPromise.current = null

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const statusItems = [
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
      state: isStreaming ? 'ok' : shouldStream ? 'warn' : 'idle',
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
              isStreaming && token && url ? (
                <LiveKitRoom
                  serverUrl={url}
                  token={token}
                  connect={true}
                  video={false}
                  audio={false}
                  onConnected={() => console.log('Connected to LiveKit room')}
                  onDisconnected={() => console.log('Disconnected from LiveKit room')}
                  className="w-full"
                >
                  <StreamingContent videoUrl={videoUrl} videoRef={videoRef} />
                </LiveKitRoom>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  muted
                  className="w-full"
                />
              )
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
      </div>
    </div>
  )
}

function StreamingContent({
  videoUrl,
  videoRef
}: {
  videoUrl: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}) {
  const { localParticipant } = useLocalParticipant()
  const [localTrack, setLocalTrack] = useState<LocalVideoTrack | null>(null)

  useEffect(() => {
    let currentTrack: LocalVideoTrack | null = null
    let isActive = true

    const publishVideoStream = async () => {
      const video = videoRef.current
      if (!video || !localParticipant || !isActive) {
        console.error('Video element or participant not ready')
        return
      }

      try {
        // Set video properties first
        video.muted = true
        video.playsInline = true

        // Wait for video metadata to load first
        if (video.readyState < 2) {
          console.log('Waiting for video metadata...')
          await new Promise<void>((resolve) => {
            video.addEventListener('loadedmetadata', () => resolve(), { once: true })
          })
        }

        if (!isActive) return

        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight)

        // Start video playback - try multiple times if needed
        let playAttempts = 0
        while (playAttempts < 3) {
          try {
            await video.play()
            console.log('Video playing')
            break
          } catch (playError) {
            playAttempts++
            console.error(`Video autoplay attempt ${playAttempts} failed:`, playError)
            if (playAttempts >= 3) {
              alert('Video autoplay failed. Please click the video to start it.')
              return
            }
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }

        if (!isActive) return

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

        // Ensure video keeps playing
        const ensurePlaying = () => {
          if (video.paused && isActive && currentTrack) {
            console.log('Video paused, restarting...')
            video.play().catch(console.error)
          }
        }

        video.addEventListener('pause', ensurePlaying)

        // Create LiveKit track from the video stream
        const track = new LocalVideoTrack(videoTrack)
        currentTrack = track

        console.log('Publishing track to room...')
        await localParticipant.publishTrack(track, {
          name: 'emergency-video-stream',
          source: Track.Source.Camera,
          simulcast: false
        })

        if (isActive) {
          setLocalTrack(track)
          console.log('✓ Published emergency video stream to room')
        }
      } catch (error) {
        console.error('Failed to publish video stream:', error)
      }
    }

    publishVideoStream()

    // Cleanup
    return () => {
      console.log('Cleaning up video stream')
      isActive = false

      if (currentTrack && localParticipant) {
        localParticipant.unpublishTrack(currentTrack).catch(console.error)
        currentTrack.stop()
      }
    }
  }, [videoUrl, localParticipant, videoRef])

  return (
    <div className="w-full space-y-3">
      <div className="rounded-lg border border-[#2a2f36] bg-[#1a1e24] px-3 py-2 text-sm text-muted">
        {localTrack ? 'Streaming to LiveKit room' : 'Establishing stream...'}
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2a2f36] bg-black/60 -mt-4">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          muted
          playsInline
          className="w-full"
        />
      </div>
    </div>
  )
}
