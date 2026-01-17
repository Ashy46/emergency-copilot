"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const DispatcherMapView = dynamic(
  () => import("@/components/DispatcherMapView"),
  { ssr: false }
);

type ReportUpdate = {
  callerId: string;
  incidentId: string;
  timestamp: number; // Date.now() epoch ms
  coords: { lat: number; lng: number };
  scenario: "carAccident" | "fire" | "medical" | "unknown";
  data?: Record<string, any>;
  bystanderReport?: string;
};

type Incident = {
  incidentId: string;
  callers: string[];
  updatedAt: number;
};

export default function DispatcherPage() {
  const [callersById, setCallersById] = useState<Record<string, ReportUpdate>>(
    {}
  );
  const [incidentsById, setIncidentsById] = useState<
    Record<string, Incident>
  >({});
  const [selectedCallerId, setSelectedCallerId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const handleUpdate = (report: ReportUpdate) => {
    // Validate coords: lat/lng must be finite numbers
    if (
      !Number.isFinite(report.coords.lat) ||
      !Number.isFinite(report.coords.lng)
    ) {
      console.error("Invalid coordinates:", report.coords);
      return;
    }

    // Update latest-per-caller
    setCallersById((prev) => ({
      ...prev,
      [report.callerId]: report,
    }));

    // Group by incident
    setIncidentsById((prev) => {
      const existing = prev[report.incidentId];
      const callers = existing?.callers || [];

      // Add callerId to callers[] if not already present
      const updatedCallers = callers.includes(report.callerId)
        ? callers
        : [...callers, report.callerId];

      return {
        ...prev,
        [report.incidentId]: {
          incidentId: report.incidentId,
          callers: updatedCallers,
          updatedAt: Math.max(existing?.updatedAt || 0, report.timestamp),
        },
      };
    });
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

    const samplePayload: ReportUpdate = {
      callerId: `caller_c${Object.keys(callersById).length + 1}`,
      incidentId: `incident_i${Math.floor(Math.random() * 3) + 1}`,
      timestamp: Date.now(),
      coords: {
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
      },
      scenario: randomScenario,
      data: { vehicles: 2, hazards: ["traffic_risk"] },
      bystanderReport: "Simulated emergency report.",
    };
    handleUpdate(samplePayload);
  };

  const recenterMap = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  // SSE placeholder (do NOT implement yet)
  // useEffect(() => {
  //   const es = new EventSource("/api/stream");
  //   es.addEventListener("report_update", (e) => handleUpdate(JSON.parse((e as MessageEvent).data)));
  //   return () => es.close();
  // }, []);

  const callers = Object.values(callersById);
  const selectedCaller = selectedCallerId
    ? callersById[selectedCallerId]
    : null;

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
    callerId: caller.callerId,
    coords: caller.coords,
    scenario: caller.scenario,
    timestamp: caller.timestamp,
  }));

  return (
    <main className="h-screen w-screen bg-gray-100 flex">
      {/* Left Column: Caller List */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">
            Dispatcher Console
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {callers.length} active caller{callers.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={simulateUpdate}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Simulate Update
          </button>
          <button
            onClick={recenterMap}
            disabled={callers.length === 0}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm"
          >
            Recenter Map
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {callers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No active callers. Click "Simulate Update" to add one.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {callers.map((caller) => (
                <div
                  key={caller.callerId}
                  onClick={() => setSelectedCallerId(caller.callerId)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedCallerId === caller.callerId
                      ? "bg-blue-100 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-gray-800">
                      {caller.callerId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(caller.timestamp)}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-600 mb-1">
                      <span className="font-medium">Scenario:</span>{" "}
                      {scenarioLabels[caller.scenario]}
                    </div>
                    <div className="text-gray-600 font-mono text-xs">
                      {caller.coords.lat.toFixed(5)}, {caller.coords.lng.toFixed(5)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle Column: Map */}
      <div className="flex-1 bg-gray-200 relative">
        <DispatcherMapView
          callers={callerLocations}
          selectedCallerId={selectedCallerId}
          onSelectCaller={setSelectedCallerId}
          recenterTrigger={recenterTrigger}
        />
      </div>

      {/* Right Column: Details Panel */}
      <div className="w-96 bg-white border-l border-gray-300 overflow-y-auto">
        {!selectedCaller ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-sm">Click a caller on the map or list</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-1">
                Caller Details
              </h2>
              <div className="text-xs text-gray-500">
                {formatTimestamp(selectedCaller.timestamp)}
              </div>
            </div>

            <div className="space-y-3">
              {/* Caller ID */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Caller ID
                </div>
                <div className="text-sm font-mono text-gray-800">
                  {selectedCaller.callerId}
                </div>
              </div>

              {/* Incident ID */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Incident ID
                </div>
                <div className="text-sm font-mono text-gray-800">
                  {selectedCaller.incidentId}
                </div>
              </div>

              {/* Scenario */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Scenario
                </div>
                <div className="text-sm text-gray-800">
                  {scenarioLabels[selectedCaller.scenario]}
                </div>
              </div>

              {/* Coordinates */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Coordinates
                </div>
                <div className="font-mono text-xs text-gray-800 space-y-0.5">
                  <div>{selectedCaller.coords.lat.toFixed(6)}</div>
                  <div>{selectedCaller.coords.lng.toFixed(6)}</div>
                </div>
              </div>

              {/* Bystander Report */}
              {selectedCaller.bystanderReport && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Bystander Report
                  </div>
                  <div className="text-sm text-gray-800">
                    {selectedCaller.bystanderReport}
                  </div>
                </div>
              )}

              {/* Additional Data */}
              {selectedCaller.data && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Additional Data
                  </div>
                  <pre className="text-xs text-gray-800 bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(selectedCaller.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
