import type { Incident } from "@/types/api";

interface IncidentCardProps {
  incident: Incident;
  videoCount?: number;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  active: {
    bg: "bg-red-50 border-red-300",
    selectedBg: "from-red-50 to-red-100 border-red-400",
    dot: "bg-red-500 animate-pulse",
    text: "text-red-700",
    label: "Active",
  },
  resolved: {
    bg: "bg-green-50 border-green-300",
    selectedBg: "from-green-50 to-green-100 border-green-400",
    dot: "bg-green-500",
    text: "text-green-700",
    label: "Resolved",
  },
  archived: {
    bg: "bg-gray-50 border-gray-300",
    selectedBg: "from-gray-50 to-gray-100 border-gray-400",
    dot: "bg-gray-500",
    text: "text-gray-700",
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
      className={`p-4 cursor-pointer rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? `bg-gradient-to-br ${config.selectedBg} shadow-md scale-[1.02]`
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-semibold text-gray-800 text-sm truncate max-w-[150px]" title={incident.id}>
              {incident.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-gray-500">
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
        <div className="text-gray-500 font-mono text-[10px]">
          {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
        </div>
        {videoCount > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
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
