"use client";

import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AlertTriangle,
  Video,
  Flame,
  Car,
  Heart,
  Shield,
  Users,
  Zap,
  Eye,
} from "lucide-react";

export type MarkerType = "incident" | "video";
export type MarkerStatus = "active" | "live" | "ended" | "resolved" | "archived";
export type ScenarioType =
  | "vehicle_accident"
  | "fire"
  | "medical"
  | "weapon"
  | "crowd"
  | "unknown";

export interface MarkerConfig {
  type: MarkerType;
  status: MarkerStatus;
  scenario?: ScenarioType;
  isSelected?: boolean;
  count?: number;
}

/**
 * Get the appropriate icon component for a scenario
 */
function getScenarioIcon(scenario?: ScenarioType) {
  switch (scenario) {
    case "vehicle_accident":
      return Car;
    case "fire":
      return Flame;
    case "medical":
      return Heart;
    case "weapon":
      return Shield;
    case "crowd":
      return Users;
    default:
      return AlertTriangle;
  }
}

/**
 * Get status-based color classes
 */
function getStatusColors(status: MarkerStatus, type: MarkerType) {
  if (type === "video" && status === "live") {
    return {
      borderColor: "var(--status-live)",
      glowColor: "var(--status-live-glow)",
      iconColor: "#ef4444",
    };
  }

  switch (status) {
    case "active":
      return {
        borderColor: "var(--status-active)",
        glowColor: "var(--status-active-glow)",
        iconColor: "#3b82f6",
      };
    case "resolved":
      return {
        borderColor: "var(--status-resolved)",
        glowColor: "var(--status-resolved-glow)",
        iconColor: "#22c55e",
      };
    case "ended":
    case "archived":
      return {
        borderColor: "var(--border-strong)",
        glowColor: "transparent",
        iconColor: "#6b7280",
      };
    default:
      return {
        borderColor: "var(--border-strong)",
        glowColor: "transparent",
        iconColor: "#9ca3af",
      };
  }
}

/**
 * IncidentMarkerIcon - React component for incident markers
 */
interface IncidentMarkerIconProps {
  config: MarkerConfig;
}

function IncidentMarkerIcon({ config }: IncidentMarkerIconProps) {
  const { type, status, scenario, isSelected, count } = config;
  const colors = getStatusColors(status, type);
  const Icon = type === "video" ? Video : getScenarioIcon(scenario);
  const isLive = type === "video" && status === "live";
  const isActive = status === "active" || isLive;

  const baseSize = type === "video" ? 28 : 32;
  const borderRadius = type === "video" ? "50%" : "4px";

  return (
    <div
      style={{
        position: "relative",
        width: baseSize,
        height: baseSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulse Ring for Live/Active */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: borderRadius,
            border: `2px solid ${colors.borderColor}`,
            animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            opacity: 0.6,
          }}
        />
      )}

      {/* Main Marker */}
      <div
        style={{
          width: baseSize,
          height: baseSize,
          borderRadius: borderRadius,
          background: "#0c0c0c",
          border: `1.5px solid ${isSelected ? "rgba(255,255,255,0.9)" : colors.borderColor}`,
          boxShadow: isSelected
            ? `0 0 24px rgba(255, 255, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.6)`
            : isActive
            ? `0 0 16px ${colors.glowColor}, 0 2px 8px rgba(0, 0, 0, 0.5)`
            : `0 2px 8px rgba(0, 0, 0, 0.5)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: isSelected ? "scale(1.15)" : "scale(1)",
          transition: "all 0.2s ease",
        }}
      >
        <Icon
          size={type === "video" ? 14 : 16}
          color={colors.iconColor}
          strokeWidth={1.5}
        />
      </div>

      {/* Count Badge for Incidents */}
      {type === "incident" && count !== undefined && count > 1 && (
        <div
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "white",
            fontSize: 9,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          {count}
        </div>
      )}

      {/* Live Badge for Video */}
      {isLive && (
        <div
          style={{
            position: "absolute",
            bottom: -8,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#ef4444",
            color: "white",
            fontSize: 8,
            fontWeight: 700,
            padding: "1px 4px",
            borderRadius: 2,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Live
        </div>
      )}
    </div>
  );
}

/**
 * Create a Leaflet DivIcon from the marker config
 */
export function createMarkerIcon(config: MarkerConfig): L.DivIcon {
  const html = renderToStaticMarkup(<IncidentMarkerIcon config={config} />);
  const size = config.type === "video" ? 28 : 32;
  const anchor = size / 2;

  return L.divIcon({
    html,
    className: "custom-marker",
    iconSize: [size + 8, size + 16], // Extra space for pulse ring and badges
    iconAnchor: [anchor + 4, anchor + 4],
    popupAnchor: [0, -anchor - 4],
  });
}

/**
 * Pre-built marker icons for common states
 */
export const MarkerIcons = {
  incidentActive: (scenario?: ScenarioType, count?: number, isSelected?: boolean) =>
    createMarkerIcon({
      type: "incident",
      status: "active",
      scenario,
      count,
      isSelected,
    }),

  incidentResolved: (scenario?: ScenarioType, count?: number, isSelected?: boolean) =>
    createMarkerIcon({
      type: "incident",
      status: "resolved",
      scenario,
      count,
      isSelected,
    }),

  videoLive: (isSelected?: boolean) =>
    createMarkerIcon({
      type: "video",
      status: "live",
      isSelected,
    }),

  videoEnded: (isSelected?: boolean) =>
    createMarkerIcon({
      type: "video",
      status: "ended",
      isSelected,
    }),

  videoRecorded: (isSelected?: boolean) =>
    createMarkerIcon({
      type: "video",
      status: "resolved",
      isSelected,
    }),
};

/**
 * Helper to get marker icon based on data
 */
export function getMarkerIcon(
  type: MarkerType,
  status: MarkerStatus,
  options?: {
    scenario?: ScenarioType;
    count?: number;
    isSelected?: boolean;
  }
): L.DivIcon {
  return createMarkerIcon({
    type,
    status,
    ...options,
  });
}

/**
 * MarkerLegend - Component showing marker type explanations
 */
export function MarkerLegend() {
  const items = [
    { label: "Active Incident", color: "var(--status-active)", shape: "square" },
    { label: "Resolved Incident", color: "var(--status-resolved)", shape: "square" },
    { label: "Live Video", color: "var(--status-live)", shape: "circle" },
    { label: "Ended Video", color: "var(--status-ended)", shape: "circle" },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-text-secondary">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 ${item.shape === "circle" ? "rounded-full" : "rounded-sm"}`}
            style={{
              border: `1.5px solid ${item.color}`,
              background: "var(--surface-card)",
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
