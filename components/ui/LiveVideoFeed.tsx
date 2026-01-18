"use client";

import { ReactNode, forwardRef } from "react";
import { Video, Radio, MapPin, AlertTriangle, Activity } from "lucide-react";

export interface LiveVideoFeedProps {
  /** Video stream content (LiveKit component, video element, etc.) */
  children: ReactNode;
  /** Whether the feed is currently live */
  isLive?: boolean;
  /** Latitude coordinate */
  lat?: number;
  /** Longitude coordinate */
  lng?: number;
  /** AI-detected scenario type */
  scenario?: string;
  /** Confidence score (0-1) */
  confidence?: number;
  /** Video ID for display */
  videoId?: string;
  /** Timestamp */
  timestamp?: string;
  /** Current AI state description */
  currentState?: string;
  /** Additional className */
  className?: string;
  /** Aspect ratio */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "auto";
  /** Show the metadata overlay */
  showMetadata?: boolean;
  /** Show the live indicator */
  showLiveIndicator?: boolean;
}

/**
 * LiveVideoFeed - Wrapper for LiveKit streams with technical metadata overlay
 *
 * Features:
 * - Red pulse border for live streams
 * - Technical metadata overlay (lat/lng, scenario, confidence)
 * - Schematic-style metadata display
 * - Animated border flow effect
 */
export const LiveVideoFeed = forwardRef<HTMLDivElement, LiveVideoFeedProps>(
  (
    {
      children,
      isLive = false,
      lat,
      lng,
      scenario,
      confidence,
      videoId,
      timestamp,
      currentState,
      className = "",
      aspectRatio = "16/9",
      showMetadata = true,
      showLiveIndicator = true,
    },
    ref
  ) => {
    const aspectClasses = {
      "16/9": "aspect-video",
      "4/3": "aspect-[4/3]",
      "1/1": "aspect-square",
      auto: "",
    };

    const formatCoordinate = (coord: number, type: "lat" | "lng") => {
      const direction =
        type === "lat" ? (coord >= 0 ? "N" : "S") : coord >= 0 ? "E" : "W";
      return `${Math.abs(coord).toFixed(6)}${direction}`;
    };

    const formatScenario = (s: string) => {
      return s
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };

    return (
      <div
        ref={ref}
        className={`
          live-feed-container
          ${isLive ? "is-live" : ""}
          ${aspectClasses[aspectRatio]}
          ${className}
        `}
      >
        {/* Video Content */}
        <div className="relative w-full h-full overflow-hidden rounded-lg bg-bg-tertiary">
          {children}

          {/* Live Indicator Badge */}
          {showLiveIndicator && isLive && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-live/90 backdrop-blur-sm">
                <Radio className="w-3 h-3 text-white animate-pulse" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          )}

          {/* Scan Line Effect */}
          {isLive && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-status-live/30 to-transparent animate-scan-line" />
            </div>
          )}

          {/* Technical Metadata Overlay */}
          {showMetadata && (
            <div className="live-feed-metadata z-10">
              <div className="space-y-1.5">
                {/* Coordinates */}
                {lat !== undefined && lng !== undefined && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-text-tertiary" />
                    <span className="text-[10px] font-mono text-text-secondary">
                      {formatCoordinate(lat, "lat")} {formatCoordinate(lng, "lng")}
                    </span>
                  </div>
                )}

                {/* Scenario */}
                {scenario && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-status-warning" />
                    <span className="text-[10px] font-mono text-text-secondary">
                      {formatScenario(scenario)}
                      {confidence !== undefined && (
                        <span className="text-text-muted ml-1">
                          ({(confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Current State */}
                {currentState && (
                  <div className="flex items-start gap-2 mt-2">
                    <Activity className="w-3 h-3 text-status-active flex-shrink-0 mt-0.5" />
                    <span className="text-[10px] font-mono text-text-secondary line-clamp-2">
                      {currentState}
                    </span>
                  </div>
                )}

                {/* Video ID & Timestamp */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                  {videoId && (
                    <span className="text-[9px] font-mono text-text-muted">
                      ID: {videoId.slice(0, 8)}...
                    </span>
                  )}
                  {timestamp && (
                    <span className="text-[9px] font-mono text-text-muted">
                      {new Date(timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

LiveVideoFeed.displayName = "LiveVideoFeed";

/**
 * VideoFeedPlaceholder - Placeholder when no video is available
 */
export interface VideoFeedPlaceholderProps {
  message?: string;
  className?: string;
}

export function VideoFeedPlaceholder({
  message = "No video stream",
  className = "",
}: VideoFeedPlaceholderProps) {
  return (
    <div
      className={`
        aspect-video
        rounded-lg
        bg-bg-tertiary
        border
        border-border-subtle
        flex
        flex-col
        items-center
        justify-center
        ${className}
      `}
    >
      <Video className="w-12 h-12 text-text-muted mb-2" strokeWidth={1} />
      <span className="text-text-tertiary text-sm">{message}</span>
    </div>
  );
}

/**
 * VideoFeedGrid - Container for multiple video feeds
 */
export interface VideoFeedGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function VideoFeedGrid({
  children,
  columns = 2,
  className = "",
}: VideoFeedGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-3 ${columnClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}
