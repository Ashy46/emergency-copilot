'use client'

import { useState, useRef, useEffect } from 'react'
import { useDescriptionVision } from '@/hooks/useDescriptionVision'
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react'
import { LocalVideoTrack, Track } from 'livekit-client'

export default function TestPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // LiveKit state
  const [roomName, setRoomName] = useState('video_v1')
  const [callerId, setCallerId] = useState('caller_c1')
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const { vision, startVision, clearVision } = useDescriptionVision()

  // Add event listener for video end
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnd = () => {
      console.log('Video playback ended, clearing vision')
      clearVision()
    }

    video.addEventListener('ended', handleVideoEnd)
    return () => video.removeEventListener('ended', handleVideoEnd)
  }, [videoUrl, clearVision])

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file)
        const url = URL.createObjectURL(file)
        setVideoUrl(url)
        startVision(file)
      } else {
        alert('Please upload a valid video file')
      }
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const connectAndStreamVideo = async () => {
    if (!videoFile) {
      alert('Please upload a video first')
      return
    }

    setIsConnecting(true)
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
    } catch (err) {
      console.error('Failed to connect:', err)
      alert('Failed to connect to LiveKit')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setToken(null)
    setUrl(null)
  }

  const handleClearVideo = () => {
    setVideoFile(null)
    clearVision()
    handleDisconnect()
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
      setVideoUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Video Stream Test</h1>

        {/* Video Upload Section */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl text-white mb-4">1. Upload Video</h2>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            className="hidden"
          />

          <button
            onClick={handleButtonClick}
            className="w-full px-8 py-4 text-xl font-semibold text-white bg-gradient-to-br from-[#646cff] to-[#747bff] rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(100,108,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(100,108,255,0.4)] active:translate-y-0"
          >
            📹 Upload Video
          </button>

          {videoFile && (
            <div className="mt-4 text-left bg-white/5 p-4 rounded-lg">
              <p className="my-2 text-[0.95rem] text-gray-300">
                <strong>File:</strong> {videoFile.name}
              </p>
              <p className="my-2 text-[0.95rem] text-gray-300">
                <strong>Size:</strong> {(videoFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        {/* LiveKit Connection Section */}
        {videoFile && !token && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <h2 className="text-xl text-white mb-4">2. Connect to Room</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Room Name (Video ID)</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  placeholder="video_v1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Caller ID (Identity)</label>
                <input
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  placeholder="caller_c1"
                />
              </div>
              <button
                onClick={connectAndStreamVideo}
                disabled={isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isConnecting ? 'Connecting...' : 'Connect & Stream Video'}
              </button>
            </div>
          </div>
        )}

        {/* Connected State */}
        {token && url && videoUrl && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white">Streaming as {callerId}</h2>
              <button
                onClick={handleClearVideo}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Disconnect & Clear
              </button>
            </div>
            <LiveKitRoom
              serverUrl={url}
              token={token}
              connect={true}
              video={false}
              audio={false}
              onConnected={() => console.log('Connected to room')}
              onDisconnected={() => console.log('Disconnected from room')}
              className="w-full"
            >
              <RoomContent callerId={callerId} videoUrl={videoUrl} videoRef={videoRef} />
            </LiveKitRoom>
          </div>
        )}

        {/* Vision Status */}
        {vision && (
          <div className="mt-6 bg-green-500/20 border border-green-500 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 text-green-400">Vision Result</h3>
            <pre className="text-sm whitespace-pre-wrap text-gray-300">{JSON.stringify(vision, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

function RoomContent({
  callerId,
  videoUrl,
  videoRef
}: {
  callerId: string
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

        // Wait for video to be actually playing (not just started)
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
        const videoStream = video.captureStream(30) as MediaStream // Explicit 30 FPS
        const videoTrack = videoStream.getVideoTracks()[0]

        if (!videoTrack) {
          console.error('Could not get video track from video element')
          return
        }

        console.log('Video track obtained:', videoTrack.getSettings())

        // Ensure video keeps playing even if user interacts with controls
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
          name: 'video-file-stream',
          source: Track.Source.Camera, // Use Camera source to ensure it's accepted
          simulcast: false
        })

        if (isActive) {
          setLocalTrack(track)
          console.log('✓ Published video file stream to room')
        }
      } catch (error) {
        console.error('Failed to publish video stream:', error)
        alert(`Failed to publish video stream: ${error}`)
      }
    }

    publishVideoStream()

    // Cleanup
    return () => {
      console.log('Cleaning up video stream')
      isActive = false

      // Unpublish and stop track
      if (currentTrack && localParticipant) {
        localParticipant.unpublishTrack(currentTrack).catch(console.error)
        currentTrack.stop()
      }
    }
  }, [videoUrl, localParticipant, videoRef])

  return (
    <div className="space-y-4">
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="text-green-400 font-semibold mb-2">✓ Connected to room</div>
        <div className="text-gray-300 text-sm space-y-1">
          <div>Identity: <span className="font-mono text-white">{callerId}</span></div>
          <div>Publishing: <span className="font-mono text-white">
            {localTrack ? 'Video Stream ON' : 'Starting...'}
          </span></div>
        </div>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
        <p className="text-blue-200 text-sm">
          <strong>Now:</strong> Go to the dispatcher page and select an event with this caller ID to see the video stream.
        </p>
      </div>
    </div>
  )
}