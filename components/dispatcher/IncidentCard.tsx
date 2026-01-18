import type { Incident } from "@/types/api";

interface IncidentCardProps {
  incident: Incident;
  videoCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  active: {
    bg: "bg-[#f87171]/10 border-[#f87171]/30",
    selectedBg: "bg-[#f87171]/20 border-[#f87171]",
    dot: "bg-[#f87171] animate-pulse",
    text: "text-[#f87171]",
    label: "Active",
  },
  resolved: {
    bg: "bg-[#16a34a]/10 border-[#16a34a]/30",
    selectedBg: "bg-[#16a34a]/20 border-[#16a34a]",
    dot: "bg-[#16a34a]",
    text: "text-[#16a34a]",
    label: "Resolved",
  },
  archived: {
    bg: "bg-white/5 border-[#2a2f36]",
    selectedBg: "bg-white/10 border-[#6b7280]",
    dot: "bg-[#6b7280]",
    text: "text-[#6b7280]",
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
      className={`p-4 cursor-pointer rounded-lg border-[1.5px] transition-all duration-200 ${isSelected
          ? `${config.selectedBg} scale-[1.02]`
          : "bg-[#1a1e24] border-[#2a2f36] hover:border-[#5b8cff]/40 hover:bg-white/5"
        }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-medium text-white text-sm truncate max-w-[150px] mono" title={incident.id}>
              {incident.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-muted">
              {formatTimestamp(incident.startedAt)}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.text} ${config.bg}`}>
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          {config.label}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-muted mono text-[10px]">
          {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
        </div>
        {videoCount > 0 && (
          <div className="flex items-center gap-1 text-muted">
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
