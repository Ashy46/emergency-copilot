"use client";

import { useState, useEffect } from "react";
import type { Video, TimelineEvent } from "@/types/api";
import { getVideoTimeline } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/mockData";
import { VideoStreamPanel } from "./VideoStreamPanel";

interface VideoDetailsPanelProps {
  video: Video;
  onClose: () => void;
  isExpanded: boolean;
  timelineHeight?: number;
  // SSE-pushed timeline events for real-time updates
  liveTimelineEvents?: TimelineEvent[];
  // Live updates from SSE for currentState
  updatedState?: string;
}

const statusConfig = {
  live: { label: "Live", color: "text-red-600", dot: "bg-red-500 animate-pulse" },
  ended: { label: "Ended", color: "text-gray-600", dot: "bg-gray-500" },
  recorded: { label: "Recorded", color: "text-green-600", dot: "bg-green-500" },
};

export function VideoDetailsPanel({
  video,
  onClose,
  isExpanded,
  timelineHeight = 0,
  liveTimelineEvents = [],
  updatedState,
}: VideoDetailsPanelProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Fetch timeline on mount (skip if using mock data - timeline comes via liveTimelineEvents)
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Mock data timeline is passed via liveTimelineEvents prop
      setIsLoadingTimeline(false);
      return;
    }
    async function fetchTimeline() {
      setIsLoadingTimeline(true);
      try {
        const events = await getVideoTimeline(video.id);
        setTimeline(events);
      } catch (err) {
        console.error("Failed to fetch timeline:", err);
      } finally {
        setIsLoadingTimeline(false);
      }
    }
    fetchTimeline();
  }, [video.id]);

  // Merge live events with fetched timeline
  const allTimelineEvents = [...timeline];
  for (const liveEvent of liveTimelineEvents) {
    if (!allTimelineEvents.find((e) => e.id === liveEvent.id)) {
      allTimelineEvents.push(liveEvent);
    }
  }
  // Sort by timestamp
  allTimelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!video) return null;

  const config = statusConfig[video.status];
  const displayState = updatedState || video.currentState;

  return (
    <div
      className="absolute top-4 right-4 w-96 bg-white shadow-2xl flex flex-col overflow-hidden z-[1500] rounded-xl transition-all duration-200"
      style={{ bottom: `${16 + timelineHeight}px` }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onClose}
        className="p-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-800">Video Details</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className={config.color}>{config.label}</span>
              <span>•</span>
              <span>{formatTimestamp(video.startedAt)}</span>
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Live Video Stream */}
          <VideoStreamPanel
            roomName={video.id}
            callerId={video.id}
            timelineEvents={allTimelineEvents}
            videoStartTime={video.startedAt}
          />

          {/* Current State / AI Summary */}
          {displayState && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">AI Summary</div>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{displayState}</p>
            </div>
          )}

          {/* Video ID */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Video ID</div>
            </div>
            <div className="text-sm font-mono font-bold text-gray-800 break-all">{video.id}</div>
          </div>

          {/* Incident ID */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Incident ID</div>
            </div>
            <div className="text-sm font-mono font-bold text-gray-800 break-all">{video.incidentId}</div>
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Location</div>
            </div>
            <div className="font-mono text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Lat:</span>
                <span className="font-semibold">{video.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lng:</span>
                <span className="font-semibold">{video.lng.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Timestamps</div>
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Started:</span>
                <span>{formatDate(video.startedAt)} {formatTimestamp(video.startedAt)}</span>
              </div>
              {video.endedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ended:</span>
                  <span>{formatDate(video.endedAt)} {formatTimestamp(video.endedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recording URL */}
          {video.videoUrl && (
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Recording</div>
              </div>
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-700 hover:text-teal-800 underline break-all"
              >
                View Recording
              </a>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Timeline ({allTimelineEvents.length} events)
              </div>
            </div>

            {isLoadingTimeline ? (
              <div className="text-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Loading timeline...</p>
              </div>
            ) : allTimelineEvents.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No timeline events yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {allTimelineEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-4 border-l-2 border-slate-300">
                    <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-400" />
                    <div className="text-xs text-gray-500 mb-1">
                      {formatTimestamp(event.timestamp)}
                      {event.confidence && (
                        <span className="ml-2 text-slate-400">
                          ({Math.round(event.confidence * 100)}% confidence)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800">{event.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
