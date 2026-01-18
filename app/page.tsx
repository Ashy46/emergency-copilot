'use client'

import { useState, useRef, useEffect } from 'react'
import { useSignalDetection } from '@/hooks/useSignalDetection'
import { useDescriptionVision } from '@/hooks/useDescriptionVision'
import { useSnapshotWebSocket } from '@/hooks/useSnapshotWebSocket'
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react'
import { LocalVideoTrack, Track } from 'livekit-client'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Generate video ID once
  const videoId = useRef(uuidv4())

  // LiveKit state
  const [isStreaming, setIsStreaming] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [roomName] = useState('video_v1') // Match dispatcher format
  // const [callerId] = useState(`caller_${Date.now()}`) // Dynamic caller ID
  const [callerId] = useState('caller_c1') // Hardcoded for testing
  const hasTransitioned = useRef(false) // Prevent multiple transitions

  // Mock location for now - in production, get from GPS
  const [location] = useState({ lat: 41.796483, lng: -87.606919 })

  // WebSocket for streaming snapshots to API
  const {
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    sendSnapshot,
    isConnected: wsConnected,
    isInitialized: wsInitialized,
    incidentId
  } = useSnapshotWebSocket({
    videoId: videoId.current,
    lat: location.lat,
    lng: location.lng,
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
        // DON'T stop signal detection - let it keep running!
        // Just start the description vision in parallel
        console.log('1. Starting description vision (keeping signal detection running)...')
        startVision(videoFile)

        await new Promise(resolve => setTimeout(resolve, 500))

        console.log('2. Connecting to LiveKit...')
        await connectAndStream()

        console.log('3. Connecting WebSocket...')
        connectWebSocket()

        console.log('✅ Transition complete! Both Overshoot instances running in parallel.')
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
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          identity: callerId,
          role: 'caller',
        }),
      })

      const data = await response.json()
      setUrl(data.url)
      setToken(data.token)
      setIsStreaming(true)

      console.log('✓ Connected to LiveKit room:', roomName)
    } catch (err) {
      console.error('Failed to connect to LiveKit:', err)
      alert('Failed to start streaming')
    }
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file)
        const url = URL.createObjectURL(file)
        setVideoUrl(url)
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
    setVideoFile(null)
    stopDetection()
    resetSignal()
    clearVision()
    disconnectWebSocket()
    setIsStreaming(false)
    setToken(null)
    setUrl(null)
    hasTransitioned.current = false

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-8 p-8 min-h-screen bg-[#242424] text-white">
      <h1 className="text-5xl mb-4 bg-gradient-to-r from-[#646cff] to-[#61dafb] bg-clip-text text-transparent font-semibold">
        Signal Detection Test
      </h1>

      {/* Signal Status Indicator */}
      <div className={`px-6 py-3 rounded-full text-lg font-semibold ${isStreaming
        ? 'bg-blue-500 animate-pulse'
        : shouldStream
          ? 'bg-red-500 animate-pulse'
          : isDetecting
            ? 'bg-yellow-500'
            : 'bg-gray-600'
        }`}>
        {isStreaming
          ? '🔴 LIVE STREAMING TO DISPATCH'
          : shouldStream
            ? '🚨 ANOMALY DETECTED - START STREAMING'
            : isDetecting
              ? '👁️ Monitoring...'
              : '⏸️ Not Active'}
      </div>

      {/* Streaming Info */}
      {isStreaming && (
        <div className="bg-blue-500/20 border border-blue-500 p-4 rounded-lg text-left w-full max-w-[500px]">
          <h3 className="text-lg font-bold mb-2 text-blue-400">🔴 Live Stream Active</h3>
          <p><strong>Room:</strong> {roomName}</p>
          <p><strong>Caller ID:</strong> {callerId}</p>
          <p><strong>Video ID:</strong> <span className="font-mono text-xs">{videoId.current}</span></p>
          {incidentId && <p><strong>Incident ID:</strong> <span className="font-mono text-xs">{incidentId}</span></p>}

          <div className="mt-3 space-y-2">
            <div className={`p-3 rounded ${wsConnected && wsInitialized ? 'bg-green-500/20 border border-green-500' : 'bg-yellow-500/20 border border-yellow-500'}`}>
              <p className="text-sm">
                <strong>API Connection:</strong> {wsConnected && wsInitialized ? '✅ Connected & Streaming' : wsConnected ? '⏳ Connecting...' : '❌ Disconnected'}
              </p>
            </div>

            <div className="p-3 bg-green-500/20 border border-green-500 rounded">
              <p className="text-sm">
                <strong>Description Vision:</strong> {vision ? '✅ Active & Analyzing' : '⏳ Initializing...'}
              </p>
              {vision && (
                <p className="text-xs text-green-300 mt-1">
                  Real-time scene analysis running
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last Signal Details */}
      {lastSignal && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg text-left w-full max-w-[500px]">
          <h3 className="text-lg font-bold mb-2 text-red-400">Last Detection</h3>
          <p><strong>Type:</strong> {lastSignal.anomalyType}</p>
          <p><strong>Confidence:</strong> {((lastSignal.confidence ?? 0) * 100).toFixed(1)}%</p>
          <p><strong>Time:</strong> {new Date(lastSignal.detectedAt ?? 0).toLocaleTimeString()}</p>
          <button
            onClick={resetSignal}
            className="mt-3 px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
          >
            Clear Alert
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-[#646cff] rounded-xl bg-[#646cff]/5 min-w-[400px]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleVideoUpload}
          accept="video/*"
          className="hidden"
        />

        <button
          onClick={handleButtonClick}
          className="px-8 py-4 text-xl font-semibold text-white bg-gradient-to-br from-[#646cff] to-[#747bff] rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(100,108,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(100,108,255,0.4)] active:translate-y-0"
        >
          📹 Upload Video to Test
        </button>

        {videoFile && (
          <div className="text-left bg-white/5 p-4 rounded-lg w-full">
            <p className="my-2 text-[0.95rem]">
              <strong>File:</strong> {videoFile.name}
            </p>
            <p className="my-2 text-[0.95rem]">
              <strong>Size:</strong> {(videoFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="my-2 text-[0.95rem]">
              <strong>Type:</strong> {videoFile.type}
            </p>
          </div>
        )}
      </div>

      {videoUrl && (
        <div className="flex flex-col items-center gap-4 w-full max-w-[900px]">
          <h2 className="mb-2">{isStreaming ? 'Live Stream' : 'Video Preview'}</h2>

          {isStreaming && token && url ? (
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
              className="w-full max-w-[800px] rounded-lg"
            />
          )}

          <button
            onClick={handleClearVideo}
            className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-[#ff4444] to-[#ff6666] rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(255,68,68,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,68,68,0.4)] active:translate-y-0"
          >
            Stop & Clear
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-sm text-gray-500 mt-4">
        <p>Sensitivity: 0.5 | Cooldown: 3s | Signal Threshold: 3</p>
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
        video.loop = true
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
        // @ts-ignore - captureStream exists but not in all TS types
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
    <div className="w-full space-y-4">
      <div className="bg-green-700 p-3 rounded-lg">
        <div className="text-white font-semibold text-center">
          {localTrack ? '🔴 STREAMING LIVE' : '⏳ Connecting...'}
        </div>
      </div>

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        autoPlay
        loop
        muted
        playsInline
        className="w-full max-w-[800px] rounded-lg mx-auto"
      />
    </div>
  )
}
