'use client'

import { useState, useRef, useEffect } from 'react'
import { useSignalDetection } from '@/hooks/useSignalDetection'

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const {
    shouldStream,
    lastSignal,
    isDetecting,
    startDetection,
    stopDetection,
    resetSignal
  } = useSignalDetection({
    sensitivityThreshold: 0.5,
    cooldownMs: 3000
  })

  // Log signal changes
  useEffect(() => {
    if (shouldStream && lastSignal) {
      console.log('SIGNAL TRIGGERED:', lastSignal)
    }
  }, [shouldStream, lastSignal])

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
      <div className={`px-6 py-3 rounded-full text-lg font-semibold ${
        shouldStream
          ? 'bg-red-500 animate-pulse'
          : isDetecting
            ? 'bg-yellow-500'
            : 'bg-gray-600'
      }`}>
        {shouldStream
          ? '🚨 ANOMALY DETECTED - START STREAMING'
          : isDetecting
            ? '👁️ Monitoring...'
            : '⏸️ Not Active'}
      </div>

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
          <h2 className="mb-2">Video Preview</h2>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            muted
            className="w-full max-w-[800px] rounded-lg"
          />
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
        <p>Sensitivity: 0.5 | Cooldown: 3s | Clip: 1s</p>
      </div>
    </div>
  )
}
