"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { usePlayback } from "@/hooks/usePlayback";
import { useCallerFilters } from "@/hooks/useCallerFilters";
import { CallerCard } from "@/components/dispatcher/CallerCard";
import { FilterPanel } from "@/components/dispatcher/FilterPanel";
import { CallerDetailsPanel } from "@/components/dispatcher/CallerDetailsPanel";
import { TimelinePlayback } from "@/components/dispatcher/TimelinePlayback";

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

export default function DispatcherPage() {
  // Event history for playback
  const [eventHistory, setEventHistory] = useState<Event[]>([]);

  // UI state
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Custom hooks
  const playback = usePlayback(eventHistory);
  const filters = useCallerFilters();

  const handleUpdate = (event: Event) => {
    // Validate coords: lat/lng must be finite numbers
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) {
      console.error("Invalid coordinates:", { lat: event.lat, lng: event.lng });
      return;
    }

    // Add to event history
    setEventHistory((prev) => [...prev, event]);
  };

  const simulateUpdate = () => {
    const scenarios: Array<EventScenario> = [
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
      id: `caller_c${eventHistory.length + 1}`,
      incidentId: `incident_i${Math.floor(Math.random() * 3) + 1}`,
      videoId: `video_v${Object.keys(playback.callersById).length + 1}`,
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

  // Apply filters
  const allCallers = Object.values(playback.callersById);
  const filteredCallers = allCallers.filter((caller) => {
    // Filter by incident ID
    if (filters.selectedIncidents.size > 0 && !filters.selectedIncidents.has(caller.incidentId)) {
      return false;
    }
    // Filter by scenario
    if (filters.selectedScenarios.size > 0 && !filters.selectedScenarios.has(caller.scenario)) {
      return false;
    }
    return true;
  });

  const callers = filteredCallers;
  const selectedCaller = selectedCallerId ? playback.callersById[selectedCallerId] : null;

  const callerLocations = callers.map((caller) => ({
    callerId: caller.id,
    coords: { lat: caller.lat, lng: caller.lng },
    scenario: caller.scenario,
    timestamp: caller.timestamp,
  }));

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
          <div className="absolute top-4 left-4 bottom-4 w-80 bg-white shadow-2xl flex flex-col z-[1500] rounded-xl overflow-hidden">
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
                  <h1 className="text-xl font-bold">Dispatch Center</h1>
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
                  <div className={`w-2 h-2 rounded-full ${playback.isLiveMode ? 'bg-red-400 animate-pulse' : 'bg-gray-300'}`} />
                  <p className="text-sm text-blue-100">
                    {callers.length} active caller{callers.length !== 1 ? "s" : ""}
                    {!playback.isLiveMode && " (Playback)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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

            {/* Filter Panel */}
            <FilterPanel
              allCallers={allCallers}
              selectedIncidents={filters.selectedIncidents}
              selectedScenarios={filters.selectedScenarios}
              onToggleIncident={filters.toggleIncidentFilter}
              onToggleScenario={filters.toggleScenarioFilter}
              onClear={filters.clearFilters}
              isExpanded={filtersExpanded}
              onToggleExpand={() => setFiltersExpanded(!filtersExpanded)}
            />

            {/* Caller List */}
            <div className="flex-1 overflow-y-auto">
              {callers.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {filters.hasActiveFilters ? (
                    <>
                      <p className="text-gray-500 font-medium">No matching callers</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                      <button
                        onClick={filters.clearFilters}
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
                  {callers.map((caller) => (
                    <CallerCard
                      key={caller.id}
                      caller={caller}
                      isSelected={selectedCallerId === caller.id}
                      onClick={() => setSelectedCallerId(caller.id)}
                    />
                  ))}
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
          <CallerDetailsPanel
            caller={selectedCaller}
            onClose={() => setDetailsExpanded(!detailsExpanded)}
            isExpanded={detailsExpanded}
          />
        )}

        {/* Timeline Playback Controls - Floating */}
        <TimelinePlayback
          eventHistory={eventHistory}
          isLiveMode={playback.isLiveMode}
          isPlaying={playback.isPlaying}
          playbackSpeed={playback.playbackSpeed}
          currentTime={playback.currentTime}
          minTime={playback.minTime}
          maxTime={playback.maxTime}
          onTogglePlayback={playback.togglePlayback}
          onGoToLive={playback.goToLive}
          onSpeedChange={playback.setPlaybackSpeed}
          onTimeChange={playback.handleTimelineChange}
          isExpanded={timelineExpanded}
          onToggleExpand={() => setTimelineExpanded(!timelineExpanded)}
        />
      </div>
    </main>
  );
}
