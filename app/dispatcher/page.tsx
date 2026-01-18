"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { getIncidents, getVideos } from "@/lib/api";
import { useSSE, type SSEConnectionState } from "@/hooks/useSSE";
import { VideoCard } from "@/components/dispatcher/VideoCard";
import { IncidentCard } from "@/components/dispatcher/IncidentCard";
import { VideoDetailsPanel } from "@/components/dispatcher/VideoDetailsPanel";
import { IncidentDetailsPanel } from "@/components/dispatcher/IncidentDetailsPanel";
import { incidentToMarker, videoToMarker, type MapMarker } from "@/lib/mapHelpers";
import type { Incident, Video, TimelineEvent } from "@/types/api";

const DispatcherMapView = dynamic(
  () => import("@/components/DispatcherMapView"),
  { ssr: false }
);

type TabType = "incidents" | "videos";

export default function DispatcherPage() {
  // Data state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("incidents");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  // Timeline events pushed via SSE (per video)
  const [liveTimelineEvents, setLiveTimelineEvents] = useState<Record<string, TimelineEvent[]>>({});
  // Updated video states via SSE (currentState per video)
  const [updatedVideoStates, setUpdatedVideoStates] = useState<Record<string, string>>({});

  // SSE event handlers
  const sseHandlers = useMemo(
    () => ({
      onConnected: (data: { clientId: string }) => {
        console.log("SSE connected with clientId:", data.clientId);
      },
      onNewVideo: (data: { videoId: string; incidentId: string; lat: number; lng: number; status: "live" | "ended" | "recorded" }) => {
        console.log("New video:", data);
        // Add the new video to our list
        const newVideo: Video = {
          id: data.videoId,
          incidentId: data.incidentId,
          status: data.status,
          currentState: null,
          videoUrl: null,
          lat: data.lat,
          lng: data.lng,
          startedAt: new Date().toISOString(),
          endedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setVideos((prev) => {
          // Check if video already exists
          if (prev.find((v) => v.id === data.videoId)) {
            return prev;
          }
          return [newVideo, ...prev];
        });

        // Check if we need to add a new incident
        setIncidents((prev) => {
          if (!prev.find((i) => i.id === data.incidentId)) {
            // Fetch the new incident
            getIncidents({ status: "active" }).then((incidents) => {
              setIncidents(incidents);
            });
          }
          return prev;
        });
      },
      onTimelineEvent: (data: { videoId: string; event: TimelineEvent }) => {
        console.log("Timeline event for video:", data.videoId, data.event);
        setLiveTimelineEvents((prev) => ({
          ...prev,
          [data.videoId]: [...(prev[data.videoId] || []), data.event],
        }));
      },
      onStateUpdated: (data: { videoId: string; incidentId: string; state: string }) => {
        console.log("State updated for video:", data.videoId, data.state);
        setUpdatedVideoStates((prev) => ({
          ...prev,
          [data.videoId]: data.state,
        }));
        // Also update the video in our list
        setVideos((prev) =>
          prev.map((v) =>
            v.id === data.videoId ? { ...v, currentState: data.state, updatedAt: new Date().toISOString() } : v
          )
        );
      },
      onVideoStatusChanged: (data: { videoId: string; status: "live" | "ended" | "recorded"; videoUrl?: string }) => {
        console.log("Video status changed:", data.videoId, data.status);
        setVideos((prev) =>
          prev.map((v) =>
            v.id === data.videoId
              ? { ...v, status: data.status, videoUrl: data.videoUrl || v.videoUrl, updatedAt: new Date().toISOString() }
              : v
          )
        );
      },
      onSnapshotReceived: (data: { videoId: string }) => {
        // Optional: could show activity indicator
        console.log("Snapshot received for video:", data.videoId);
      },
    }),
    []
  );

  // Generate stable clientId once
  const clientIdRef = useRef(`dispatcher-${Date.now()}`);

  // Connect to SSE
  const { connectionState } = useSSE({
    clientId: clientIdRef.current,
    autoConnect: true,
    handlers: sseHandlers,
  });

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [incidentsData, videosData] = await Promise.all([
          getIncidents({ status: "active" }),
          getVideos(),
        ]);
        setIncidents(incidentsData);
        setVideos(videosData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Count videos per incident
  const videoCountByIncident = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const video of videos) {
      counts[video.incidentId] = (counts[video.incidentId] || 0) + 1;
    }
    return counts;
  }, [videos]);

  // Get selected items
  const selectedIncident = selectedIncidentId ? incidents.find((i) => i.id === selectedIncidentId) : null;
  const selectedVideo = selectedVideoId ? videos.find((v) => v.id === selectedVideoId) : null;

  // Build map markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];

    // Add incident markers
    for (const incident of incidents) {
      markers.push(incidentToMarker(incident, videoCountByIncident[incident.id]));
    }

    // Add video markers
    for (const video of videos) {
      markers.push(videoToMarker(video));
    }

    return markers;
  }, [incidents, videos, videoCountByIncident]);

  // Handlers
  const handleSelectIncident = useCallback((id: string) => {
    setSelectedIncidentId(id);
    setSelectedVideoId(null);
    setDetailsExpanded(true);
  }, []);

  const handleSelectVideo = useCallback((video: Video) => {
    setSelectedVideoId(video.id);
    setSelectedIncidentId(null);
    setDetailsExpanded(true);
  }, []);

  const handleMapMarkerSelect = useCallback((id: string, type: "incident" | "video") => {
    if (type === "incident") {
      handleSelectIncident(id);
      setActiveTab("incidents");
    } else {
      const video = videos.find((v) => v.id === id);
      if (video) {
        handleSelectVideo(video);
        setActiveTab("videos");
      }
    }
  }, [videos, handleSelectIncident, handleSelectVideo]);

  const handleCloseDetails = useCallback(() => {
    setDetailsExpanded(false);
  }, []);

  const recenterMap = useCallback(() => {
    setRecenterTrigger((prev) => prev + 1);
  }, []);

  // Connection status indicator
  const ConnectionIndicator = ({ state }: { state: SSEConnectionState }) => {
    const config = {
      connecting: { color: "bg-status-warning animate-pulse", text: "Connecting..." },
      connected: { color: "bg-status-resolved", text: "Connected" },
      disconnected: { color: "bg-status-ended", text: "Disconnected" },
      error: { color: "bg-status-live", text: "Error" },
    };
    const c = config[state];
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${c.color}`} />
        <span className="text-xs text-text-muted">{c.text}</span>
      </div>
    );
  };

  // Determine selected marker info for map
  const selectedMarkerId = selectedVideoId || selectedIncidentId;
  const selectedMarkerType = selectedVideoId ? "video" : selectedIncidentId ? "incident" : null;

  return (
    <main className="h-screen w-screen bg-bg-primary bg-grid flex flex-col">
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Toggle Button (when sidebar is closed) */}
        {!headerExpanded && (
          <button
            type="button"
            onClick={() => setHeaderExpanded(true)}
            className="absolute top-4 left-4 z-[2000] bg-surface-elevated border border-border-default text-text-primary p-3 rounded-lg shadow-2xl hover:bg-surface-card-hover hover:border-border-strong transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-semibold text-sm">Dispatch</span>
          </button>
        )}

        {/* Left Column: Incident/Video List (Floating Panel) */}
        {headerExpanded && (
          <div className="absolute top-4 left-4 bottom-4 w-80 bg-surface-card border border-border-subtle shadow-2xl flex flex-col z-[1500] rounded-xl overflow-hidden transition-all duration-200">
            {/* Header */}
            <div className="bg-bg-tertiary border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setHeaderExpanded(false)}
                className="w-full p-4 flex items-center justify-between hover:bg-surface-card-hover transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-status-active" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h1 className="text-lg font-bold text-text-primary">Dispatch Center</h1>
                </div>
                <svg className="w-5 h-5 text-text-tertiary rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-status-live animate-pulse" />
                  <p className="text-sm text-text-secondary">
                    {incidents.length} incident{incidents.length !== 1 ? "s" : ""} •{" "}
                    {videos.filter((v) => v.status === "live").length} live
                  </p>
                </div>
                <ConnectionIndicator state={connectionState} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-subtle">
              <button
                onClick={() => setActiveTab("incidents")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "incidents"
                    ? "text-status-active border-b-2 border-status-active bg-bg-tertiary"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Incidents ({incidents.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("videos")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "videos"
                    ? "text-status-active border-b-2 border-status-active bg-bg-tertiary"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Videos ({videos.length})
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-2 bg-bg-tertiary border-b border-border-subtle">
              <button
                onClick={recenterMap}
                disabled={mapMarkers.length === 0}
                className="w-full bg-surface-elevated border border-border-default text-text-secondary px-4 py-2 rounded-lg hover:bg-surface-card-hover hover:border-border-strong hover:text-text-primary disabled:bg-bg-tertiary disabled:border-border-subtle disabled:text-text-muted disabled:cursor-not-allowed font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Recenter Map
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-bg-secondary">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-border-default border-t-status-active rounded-full mx-auto" />
                  <p className="text-text-tertiary mt-3">Loading...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-status-live mb-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-status-live font-medium">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-status-active hover:text-text-primary text-sm font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : activeTab === "incidents" ? (
                incidents.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-16 w-16 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-text-secondary font-medium">No active incidents</p>
                    <p className="text-text-muted text-sm mt-1">Incidents will appear here when reported</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {incidents.map((incident) => (
                      <IncidentCard
                        key={incident.id}
                        incident={incident}
                        videoCount={videoCountByIncident[incident.id] || 0}
                        isSelected={selectedIncidentId === incident.id}
                        onClick={() => handleSelectIncident(incident.id)}
                      />
                    ))}
                  </div>
                )
              ) : videos.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-16 w-16 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-text-secondary font-medium">No videos</p>
                  <p className="text-text-muted text-sm mt-1">Video streams will appear here</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isSelected={selectedVideoId === video.id}
                      onClick={() => handleSelectVideo(video)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 bg-bg-tertiary relative">
          <DispatcherMapView
            markers={mapMarkers}
            selectedMarkerId={selectedMarkerId}
            selectedMarkerType={selectedMarkerType}
            onSelectMarker={handleMapMarkerSelect}
            recenterTrigger={recenterTrigger}
          />
          {/* Map overlay badge */}
          {mapMarkers.length > 0 && (
            <div
              className={`absolute top-4 bg-surface-card/95 backdrop-blur-sm border border-border-subtle rounded-lg shadow-lg px-4 py-2 z-[1000] transition-all duration-300 ${
                headerExpanded ? "left-[336px]" : "left-4"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-status-resolved rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-text-primary">
                  {incidents.length} incident{incidents.length !== 1 ? "s" : ""} •{" "}
                  {videos.length} video{videos.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Details Toggle Button */}
        {(selectedIncident || selectedVideo) && !detailsExpanded && (
          <button
            type="button"
            onClick={() => setDetailsExpanded(true)}
            className="absolute top-4 right-4 z-[2000] bg-surface-elevated border border-border-default text-text-primary p-3 rounded-lg shadow-2xl hover:bg-surface-card-hover hover:border-border-strong transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-sm">Details</span>
          </button>
        )}

        {/* Right Column: Details Panel */}
        {selectedIncident && detailsExpanded && (
          <IncidentDetailsPanel
            incident={selectedIncident}
            onClose={handleCloseDetails}
            onSelectVideo={handleSelectVideo}
            isExpanded={detailsExpanded}
          />
        )}

        {selectedVideo && detailsExpanded && (
          <VideoDetailsPanel
            video={selectedVideo}
            onClose={handleCloseDetails}
            isExpanded={detailsExpanded}
            liveTimelineEvents={liveTimelineEvents[selectedVideo.id] || []}
            updatedState={updatedVideoStates[selectedVideo.id]}
          />
        )}
      </div>
    </main>
  );
}
