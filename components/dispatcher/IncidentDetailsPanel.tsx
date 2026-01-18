"use client";

import { useState, useEffect } from "react";
import type { Incident, Video, IncidentWithDetails } from "@/types/api";
import { getIncident, getVideos } from "@/lib/api";

interface IncidentDetailsPanelProps {
  incident: Incident;
  onClose: () => void;
  onSelectVideo: (video: Video) => void;
  isExpanded: boolean;
  timelineHeight?: number;
}

const statusConfig = {
  active: { label: "Active", color: "text-red-600", dot: "bg-red-500 animate-pulse", bg: "bg-red-100" },
  resolved: { label: "Resolved", color: "text-green-600", dot: "bg-green-500", bg: "bg-green-100" },
  archived: { label: "Archived", color: "text-gray-600", dot: "bg-gray-500", bg: "bg-gray-100" },
};

const videoStatusConfig = {
  live: { label: "Live", dot: "bg-red-500 animate-pulse" },
  ended: { label: "Ended", dot: "bg-gray-500" },
  recorded: { label: "Recorded", dot: "bg-green-500" },
};

export function IncidentDetailsPanel({
  incident,
  onClose,
  onSelectVideo,
  isExpanded,
  timelineHeight = 0,
}: IncidentDetailsPanelProps) {
  const [incidentDetails, setIncidentDetails] = useState<IncidentWithDetails | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch incident details and videos
  useEffect(() => {
    async function fetchDetails() {
      setIsLoading(true);
      try {
        const [details, incidentVideos] = await Promise.all([
          getIncident(incident.id),
          getVideos({ incidentId: incident.id }),
        ]);
        setIncidentDetails(details);
        setVideos(incidentVideos);
      } catch (err) {
        console.error("Failed to fetch incident details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [incident.id]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (!incident) return null;

  const config = statusConfig[incident.status];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-800">Incident Details</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
              <span className={config.color}>{config.label}</span>
              <span>•</span>
              <span>{formatTimestamp(incident.startedAt)}</span>
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Loading incident details...</p>
            </div>
          ) : (
            <>
              {/* Incident ID */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Incident ID</div>
                </div>
                <div className="text-sm font-mono font-bold text-gray-800 break-all">{incident.id}</div>
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
                    <span className="font-semibold">{incident.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lng:</span>
                    <span className="font-semibold">{incident.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              {incidentDetails && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Statistics</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{videos.length}</div>
                      <div className="text-xs text-gray-500">Videos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{incidentDetails.snapshotCount}</div>
                      <div className="text-xs text-gray-500">Snapshots</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{incidentDetails.timelineEventCount}</div>
                      <div className="text-xs text-gray-500">Events</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Timestamps</div>
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Started:</span>
                    <span>{formatDate(incident.startedAt)} {formatTimestamp(incident.startedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span>{formatDate(incident.updatedAt)} {formatTimestamp(incident.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Associated Videos */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Videos ({videos.length})
                  </div>
                </div>

                {videos.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No videos for this incident</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {videos.map((video) => {
                      const videoConfig = videoStatusConfig[video.status];
                      return (
                        <button
                          key={video.id}
                          onClick={() => onSelectVideo(video)}
                          className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-gray-800 truncate max-w-[180px]">
                              {video.id.slice(0, 12)}...
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${videoConfig.dot}`} />
                              <span className="text-xs text-gray-600">{videoConfig.label}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatTimestamp(video.startedAt)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
