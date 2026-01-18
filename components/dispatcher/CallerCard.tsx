import { scenarioColors, scenarioIcons, scenarioLabels } from "@/lib/constants";

type ScenarioKey = keyof typeof scenarioColors;

// Legacy Event type - this component is unused
interface LegacyEvent {
  id: string;
  timestamp: number;
  scenario: ScenarioKey;
  lat: number;
  lng: number;
}

interface CallerCardProps {
  caller: LegacyEvent;
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
      className={`p-4 cursor-pointer rounded-lg border transition-all duration-200 ${
        isSelected
          ? "bg-surface-elevated border-status-active shadow-lg scale-[1.02]"
          : "bg-surface-card border-border-default hover:bg-surface-card-hover hover:border-border-strong"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{scenarioIcons[caller.scenario]}</span>
          <div>
            <div className="font-semibold text-text-primary text-sm">
              {caller.id}
            </div>
            <div className="text-xs text-text-muted">
              {formatTimestamp(caller.timestamp)}
            </div>
          </div>
        </div>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-text-secondary">
          <span className="font-semibold">Type:</span>
          <span>{scenarioLabels[caller.scenario]}</span>
        </div>
        <div className="text-text-muted font-mono text-[10px]">
          {caller.lat.toFixed(4)}, {caller.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
