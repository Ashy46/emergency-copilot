import type { Video } from "@/types/api";

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onClick: () => void;
}

const statusConfig = {
  live: {
    bg: "bg-red-100 border-red-300",
    dot: "bg-red-500 animate-pulse",
    text: "text-red-700",
    label: "LIVE",
  },
  ended: {
    bg: "bg-gray-100 border-gray-300",
    dot: "bg-gray-500",
    text: "text-gray-700",
    label: "Ended",
  },
  recorded: {
    bg: "bg-green-100 border-green-300",
    dot: "bg-green-500",
    text: "text-green-700",
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
      className={`p-4 cursor-pointer rounded-lg border-2 transition-all duration-200 ${
        isSelected
          ? `${config.bg} shadow-md scale-[1.02]`
          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="font-semibold text-gray-800 text-sm truncate max-w-[150px]" title={video.id}>
              {video.id.slice(0, 8)}...
            </div>
            <div className="text-xs text-gray-500">
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
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
          {video.currentState}
        </p>
      )}

      <div className="text-xs space-y-1">
        <div className="text-gray-500 font-mono text-[10px]">
          {video.lat.toFixed(4)}, {video.lng.toFixed(4)}
        </div>
        {video.incidentId && (
          <div className="flex items-center gap-1 text-gray-600">
            <span className="text-[10px]">Incident:</span>
            <span className="font-mono text-[10px] truncate max-w-[120px]" title={video.incidentId}>
              {video.incidentId.slice(0, 8)}...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
