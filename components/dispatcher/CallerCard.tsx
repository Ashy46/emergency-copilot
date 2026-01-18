import type { Event } from "@/app/dispatcher/page";
import { scenarioColors, scenarioIcons, scenarioLabels } from "@/lib/constants";

interface CallerCardProps {
  caller: Event;
  isSelected: boolean;
  onClick: () => void;
}

export function CallerCard({ caller, isSelected, onClick }: CallerCardProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer rounded-lg border-2 transition-all duration-200 ${
        isSelected
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
}
