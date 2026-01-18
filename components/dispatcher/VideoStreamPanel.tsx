"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { TimelineEvent } from "@/types/api";

interface VideoStreamPanelProps {
  roomName: string;   // LiveKit room name (caller.videoId / streamId)
  callerId: string;   // Participant identity to subscribe to
  timelineEvents?: TimelineEvent[];  // Timeline events to display on scrubber
  videoStartTime?: string;  // ISO timestamp when video started
  videoUrl?: string | null;  // URL for recorded video playback
  status?: 'live' | 'ended' | 'recorded';  // Video status
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

// Inner component that renders the video track
function VideoRenderer({ callerId, large = false }: { callerId: string; large?: boolean }) {
  const participants = useRemoteParticipants();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  // Find the track from the caller we're interested in
  const callerTrack = tracks.find(
    (track) => track.participant.identity === callerId && track.publication.track
  );

  if (!callerTrack?.publication.track) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
        <svg className={`${large ? 'w-24 h-24' : 'w-16 h-16'} mb-3 opacity-30`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span className={`${large ? 'text-lg' : 'text-sm'} text-gray-400`}>
          {participants.length > 0 ? `Waiting for ${callerId} to share video...` : "No participants in room"}
        </span>
        <span className={`${large ? 'text-sm' : 'text-xs'} text-gray-600 mt-1`}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''} connected
        </span>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={callerTrack}
      className="w-full h-full object-contain"
    />
  );
}

// Timeline scrubber with event markers
function TimelineScrubber({
  events,
  videoStartTime,
  onEventClick,
  selectedEventId,
  isRecorded = false,
}: {
  events: TimelineEvent[];
  videoStartTime: string;
  onEventClick?: (event: TimelineEvent) => void;
  selectedEventId?: string;
  isRecorded?: boolean;
}) {
  const startTime = new Date(videoStartTime).getTime();
  const now = Date.now();
  const totalDuration = now - startTime;

  // Calculate position for each event (0-100%)
  const eventPositions = useMemo(() => {
    return events.map((event) => {
      const eventTime = new Date(event.timestamp).getTime();
      const position = ((eventTime - startTime) / totalDuration) * 100;
      return { event, position: Math.min(Math.max(position, 0), 100) };
    });
  }, [events, startTime, totalDuration]);

  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Show tooltip for hovered event, or selected event if nothing is hovered
  const displayedEvent = useMemo(() => {
    if (hoveredEventId) {
      return events.find((e) => e.id === hoveredEventId) || null;
    }
    if (selectedEventId) {
      return events.find((e) => e.id === selectedEventId) || null;
    }
    return null;
  }, [events, hoveredEventId, selectedEventId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      {/* Event details panel - always has reserved height */}
      <div className={`rounded-lg p-3 shadow-xl transition-colors min-h-[72px] ${
        displayedEvent
          ? selectedEventId === displayedEvent.id
            ? "bg-yellow-900/30 border border-yellow-600/50"
            : "bg-gray-800 border border-gray-600"
          : "bg-gray-800/50 border border-gray-700"
      }`}>
        {displayedEvent ? (
          <div className="flex items-start gap-2">
            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
              selectedEventId === displayedEvent.id ? "bg-yellow-400" : "bg-red-500"
            }`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-1">
                {formatTime(displayedEvent.timestamp)}
                {displayedEvent.confidence && (
                  <span className="ml-2 text-gray-500">
                    {Math.round(displayedEvent.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="text-sm text-white leading-snug">{displayedEvent.description}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Hover or click a timeline event to see details
          </div>
        )}
      </div>

      {/* Scrubber bar */}
      <div className="relative h-2 bg-gray-700/50 rounded-full overflow-visible my-2">
        {/* Progress fill */}
        <div className={`absolute inset-y-0 left-0 right-0 rounded-full ${
          isRecorded
            ? "bg-gradient-to-r from-gray-600 to-green-600/30"
            : "bg-gradient-to-r from-gray-600 to-red-600/30"
        }`} />

        {/* Event markers */}
        {eventPositions.map(({ event, position }) => (
          <div
            key={event.id}
            className="absolute top-1/2 -translate-y-1/2 z-10"
            style={{ left: `${position}%` }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEventClick?.(event);
              }}
              onMouseEnter={() => setHoveredEventId(event.id)}
              onMouseLeave={() => setHoveredEventId(null)}
              className={`relative w-4 h-4 -ml-2 rounded-full border-2 transition-all duration-200 hover:scale-150 ${
                selectedEventId === event.id
                  ? "bg-yellow-400 border-yellow-300 scale-125 z-20"
                  : "bg-red-500 border-red-400 hover:bg-yellow-400 hover:border-yellow-300"
              }`}
            >
              {/* Pulse animation only for non-selected markers */}
              {selectedEventId !== event.id && (
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Time labels and status indicator */}
      <div className="flex justify-between items-center text-xs text-gray-500 px-1">
        <span>{formatTime(videoStartTime)}</span>
        <span className="text-gray-400">{formatDuration(totalDuration)}</span>
        {isRecorded ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs font-semibold text-green-400">RECORDED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Connection status indicator
function ConnectionStatus({ state }: { state: ConnectionState }) {
  const statusConfig = {
    disconnected: { color: "bg-gray-500", text: "Disconnected" },
    connecting: { color: "bg-yellow-500 animate-pulse", text: "Connecting..." },
    connected: { color: "bg-green-500", text: "Connected" },
    error: { color: "bg-red-500", text: "Error" },
  };

  const config = statusConfig[state];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-gray-400">{config.text}</span>
    </div>
  );
}

// Recorded Video Modal - expanded view with timeline scrubber
function RecordedVideoModal({
  videoUrl,
  timelineEvents,
  videoStartTime,
  onClose,
}: {
  videoUrl: string;
  timelineEvents?: TimelineEvent[];
  videoStartTime?: string;
  onClose: () => void;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEventId(event.id);

    // Seek video to the event timestamp
    if (videoRef.current && videoStartTime) {
      const startTime = new Date(videoStartTime).getTime();
      const eventTime = new Date(event.timestamp).getTime();
      const seekTime = (eventTime - startTime) / 1000; // Convert to seconds

      if (seekTime >= 0 && seekTime <= videoRef.current.duration) {
        videoRef.current.currentTime = seekTime;
        videoRef.current.play().catch(console.error);
      }
    }

    console.log("Event clicked, seeking to:", event);
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[85vw] max-w-5xl h-auto max-h-[calc(100vh-48px)] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-lg font-semibold text-white">Video Recording</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-400">Recorded</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Area */}
        <div className="p-4 flex-1 min-h-0">
          <div className="relative w-full h-full max-h-[60vh] bg-black rounded-lg overflow-hidden mx-auto aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            >
              <track kind="captions" />
            </video>
          </div>
        </div>

        {/* Timeline Scrubber & Controls - fixed at bottom */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 flex-shrink-0">
          {/* Timeline Events Scrubber */}
          {timelineEvents && timelineEvents.length > 0 && videoStartTime ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Timeline Events ({timelineEvents.length})
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  Click an event to jump to that moment
                </span>
              </div>
              <TimelineScrubber
                events={timelineEvents}
                videoStartTime={videoStartTime}
                onEventClick={handleEventClick}
                selectedEventId={selectedEventId}
                isRecorded={true}
              />
            </div>
          ) : (
            <div className="text-center py-2 text-gray-500 text-sm">
              No timeline events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Room wrapper component - renders inside LiveKitRoom
function RoomContent({
  callerId,
  isExpanded,
  onToggleExpanded,
  connectionState,
  fetchToken,
  roomName,
  timelineEvents,
  videoStartTime,
}: {
  callerId: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  connectionState: ConnectionState;
  fetchToken: () => void;
  roomName: string;
  timelineEvents?: TimelineEvent[];
  videoStartTime?: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEventId(event.id);
    // For recorded videos, this could seek to the event timestamp
    console.log("Event clicked:", event);
  };
  return (
    <>
      {/* Expanded Modal Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={onToggleExpanded}
        >
          <div
            className="relative w-[85vw] max-w-5xl h-auto max-h-[calc(100vh-48px)] bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-lg font-semibold text-white">Live Video Feed</span>
                <ConnectionStatus state={connectionState} />
              </div>
              <button
                onClick={onToggleExpanded}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Video Area */}
            <div className="p-4 flex-1 min-h-0">
              <div className="relative w-full h-full max-h-[60vh] bg-black rounded-lg overflow-hidden mx-auto aspect-video">
                <VideoRenderer callerId={callerId} large={true} />
              </div>
            </div>

            {/* Timeline Scrubber & Controls - fixed at bottom */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/50 space-y-4 flex-shrink-0">
              {/* Timeline Events Scrubber */}
              {timelineEvents && timelineEvents.length > 0 && videoStartTime ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Timeline Events ({timelineEvents.length})
                    </span>
                  </div>
                  <TimelineScrubber
                    events={timelineEvents}
                    videoStartTime={videoStartTime}
                    onEventClick={handleEventClick}
                    selectedEventId={selectedEventId}
                  />
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500 text-sm">
                  No timeline events yet
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Normal Small View - Always rendered (but video element is reused) */}
      {!isExpanded && (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <VideoRenderer callerId={callerId} large={false} />
        </div>
      )}
    </>
  );
}

export function VideoStreamPanel({ roomName, callerId, timelineEvents, videoStartTime, videoUrl, status = 'live' }: VideoStreamPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [liveKitUrl, setLiveKitUrl] = useState<string | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For ended videos without videoUrl, try hardcoded fallback paths
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Try to find a working video URL when status is ended but no videoUrl
  useEffect(() => {
    if ((status === 'ended' || status === 'recorded') && !videoUrl) {
      // Try common video filenames as fallback
      const tryUrls = ['/videos/pov1.mov', '/videos/pov2.mov', '/videos/pov1.mp4', '/videos/pov2.mp4'];

      const tryNextUrl = async (urls: string[]) => {
        for (const url of urls) {
          try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              console.log('Found fallback video:', url);
              setFallbackUrl(url);
              return;
            }
          } catch {
            // Continue to next URL
          }
        }
        console.log('No fallback video found');
      };

      tryNextUrl(tryUrls);
    }
  }, [status, videoUrl]);

  // Use videoUrl if available, otherwise use fallback
  const effectiveVideoUrl = videoUrl || fallbackUrl;

  // Check if this is a recorded video (allow both "recorded" and "ended" status)
  const isRecorded = (status === 'recorded' || status === 'ended') && effectiveVideoUrl;

  // Debug logging
  console.log('VideoStreamPanel:', { status, videoUrl, fallbackUrl, effectiveVideoUrl, isRecorded });

  // Fetch LiveKit token
  const fetchToken = useCallback(async () => {
    if (!roomName) return;

    setConnectionState("connecting");
    setError(null);

    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          identity: "dispatcher_1",
          role: "dispatcher",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const data = await response.json();
      setLiveKitUrl(data.url);
      setLiveKitToken(data.token);
    } catch (err) {
      console.error("Failed to fetch LiveKit token:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setConnectionState("error");
    }
  }, [roomName]);

  // Fetch token when roomName changes
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  // Handle room connection events
  const handleConnected = () => setConnectionState("connected");
  const handleDisconnected = () => setConnectionState("disconnected");
  const handleError = (err: Error) => {
    console.error("LiveKit error:", err);
    setError(err.message);
    setConnectionState("error");
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg className={`w-4 h-4 ${isRecorded ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <div className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          {isRecorded ? 'Video Feed (Recorded)' : 'Live Video Feed'}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {isRecorded ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-400">Recording</span>
            </>
          ) : (
            <ConnectionStatus state={connectionState} />
          )}
        </div>
      </div>

      {/* Recorded Video Player - same style as live feed with expanded popup */}
      {isRecorded ? (
        <>
          {/* Expanded Modal for Recorded Video */}
          {isExpanded && (
            <RecordedVideoModal
              videoUrl={effectiveVideoUrl!}
              timelineEvents={timelineEvents}
              videoStartTime={videoStartTime}
              onClose={() => setIsExpanded(false)}
            />
          )}

          {/* Small view */}
          <div
            className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <video
              src={effectiveVideoUrl!}
              controls
              preload="metadata"
              className="w-full h-full object-contain"
            >
              <track kind="captions" />
            </video>
            {/* Click to expand overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-3">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Single LiveKitRoom - Always mounted */}
          {liveKitUrl && liveKitToken ? (
            <LiveKitRoom
              serverUrl={liveKitUrl}
              token={liveKitToken}
              connect={true}
              onConnected={handleConnected}
              onDisconnected={handleDisconnected}
              onError={handleError}
            >
              <div onClick={() => !isExpanded && setIsExpanded(true)} className={!isExpanded ? "cursor-pointer" : ""}>
                <RoomContent
                  callerId={callerId}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => setIsExpanded(!isExpanded)}
                  connectionState={connectionState}
                  fetchToken={fetchToken}
                  roomName={roomName}
                  timelineEvents={timelineEvents}
                  videoStartTime={videoStartTime}
                />
              </div>
            </LiveKitRoom>
          ) : (
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-400">
                  {connectionState === "connecting" ? "Connecting to room..." :
                   connectionState === "error" ? error : "Waiting for video stream..."}
                </span>
                <span className="text-xs text-gray-600 mt-1 font-mono">Room: {roomName}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Video Controls (only shown when not expanded) */}
      {!isExpanded && (
        <div className="flex items-center justify-between mt-3">
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
            {connectionState === "error" && (
              <button
                onClick={fetchToken}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-500 transition-colors"
                title="Retry connection"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-mono">Caller: {callerId}</span>
          </div>
        </div>
      )}
    </div>
  );
}
