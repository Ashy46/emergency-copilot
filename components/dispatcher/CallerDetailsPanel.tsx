import { scenarioLabels, scenarioColors } from "@/lib/constants";
import { VideoStreamPanel } from "./VideoStreamPanel";

type ScenarioKey = keyof typeof scenarioColors;

// Legacy Event type - this component is unused
interface LegacyEvent {
  id: string;
  timestamp: number;
  scenario: ScenarioKey;
  lat: number;
  lng: number;
  videoId: string;
  incidentId: string;
  bystanderReport?: string;
  data?: Record<string, unknown>;
}

interface CallerDetailsPanelProps {
  caller: LegacyEvent;
  onClose: () => void;
  isExpanded: boolean;
  timelineHeight?: number;
}

export function CallerDetailsPanel({ caller, onClose, isExpanded, timelineHeight = 0 }: CallerDetailsPanelProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!caller) return null;

  return (
    <div
      className="absolute top-4 right-4 w-96 bg-surface-card border border-border-subtle shadow-2xl flex flex-col overflow-hidden z-[1500] rounded-xl transition-all duration-200"
      style={{ bottom: `${16 + timelineHeight}px` }}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onClose}
        className="p-4 bg-bg-tertiary border-b border-border-subtle hover:bg-surface-card-hover transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {caller.scenario === 'carAccident' && '🚗'}
            {caller.scenario === 'fire' && '🔥'}
            {caller.scenario === 'medical' && '⚕️'}
            {caller.scenario === 'unknown' && '❓'}
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-text-primary">
              Caller Details
            </h2>
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimestamp(caller.timestamp)}
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-text-tertiary transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Details Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-6 bg-bg-secondary">
          <div className="space-y-3">
            {/* Live Video Stream */}
            <VideoStreamPanel roomName={caller.videoId} callerId={caller.id} />

            {/* Caller ID */}
            <div className="tile gradient-border-active">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-status-active" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Caller ID
                </div>
              </div>
              <div className="text-sm font-mono font-bold text-text-primary">
                {caller.id}
              </div>
            </div>

            {/* Incident ID */}
            <div className="tile">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Incident ID
                </div>
              </div>
              <div className="text-sm font-mono font-bold text-text-primary">
                {caller.incidentId}
              </div>
            </div>

            {/* Scenario */}
            <div className="tile gradient-border-emergency">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Emergency Type
                </div>
              </div>
              <div className="text-sm font-semibold text-text-primary">
                {scenarioLabels[caller.scenario]}
              </div>
            </div>

            {/* Coordinates */}
            <div className="tile gradient-border-resolved">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-status-resolved" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  Location
                </div>
              </div>
              <div className="font-mono text-xs text-text-secondary space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-muted">Lat:</span>
                  <span className="font-semibold text-text-primary">{caller.lat.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Lng:</span>
                  <span className="font-semibold text-text-primary">{caller.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Bystander Report */}
            {caller.bystanderReport && (
              <div className="tile">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Bystander Report
                  </div>
                </div>
                <div className="text-sm text-text-primary leading-relaxed">
                  {caller.bystanderReport}
                </div>
              </div>
            )}

            {/* Additional Data */}
            {caller.data && (
              <div className="tile">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Additional Data
                  </div>
                </div>
                <pre className="text-xs text-text-primary bg-bg-tertiary p-3 rounded border border-border-subtle overflow-x-auto font-mono">
                  {JSON.stringify(caller.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
