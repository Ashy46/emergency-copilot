import type { Incident } from "@/types/api";

interface IncidentCardProps {
  incident: Incident;
  videoCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  active: {
    bg: "bg-surface-card border-border-default",
    selectedBg: "bg-surface-elevated border-status-live",
    dot: "bg-status-live animate-pulse",
    text: "text-status-live",
    label: "Active",
  },
  resolved: {
    bg: "bg-surface-card border-border-default",
    selectedBg: "bg-surface-elevated border-status-resolved",
    dot: "bg-status-resolved",
    text: "text-status-resolved",
    label: "Resolved",
  },
  archived: {
    bg: "bg-surface-card border-border-default",
    selectedBg: "bg-surface-elevated border-status-ended",
    dot: "bg-status-ended",
    text: "text-status-ended",
    label: "Archived",
  },
};

export function IncidentCard({ incident, videoCount = 0, isSelected, onClick }: IncidentCardProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const config = statusConfig[incident.status];

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer rounded-lg border transition-all duration-200 ${
        isSelected
          ? `${config.selectedBg} shadow-lg scale-[1.02]`
          : `${config.bg} hover:bg-surface-card-hover hover:border-border-strong`
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-semibold text-text-primary text-sm truncate max-w-[150px]" title={incident.id}>
              {incident.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-text-muted">
              {formatTimestamp(incident.startedAt)}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.text} bg-bg-tertiary border border-border-subtle`}>
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          {config.label}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-text-muted font-mono text-[10px]">
          {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
        </div>
        {videoCount > 0 && (
          <div className="flex items-center gap-1 text-text-secondary">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{videoCount} video{videoCount !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
