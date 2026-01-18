"use client";

import { ReactNode, forwardRef } from "react";
import { Clock, Sparkles, ChevronRight, AlertCircle } from "lucide-react";

export interface TimelineEventData {
  id: string;
  timestamp: string;
  description: string;
  fromState?: Record<string, unknown>;
  toState?: Record<string, unknown>;
  confidence?: number;
  sourceSnapshots?: string[];
}

export interface TimelineEventProps {
  /** Event data */
  event: TimelineEventData;
  /** Whether this is the most recent/active event */
  isActive?: boolean;
  /** Whether this event is currently live/streaming */
  isLive?: boolean;
  /** Whether this is the first event (no line above) */
  isFirst?: boolean;
  /** Whether this is the last event (no line below) */
  isLast?: boolean;
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * TimelineEvent - Single event item in a timeline
 *
 * Features:
 * - Node connector with gradient line
 * - State transition display
 * - Confidence indicator
 * - Live pulse animation
 */
export const TimelineEvent = forwardRef<HTMLDivElement, TimelineEventProps>(
  (
    {
      event,
      isActive = false,
      isLive = false,
      isFirst = false,
      isLast = false,
      className = "",
      onClick,
    },
    ref
  ) => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    };

    const getConfidenceColor = (conf: number) => {
      if (conf >= 0.8) return "text-status-resolved";
      if (conf >= 0.5) return "text-status-warning";
      return "text-status-live";
    };

    return (
      <div
        ref={ref}
        className={`
          relative
          pl-6
          pb-4
          ${isLast ? "" : ""}
          ${onClick ? "cursor-pointer" : ""}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Vertical Line */}
        {!isLast && (
          <div
            className="absolute left-[7px] top-4 bottom-0 w-px"
            style={{
              background: isActive
                ? "linear-gradient(to bottom, var(--status-active), var(--border-default))"
                : "var(--border-default)",
            }}
          />
        )}

        {/* Node */}
        <div
          className={`
            timeline-node
            ${isActive ? "is-active" : ""}
            ${isLive ? "is-live" : ""}
          `}
        >
          {!isLive && isActive && (
            <div className="w-2 h-2 rounded-full bg-status-active" />
          )}
        </div>

        {/* Content */}
        <div className="ml-2">
          {/* Header: Time & Confidence */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-text-muted" />
              <span className="text-[11px] font-mono text-text-tertiary">
                {formatTime(event.timestamp)}
              </span>
            </div>
            {event.confidence !== undefined && (
              <div className="flex items-center gap-1">
                <Sparkles
                  className={`w-3 h-3 ${getConfidenceColor(event.confidence)}`}
                />
                <span
                  className={`text-[10px] font-mono ${getConfidenceColor(
                    event.confidence
                  )}`}
                >
                  {(event.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-text-primary leading-snug">
            {event.description}
          </p>

          {/* State Transition */}
          {(event.fromState || event.toState) && (
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono">
              {event.fromState && (
                <span className="px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-subtle text-text-muted">
                  {Object.entries(event.fromState)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </span>
              )}
              {event.fromState && event.toState && (
                <ChevronRight className="w-3 h-3 text-text-muted" />
              )}
              {event.toState && (
                <span className="px-1.5 py-0.5 rounded bg-status-active/10 border border-status-active/30 text-status-active">
                  {Object.entries(event.toState)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Source Snapshots Count */}
          {event.sourceSnapshots && event.sourceSnapshots.length > 0 && (
            <div className="mt-1.5 text-[9px] font-mono text-text-muted">
              Based on {event.sourceSnapshots.length} snapshot
              {event.sourceSnapshots.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TimelineEvent.displayName = "TimelineEvent";

/**
 * Timeline - Container for timeline events
 */
export interface TimelineProps {
  events: TimelineEventData[];
  /** ID of the currently active/selected event */
  activeEventId?: string;
  /** Whether the timeline is receiving live updates */
  isLive?: boolean;
  /** Click handler for events */
  onEventClick?: (event: TimelineEventData) => void;
  /** Show empty state when no events */
  showEmpty?: boolean;
  /** Maximum events to show */
  maxEvents?: number;
  /** Additional className */
  className?: string;
}

export function Timeline({
  events,
  activeEventId,
  isLive = false,
  onEventClick,
  showEmpty = true,
  maxEvents,
  className = "",
}: TimelineProps) {
  const displayEvents = maxEvents ? events.slice(0, maxEvents) : events;

  if (events.length === 0 && showEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
        <AlertCircle className="w-10 h-10 text-text-muted mb-2" strokeWidth={1} />
        <p className="text-text-tertiary text-sm">No timeline events yet</p>
        <p className="text-text-muted text-xs mt-1">
          Events will appear as AI processes video
        </p>
      </div>
    );
  }

  return (
    <div className={`timeline ${className}`}>
      {displayEvents.map((event, index) => (
        <TimelineEvent
          key={event.id}
          event={event}
          isFirst={index === 0}
          isLast={index === displayEvents.length - 1}
          isActive={event.id === activeEventId || (index === 0 && isLive)}
          isLive={index === 0 && isLive}
          onClick={onEventClick ? () => onEventClick(event) : undefined}
        />
      ))}
      {maxEvents && events.length > maxEvents && (
        <div className="pl-6 pt-2 text-[10px] font-mono text-text-muted">
          + {events.length - maxEvents} more events
        </div>
      )}
    </div>
  );
}

/**
 * TimelineHeader - Header for timeline section
 */
export interface TimelineHeaderProps {
  title?: string;
  eventCount?: number;
  isLive?: boolean;
  children?: ReactNode;
}

export function TimelineHeader({
  title = "Timeline",
  eventCount,
  isLive = false,
  children,
}: TimelineHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h4 className="text-text-primary font-medium text-sm">{title}</h4>
        {eventCount !== undefined && (
          <span className="text-[10px] font-mono text-text-muted px-1.5 py-0.5 rounded bg-bg-tertiary border border-border-subtle">
            {eventCount}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-status-live uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
            Live
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
