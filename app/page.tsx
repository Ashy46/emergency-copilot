'use client'

import { useState, useRef, useEffect } from 'react'
import AlertMessage from '@/components/AlertMessage'
import { useOvershootVision } from '@/hooks/useOvershootVision'

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { message, startVision, clearVision } = useOvershootVision()

  // Auto-play video when message is received
  useEffect(() => {
    if (message && videoRef.current && videoRef.current.paused) {
      videoRef.current.play()
    }
  }, [message])

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if it's a video file
      if (file.type.startsWith('video/')) {
        setVideoFile(file)
        // Create a URL for the video preview
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

  const handleClearVideo = () => {
    setVideoFile(null)
    clearVision()
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
        Emergency Copilot - Video Upload
      </h1>

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
          📹 Upload Video
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
          <div className="relative w-full max-w-[800px] inline-block">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-w-[800px] rounded-lg"
            />
            <AlertMessage message={message ?? 'No message provided'} />
          </div>
          <button 
            onClick={handleClearVideo} 
            className="px-6 py-3 text-base font-semibold text-white bg-gradient-to-br from-[#ff4444] to-[#ff6666] rounded-lg cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(255,68,68,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,68,68,0.4)] active:translate-y-0"
          >
            Clear Video
          </button>
        </div>
      )}
    </div>
  )
}
