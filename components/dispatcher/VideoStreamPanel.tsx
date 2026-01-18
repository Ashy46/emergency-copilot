import { useState } from "react";

interface VideoStreamPanelProps {
  roomName: string;   // LiveKit room name (caller.videoId / streamId)
  callerId: string;   // Participant identity to subscribe to
}

export function VideoStreamPanel({ roomName, callerId }: VideoStreamPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // TODO: Add LiveKit integration
  // 1. Fetch token: POST /api/livekit/token { roomName, identity: "dispatcher_1", role: "dispatcher" }
  // 2. Connect to room with livekit-client
  // 3. Find remote participant with identity === callerId
  // 4. Render their video track

  // Shared video content (used in both small and expanded view)
  const VideoContent = ({ large = false }: { large?: boolean }) => (
    <div className={`relative ${large ? 'aspect-video' : 'aspect-video'} bg-black rounded-lg overflow-hidden`}>
      {/* TODO: Replace with LiveKit VideoTrack component */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
        <svg className={`${large ? 'w-24 h-24' : 'w-16 h-16'} mb-3 opacity-30`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className={`${large ? 'text-lg' : 'text-sm'} text-gray-400`}>Waiting for video stream...</span>
        <span className={`${large ? 'text-sm' : 'text-xs'} text-gray-600 mt-1 font-mono`}>Room: {roomName}</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-semibold text-white">Live Video Feed</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400 font-semibold">LIVE</span>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Large Video Area */}
            <div className="p-4">
              <VideoContent large />
            </div>

            {/* Playback Controls Bar */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-4">
                {/* Play/Pause (placeholder for future) */}
                <button className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors" title="Play/Pause">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                {/* Progress bar placeholder */}
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-red-500 rounded-full" />
                </div>

                {/* Time display */}
                <span className="text-sm text-gray-400 font-mono min-w-[80px]">
                  00:00 / LIVE
                </span>

                {/* Volume */}
                <button className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors" title="Mute/Unmute">
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>

                {/* Minimize button */}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Minimize"
                >
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                </button>
              </div>

              {/* Caller info */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                <span className="text-sm text-gray-400">
                  Caller: <span className="font-mono text-gray-300">{callerId}</span>
                </span>
                <span className="text-sm text-gray-400">
                  Room: <span className="font-mono text-gray-300">{roomName}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Normal Small View */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Live Video Feed
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">LIVE</span>
          </div>
        </div>
        
        {/* Video Player Area */}
        <div className="mb-3 cursor-pointer" onClick={() => setIsExpanded(true)}>
          <VideoContent />
        </div>

        {/* Video Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Mute/Unmute"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Expand"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono">Caller: {callerId}</span>
          </div>
        </div>
      </div>
    </>
  );
}
