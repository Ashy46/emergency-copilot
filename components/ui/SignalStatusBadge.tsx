"use client";

import { forwardRef } from "react";
import { Radio, Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";

export interface SignalStatusBadgeProps {
  /** Current signal count (0-3 typically) */
  signalCount: number;
  /** Maximum signals before threshold (default: 3) */
  threshold?: number;
  /** Whether streaming is active */
  isStreaming?: boolean;
  /** Whether detection is running */
  isDetecting?: boolean;
  /** Status message to display */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show the signal bars */
  showBars?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * SignalStatusBadge - Technical indicator for Overshoot SDK detection threshold
 *
 * Features:
 * - Visual bars that fill up as signals are detected
 * - Animated fill effect
 * - Warning state at 2/3 signals
 * - Active/streaming state indication
 */
export const SignalStatusBadge = forwardRef<HTMLDivElement, SignalStatusBadgeProps>(
  (
    {
      signalCount,
      threshold = 3,
      isStreaming = false,
      isDetecting = false,
      message,
      size = "md",
      showBars = true,
      className = "",
    },
    ref
  ) => {
    const sizeClasses = {
      sm: { badge: "px-2 py-1", bar: "w-1 h-3", text: "text-[9px]", icon: "w-3 h-3" },
      md: { badge: "px-3 py-1.5", bar: "w-1.5 h-4", text: "text-[10px]", icon: "w-3.5 h-3.5" },
      lg: { badge: "px-4 py-2", bar: "w-2 h-5", text: "text-xs", icon: "w-4 h-4" },
    };

    const s = sizeClasses[size];
    const isAtThreshold = signalCount >= threshold;
    const isWarning = signalCount >= threshold - 1 && !isAtThreshold;

    const getStatusColor = () => {
      if (isStreaming) return "border-status-live shadow-[0_0_12px_var(--status-live-glow)]";
      if (isAtThreshold) return "border-status-live";
      if (isWarning) return "border-status-warning";
      if (isDetecting) return "border-status-active";
      return "border-border-subtle";
    };

    const getStatusIcon = () => {
      if (isStreaming) return <Radio className={`${s.icon} text-status-live animate-pulse`} />;
      if (isAtThreshold) return <CheckCircle className={`${s.icon} text-status-live`} />;
      if (isWarning) return <AlertCircle className={`${s.icon} text-status-warning`} />;
      if (isDetecting) return <Wifi className={`${s.icon} text-status-active`} />;
      return <WifiOff className={`${s.icon} text-text-muted`} />;
    };

    const getStatusText = () => {
      if (message) return message;
      if (isStreaming) return "Streaming";
      if (isAtThreshold) return "Threshold Met";
      if (isDetecting) return "Detecting";
      return "Standby";
    };

    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center gap-2
          ${s.badge}
          bg-surface-card
          border
          ${getStatusColor()}
          rounded-md
          transition-all duration-300
          ${className}
        `}
      >
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Signal Bars */}
        {showBars && (
          <div className="flex gap-0.5 items-end">
            {Array.from({ length: threshold }).map((_, index) => {
              const isFilled = index < signalCount;
              const isCurrentlyFilling = index === signalCount - 1 && isDetecting;

              return (
                <div
                  key={index}
                  className={`
                    ${s.bar}
                    rounded-sm
                    transition-all duration-300
                    ${
                      isFilled
                        ? isStreaming || isAtThreshold
                          ? "bg-gradient-to-t from-emergency-start to-emergency-end shadow-[0_0_8px_var(--status-live-glow)]"
                          : isWarning
                          ? "bg-gradient-to-t from-status-warning to-emergency-start"
                          : "bg-gradient-to-t from-active-start to-active-end"
                        : "bg-border-default"
                    }
                    ${isCurrentlyFilling ? "animate-signal-fill" : ""}
                  `}
                  style={{
                    height: `${((index + 1) / threshold) * 100}%`,
                    minHeight: size === "sm" ? 4 : size === "md" ? 6 : 8,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Status Text */}
        <span className={`${s.text} font-mono text-text-secondary whitespace-nowrap`}>
          {getStatusText()}
        </span>

        {/* Counter */}
        <span
          className={`
            ${s.text}
            font-mono
            px-1
            rounded
            ${
              isStreaming || isAtThreshold
                ? "bg-status-live/20 text-status-live"
                : isWarning
                ? "bg-status-warning/20 text-status-warning"
                : isDetecting
                ? "bg-status-active/20 text-status-active"
                : "bg-bg-tertiary text-text-muted"
            }
          `}
        >
          {signalCount}/{threshold}
        </span>
      </div>
    );
  }
);

SignalStatusBadge.displayName = "SignalStatusBadge";

/**
 * DetectionStatus - Compact status indicator
 */
export interface DetectionStatusProps {
  isDetecting: boolean;
  signalCount: number;
  threshold?: number;
  className?: string;
}

export function DetectionStatus({
  isDetecting,
  signalCount,
  threshold = 3,
  className = "",
}: DetectionStatusProps) {
  const isAtThreshold = signalCount >= threshold;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`
          w-2 h-2 rounded-full
          ${
            isAtThreshold
              ? "bg-status-live animate-pulse"
              : isDetecting
              ? "bg-status-active animate-pulse"
              : "bg-text-muted"
          }
        `}
      />
      <span className="text-[10px] font-mono text-text-secondary">
        {isAtThreshold ? "Streaming" : isDetecting ? "Monitoring" : "Standby"}
      </span>
    </div>
  );
}

/**
 * SignalMeter - Horizontal signal strength meter
 */
export interface SignalMeterProps {
  value: number;
  max?: number;
  variant?: "default" | "emergency" | "warning";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function SignalMeter({
  value,
  max = 100,
  variant = "default",
  showLabel = false,
  label,
  className = "",
}: SignalMeterProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const gradientClasses = {
    default: "from-active-start to-active-end",
    emergency: "from-emergency-start to-emergency-end",
    warning: "from-status-warning to-emergency-start",
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-text-secondary">{label}</span>
          <span className="text-[10px] font-mono text-text-muted">
            {value}/{max}
          </span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClasses[variant]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
