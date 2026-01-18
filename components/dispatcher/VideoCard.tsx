import type { Video } from "@/types/api";

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  live: {
    bg: "bg-[#f87171]/10 border-[#f87171]/30",
    selectedBg: "bg-[#f87171]/20 border-[#f87171]",
    dot: "bg-[#f87171] animate-pulse",
    text: "text-[#f87171]",
    label: "LIVE",
  },
  ended: {
    bg: "bg-white/5 border-[#2a2f36]",
    selectedBg: "bg-white/10 border-[#6b7280]",
    dot: "bg-[#6b7280]",
    text: "text-[#6b7280]",
    label: "Ended",
  },
  recorded: {
    bg: "bg-[#16a34a]/10 border-[#16a34a]/30",
    selectedBg: "bg-[#16a34a]/20 border-[#16a34a]",
    dot: "bg-[#16a34a]",
    text: "text-[#16a34a]",
    label: "Recorded",
  },
};

export function VideoCard({ video, isSelected, onClick }: VideoCardProps) {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const config = statusConfig[video.status];

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="font-medium text-white text-sm truncate max-w-[150px] mono" title={video.id}>
              {video.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-muted">
              {formatTimestamp(video.startedAt)}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.text} ${config.bg}`}>
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          {config.label}
        </div>
      </div>
      {/* Current State Summary */}
      {video.currentState && (
        <p className="text-xs text-muted line-clamp-2 mb-2">
          {video.currentState}
        </p>
      )}

      <div className="text-xs space-y-1">
        <div className="text-muted mono text-[10px]">
          {video.lat.toFixed(4)}, {video.lng.toFixed(4)}
        </div>
        {video.incidentId && (
          <div className="flex items-center gap-1 text-muted">
            <span className="text-[10px]">Incident:</span>
            <span className="mono text-[10px] truncate max-w-[120px]" title={video.incidentId}>
              {video.incidentId.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
