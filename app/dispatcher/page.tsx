"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const DispatcherMapView = dynamic(
  () => import("@/components/DispatcherMapView"),
  { ssr: false }
);

export type EventScenario = "carAccident" | "fire" | "medical" | "unknown";

export interface Event {
  id: string;              // caller/event ID
  incidentId: string;      // for grouping multiple events to same incident
  videoId: string;         // video feed ID
  timestamp: number;       // Date.now() epoch ms
  lat: number;            // latitude (flat, not nested)
  lng: number;            // longitude (flat, not nested)
  scenario: EventScenario;
  data: any;              // additional event data
  bystanderReport?: string; // optional text report
}

type Incident = {
  incidentId: string;
  callers: string[];
  updatedAt: number;
};

export default function DispatcherPage() {
  // Event history for playback
  const [eventHistory, setEventHistory] = useState<Event[]>([]);

  // Playback state
  const [playbackTime, setPlaybackTime] = useState<number | null>(null); // null = live mode
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 2x, 4x

  // Current state (filtered by playback time)
  const [callersById, setCallersById] = useState<Record<string, Event>>(
    {}
  );
  const [incidentsById, setIncidentsById] = useState<
    Record<string, Incident>
  >({});
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Filters
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(new Set());
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // UI Collapse States
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Rebuild state from history up to a specific time
  const rebuildStateUpToTime = (targetTime: number) => {
    const eventsUpToTime = eventHistory.filter((e) => e.timestamp <= targetTime);

    const newCallersById: Record<string, Event> = {};
    const newIncidentsById: Record<string, Incident> = {};

    eventsUpToTime.forEach((event) => {
      // Update latest-per-caller
      newCallersById[event.id] = event;

      // Group by incident
      const existing = newIncidentsById[event.incidentId];
      const callers = existing?.callers || [];
      const updatedCallers = callers.includes(event.id)
        ? callers
        : [...callers, event.id];

      newIncidentsById[event.incidentId] = {
        incidentId: event.incidentId,
        callers: updatedCallers,
        updatedAt: Math.max(existing?.updatedAt || 0, event.timestamp),
      };
    });

    setCallersById(newCallersById);
    setIncidentsById(newIncidentsById);
  };

  const handleUpdate = (event: Event) => {
    // Validate coords: lat/lng must be finite numbers
    if (
      !Number.isFinite(event.lat) ||
      !Number.isFinite(event.lng)
    ) {
      console.error("Invalid coordinates:", { lat: event.lat, lng: event.lng });
      return;
    }

    // Add to event history
    setEventHistory((prev) => [...prev, event]);

    // If in live mode, update current state
    if (playbackTime === null) {
      // Update latest-per-caller
      setCallersById((prev) => ({
        ...prev,
        [event.id]: event,
      }));

      // Group by incident
      setIncidentsById((prev) => {
        const existing = prev[event.incidentId];
        const callers = existing?.callers || [];

        // Add id to callers[] if not already present
        const updatedCallers = callers.includes(event.id)
          ? callers
          : [...callers, event.id];

        return {
          ...prev,
          [event.incidentId]: {
            incidentId: event.incidentId,
            callers: updatedCallers,
            updatedAt: Math.max(existing?.updatedAt || 0, event.timestamp),
          },
        };
      });
    }
  };

  const simulateUpdate = () => {
    const scenarios: Array<"carAccident" | "fire" | "medical" | "unknown"> = [
      "carAccident",
      "fire",
      "medical",
      "unknown",
    ];
    const randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    // Generate random coords near Chicago
    const baseLat = 41.79012;
    const baseLng = -87.60045;
    const latOffset = (Math.random() - 0.5) * 0.02; // ~1km range
    const lngOffset = (Math.random() - 0.5) * 0.02;

    const samplePayload: Event = {
      id: `caller_c${Object.keys(callersById).length + 1}`,
      incidentId: `incident_i${Math.floor(Math.random() * 3) + 1}`,
      videoId: `video_v${Object.keys(callersById).length + 1}`,
      timestamp: Date.now(),
      lat: baseLat + latOffset,
      lng: baseLng + lngOffset,
      scenario: randomScenario,
      data: { vehicles: 2, hazards: ["traffic_risk"] },
      bystanderReport: "Simulated emergency report.",
    };
    handleUpdate(samplePayload);
  };

  const recenterMap = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  // Filter controls
  const toggleIncidentFilter = (incidentId: string) => {
    setSelectedIncidents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };

  const toggleScenarioFilter = (scenario: string) => {
    setSelectedScenarios((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scenario)) {
        newSet.delete(scenario);
      } else {
        newSet.add(scenario);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSelectedIncidents(new Set());
    setSelectedScenarios(new Set());
  };

  // Playback controls
  const goToLive = () => {
    setPlaybackTime(null);
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    // Rebuild live state
    if (eventHistory.length > 0) {
      rebuildStateUpToTime(Date.now() + 1000000);
    }
  };

  const togglePlayback = () => {
    // If in live mode, start playback from beginning
    if (isLiveMode && eventHistory.length > 0) {
      setPlaybackTime(minTime);
      rebuildStateUpToTime(minTime);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleTimelineChange = (newTime: number) => {
    setPlaybackTime(newTime);
    setIsPlaying(false);
    rebuildStateUpToTime(newTime);
  };

  // Auto-playback effect
  useEffect(() => {
    if (isPlaying && playbackTime !== null && eventHistory.length > 0) {
      const minTime = eventHistory[0].timestamp;
      const maxTime = eventHistory[eventHistory.length - 1].timestamp;

      playbackIntervalRef.current = setInterval(() => {
        setPlaybackTime((current) => {
          if (current === null) return null;

          const increment = 1000 * playbackSpeed; // 1 second per tick * speed
          const nextTime = current + increment;

          if (nextTime >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }

          rebuildStateUpToTime(nextTime);
          return nextTime;
        });
      }, 100); // Update every 100ms

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      };
    }
  }, [isPlaying, playbackSpeed, playbackTime, eventHistory]);

  // SSE placeholder (do NOT implement yet)
  // useEffect(() => {
  //   const es = new EventSource("/api/stream");
  //   es.addEventListener("report_update", (e) => handleUpdate(JSON.parse((e as MessageEvent).data)));
  //   return () => es.close();
  // }, []);

  // Apply filters
  const allCallers = Object.values(callersById);
  const filteredCallers = allCallers.filter((caller) => {
    // Filter by incident ID
    if (selectedIncidents.size > 0 && !selectedIncidents.has(caller.incidentId)) {
      return false;
    }
    // Filter by scenario
    if (selectedScenarios.size > 0 && !selectedScenarios.has(caller.scenario)) {
      return false;
    }
    return true;
  });

  const callers = filteredCallers;
  const selectedCaller = selectedCallerId
    ? callersById[selectedCallerId]
    : null;

  // Get unique incidents and scenarios for filter options
  const uniqueIncidents = Array.from(new Set(allCallers.map((c) => c.incidentId))).sort();
  const hasActiveFilters = selectedIncidents.size > 0 || selectedScenarios.size > 0;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const scenarioLabels = {
    carAccident: "Car Accident",
    fire: "Fire",
    medical: "Medical",
    unknown: "Unknown",
  };

  const callerLocations = callers.map((caller) => ({
    callerId: caller.id,
    coords: { lat: caller.lat, lng: caller.lng },
    scenario: caller.scenario,
    timestamp: caller.timestamp,
  }));

  // Timeline calculations
  const minTime = eventHistory.length > 0 ? eventHistory[0].timestamp : 0;
  const maxTime =
    eventHistory.length > 0
      ? eventHistory[eventHistory.length - 1].timestamp
      : Date.now();
  const currentTime = playbackTime ?? maxTime;

  const formatTimelineTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const isLiveMode = playbackTime === null;

  return (
    <main className="h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Floating Toggle Button (when sidebar is closed) */}
        {!headerExpanded && (
          <button
            type="button"
            onClick={() => setHeaderExpanded(true)}
            className="absolute top-4 left-4 z-[2000] bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-lg shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all hover:scale-110 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-semibold text-sm">Dispatch</span>
          </button>
        )}

        {/* Left Column: Caller List (Floating Panel) */}
        {headerExpanded && (
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col z-[1500]">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <button
                type="button"
                onClick={() => setHeaderExpanded(false)}
                className="w-full p-4 flex items-center justify-between hover:bg-blue-800 transition-all"
              >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h1 className="text-xl font-bold">
                  Dispatch Center
                </h1>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${
                  headerExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`} />
                  <p className="text-sm text-blue-100">
                    {callers.length} active caller{callers.length !== 1 ? "s" : ""}
                    {!isLiveMode && " (Playback)"}
                  </p>
                </div>
              </div>
            </div>
        <div className="p-4 space-y-2 bg-gray-50 border-b border-gray-200">
          <button
            onClick={simulateUpdate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Simulated Event
          </button>
          <button
            onClick={recenterMap}
            disabled={callers.length === 0}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Recenter Map
          </button>
        </div>

        {/* Filters Section */}
        {allCallers.length > 0 && (
          <div className="bg-white border-b border-gray-200">
            {/* Filter Header - Always Visible */}
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <button
                type="button"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="flex items-center gap-2 flex-1"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="font-semibold text-sm text-gray-700">Filters</span>
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {selectedIncidents.size + selectedScenarios.size}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  className="p-1"
                >
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      filtersExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Options - Collapsible */}
            {filtersExpanded && (
              <div className="px-4 pb-4 pt-3 space-y-3 border-t border-gray-100">
                {/* Emergency Type Filters */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Emergency Type
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "carAccident", label: "Car Accident", icon: "🚗", bgClass: "bg-red-100 border-red-400" },
                      { key: "fire", label: "Fire", icon: "🔥", bgClass: "bg-orange-100 border-orange-400" },
                      { key: "medical", label: "Medical", icon: "⚕️", bgClass: "bg-blue-100 border-blue-400" },
                      { key: "unknown", label: "Unknown", icon: "❓", bgClass: "bg-gray-100 border-gray-400" },
                    ].map((scenario) => {
                      const isSelected = selectedScenarios.has(scenario.key);
                      const count = allCallers.filter((c) => c.scenario === scenario.key).length;
                      if (count === 0) return null;

                      return (
                        <button
                          key={scenario.key}
                          onClick={() => toggleScenarioFilter(scenario.key)}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? scenario.bgClass
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{scenario.icon}</span>
                            <span className="text-gray-700">{scenario.label}</span>
                          </div>
                          <span className="text-gray-500 text-xs">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Incident ID Filters */}
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Incident ID
                  </div>
                  <div className="space-y-1.5">
                    {uniqueIncidents.map((incidentId) => {
                      const isSelected = selectedIncidents.has(incidentId);
                      const count = allCallers.filter((c) => c.incidentId === incidentId).length;

                      return (
                        <button
                          key={incidentId}
                          onClick={() => toggleIncidentFilter(incidentId)}
                          className={`w-full px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all duration-200 flex items-center justify-between ${
                            isSelected
                              ? "bg-purple-100 border-purple-400"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className="font-mono text-gray-700">{incidentId}</span>
                          <span className="text-gray-500">({count} caller{count !== 1 ? "s" : ""})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Results Summary */}
                {hasActiveFilters && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 text-center">
                      Showing <span className="font-bold text-blue-600">{callers.length}</span> of{" "}
                      <span className="font-bold">{allCallers.length}</span> caller{allCallers.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {callers.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {hasActiveFilters ? (
                <>
                  <p className="text-gray-500 font-medium">No matching callers</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Clear Filters
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 font-medium">No active callers</p>
                  <p className="text-gray-400 text-sm mt-1">Add a simulated event to get started</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {callers.map((caller) => {
                const scenarioColors = {
                  carAccident: "from-red-50 to-red-100 border-red-300",
                  fire: "from-orange-50 to-orange-100 border-orange-300",
                  medical: "from-blue-50 to-blue-100 border-blue-300",
                  unknown: "from-gray-50 to-gray-100 border-gray-300",
                };
                const scenarioIcons = {
                  carAccident: "🚗",
                  fire: "🔥",
                  medical: "⚕️",
                  unknown: "❓",
                };
                return (
                  <div
                    key={caller.id}
                    onClick={() => setSelectedCallerId(caller.id)}
                    className={`p-4 cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                      selectedCallerId === caller.id
                        ? `bg-gradient-to-br ${scenarioColors[caller.scenario]} shadow-md scale-[1.02]`
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{scenarioIcons[caller.scenario]}</span>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {caller.id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(caller.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <span className="font-semibold">Type:</span>
                        <span>{scenarioLabels[caller.scenario]}</span>
                      </div>
                      <div className="text-gray-500 font-mono text-[10px]">
                        {caller.lat.toFixed(4)}, {caller.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
        )}

      {/* Middle Column: Map */}
      <div className="flex-1 bg-gray-200 relative shadow-inner">
        <DispatcherMapView
          callers={callerLocations}
          selectedCallerId={selectedCallerId}
          onSelectCaller={setSelectedCallerId}
          recenterTrigger={recenterTrigger}
        />
        {/* Map overlay badge */}
        {callers.length > 0 && (
          <div
            className={`absolute top-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 z-[1000] transition-all duration-300 ${
              headerExpanded ? "left-[336px]" : "left-4"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">
                Tracking {callers.length} caller{callers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Details Toggle Button (when closed but caller is selected) */}
      {selectedCaller && !detailsExpanded && (
        <button
          type="button"
          onClick={() => setDetailsExpanded(true)}
          className="absolute top-4 right-4 z-[2000] bg-gradient-to-r from-gray-700 to-gray-800 text-white p-3 rounded-lg shadow-2xl hover:from-gray-800 hover:to-gray-900 transition-all hover:scale-110 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm">Details</span>
        </button>
      )}

      {/* Right Column: Details Panel - Floating */}
      {selectedCaller && detailsExpanded && (
        <div className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col overflow-hidden z-[1500]">
          <>
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
              className="p-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {selectedCaller.scenario === 'carAccident' && '🚗'}
                  {selectedCaller.scenario === 'fire' && '🔥'}
                  {selectedCaller.scenario === 'medical' && '⚕️'}
                  {selectedCaller.scenario === 'unknown' && '❓'}
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-gray-800">
                    Caller Details
                  </h2>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTimestamp(selectedCaller.timestamp)}
                  </div>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  detailsExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Details Content */}
            {detailsExpanded && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
              {/* Caller ID */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Caller ID
                  </div>
                </div>
                <div className="text-sm font-mono font-bold text-gray-800">
                  {selectedCaller.id}
                </div>
              </div>

              {/* Incident ID */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    Incident ID
                  </div>
                </div>
                <div className="text-sm font-mono font-bold text-gray-800">
                  {selectedCaller.incidentId}
                </div>
              </div>

              {/* Scenario */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Emergency Type
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {scenarioLabels[selectedCaller.scenario]}
                </div>
              </div>

              {/* Coordinates */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Location
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lat:</span>
                    <span className="font-semibold">{selectedCaller.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lng:</span>
                    <span className="font-semibold">{selectedCaller.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Bystander Report */}
              {selectedCaller.bystanderReport && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Bystander Report
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 leading-relaxed">
                    {selectedCaller.bystanderReport}
                  </div>
                </div>
              )}

              {/* Additional Data */}
              {selectedCaller.data && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Additional Data
                    </div>
                  </div>
                  <pre className="text-xs text-gray-800 bg-white p-3 rounded border border-slate-300 overflow-x-auto font-mono">
                    {JSON.stringify(selectedCaller.data, null, 2)}
                  </pre>
                </div>
              )}
                </div>
              </div>
            )}
          </>
        </div>
      )}
    </div>

    {/* Timeline Playback Controls */}
    {eventHistory.length > 0 && (
      <div className="bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-300 shadow-2xl">
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold text-gray-800">Timeline Playback</span>
            {isLiveMode ? (
              <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                PLAYBACK
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              timelineExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Timeline Content */}
        {timelineExpanded && (
          <div className="px-6 pb-6 space-y-4">
            {/* Controls Row */}
            <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayback}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {isPlaying ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {isLiveMode ? "Replay from Start" : "Play"}
              </>
            )}
          </button>

          {/* Go to Live Button */}
          <button
            onClick={goToLive}
            disabled={isLiveMode}
            className={`${
              isLiveMode
                ? "bg-red-600 text-white"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            } px-6 py-3 rounded-lg disabled:opacity-100 font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 ${
              !isLiveMode && "hover:shadow-xl transform hover:scale-105"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isLiveMode ? "bg-white animate-pulse" : "bg-white"}`} />
            {isLiveMode ? "LIVE" : "Go Live"}
          </button>

          {/* Speed Control */}
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Speed:</span>
            <div className="flex gap-1">
              {[1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1 rounded-md font-semibold text-sm transition-all duration-200 ${
                    playbackSpeed === speed
                      ? "bg-blue-600 text-white shadow-md scale-110"
                      : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Current Time Display */}
          <div className="ml-auto bg-gray-800 text-white px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isLiveMode ? (
              <span className="text-red-400 font-bold">● LIVE</span>
            ) : (
              formatTimelineTimestamp(currentTime)
            )}
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-inner">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-xs text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                {formatTimelineTimestamp(minTime)}
              </span>
            </div>
            <div className="flex-1 relative">
              <input
                type="range"
                min={minTime}
                max={maxTime}
                value={currentTime}
                onChange={(e) => handleTimelineChange(Number(e.target.value))}
                disabled={isLiveMode}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: isLiveMode
                    ? "linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)"
                    : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                        ((currentTime - minTime) / (maxTime - minTime)) * 100
                      }%, #e5e7eb ${
                        ((currentTime - minTime) / (maxTime - minTime)) * 100
                      }%, #e5e7eb 100%)`,
                }}
              />
              {/* Event Markers on Timeline */}
              <div className="absolute inset-0 pointer-events-none">
                {eventHistory.map((event, index) => {
                  const position =
                    ((event.timestamp - minTime) / (maxTime - minTime)) * 100;
                  const scenarioColors = {
                    carAccident: "#ef4444",
                    fire: "#f97316",
                    medical: "#3b82f6",
                    unknown: "#6b7280",
                  };
                  return (
                    <div
                      key={`${event.id}-${index}`}
                      className="absolute top-1/2 w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform pointer-events-auto border-2 border-white shadow-md"
                      style={{
                        left: `${position}%`,
                        backgroundColor: scenarioColors[event.scenario],
                        transform: "translate(-50%, -50%)",
                      }}
                      title={`${event.id} - ${scenarioLabels[event.scenario]} - ${formatTimelineTimestamp(event.timestamp)}`}
                      onClick={() => handleTimelineChange(event.timestamp)}
                    />
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                {formatTimelineTimestamp(maxTime)}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Timeline Legend */}
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">Car Accident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-gray-600">Fire</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">Medical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-600">Unknown</span>
            </div>
          </div>
        </div>
          </div>
        )}
      </div>
    )}
  </main>
  );
}
