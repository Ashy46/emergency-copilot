import type { Event } from "@/app/dispatcher/page";
import { scenarioLabels, scenarioTimelineColors } from "@/lib/constants";

interface TimelinePlaybackProps {
  eventHistory: Event[];
  isLiveMode: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
  minTime: number;
  maxTime: number;
  onTogglePlayback: () => void;
  onGoToLive: () => void;
  onSpeedChange: (speed: number) => void;
  onTimeChange: (time: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function TimelinePlayback({
  eventHistory,
  isLiveMode,
  isPlaying,
  playbackSpeed,
  currentTime,
  minTime,
  maxTime,
  onTogglePlayback,
  onGoToLive,
  onSpeedChange,
  onTimeChange,
  isExpanded,
  onToggleExpand,
}: TimelinePlaybackProps) {
  const formatTimelineTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  if (eventHistory.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-2xl z-[1500] rounded-xl overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold text-gray-800">Timeline Playback</span>
          {isLiveMode ? (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
              PLAYBACK
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Timeline Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlayback}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  {isLiveMode ? "Replay from Start" : "Play"}
                </>
              )}
            </button>

            {/* Go to Live Button */}
            <button
              onClick={onGoToLive}
              disabled={isLiveMode}
              className={`${
                isLiveMode
                  ? "bg-red-600 text-white"
                  : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              } px-6 py-3 rounded-lg disabled:opacity-100 font-semibold flex items-center gap-2 shadow-lg transition-all duration-200 ${
                !isLiveMode && "hover:shadow-xl transform hover:scale-105"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isLiveMode ? "bg-white animate-pulse" : "bg-white"}`} />
              {isLiveMode ? "LIVE" : "Go Live"}
            </button>

            {/* Speed Control */}
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">Speed:</span>
              <div className="flex gap-1">
                {[1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`px-3 py-1 rounded-md font-semibold text-sm transition-all duration-200 ${
                      playbackSpeed === speed
                        ? "bg-blue-600 text-white shadow-md scale-110"
                        : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Current Time Display */}
            <div className="ml-auto bg-gray-800 text-white px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isLiveMode ? (
                <span className="text-red-400 font-bold">● LIVE</span>
              ) : (
                formatTimelineTimestamp(currentTime)
              )}
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="bg-white p-4 rounded-lg border border-gray-300 shadow-inner">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-xs text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                  {formatTimelineTimestamp(minTime)}
                </span>
              </div>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={minTime}
                  max={maxTime}
                  value={currentTime}
                  onChange={(e) => onTimeChange(Number(e.target.value))}
                  disabled={isLiveMode}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: isLiveMode
                      ? "linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)"
                      : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                          ((currentTime - minTime) / (maxTime - minTime)) * 100
                        }%, #e5e7eb ${
                          ((currentTime - minTime) / (maxTime - minTime)) * 100
                        }%, #e5e7eb 100%)`,
                  }}
                />
                {/* Event Markers on Timeline */}
                <div className="absolute inset-0 pointer-events-none">
                  {eventHistory.map((event, index) => {
                    const position =
                      ((event.timestamp - minTime) / (maxTime - minTime)) * 100;
                    return (
                      <div
                        key={`${event.id}-${index}`}
                        className="absolute top-1/2 w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform pointer-events-auto border-2 border-white shadow-md"
                        style={{
                          left: `${position}%`,
                          backgroundColor: scenarioTimelineColors[event.scenario],
                          transform: "translate(-50%, -50%)",
                        }}
                        title={`${event.id} - ${scenarioLabels[event.scenario]} - ${formatTimelineTimestamp(event.timestamp)}`}
                        onClick={() => onTimeChange(event.timestamp)}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                  {formatTimelineTimestamp(maxTime)}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Timeline Legend */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-600">Car Accident</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-600">Fire</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">Medical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-gray-600">Unknown</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
