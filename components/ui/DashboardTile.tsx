"use client";

import { ReactNode, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

export interface DashboardTileProps {
  /** Tile title displayed in header */
  title?: string;
  /** Optional subtitle/metadata */
  subtitle?: string;
  /** Lucide icon component for corner positioning */
  icon?: LucideIcon;
  /** Content inside the tile */
  children: ReactNode;
  /** Additional className for custom styling */
  className?: string;
  /** Variant styling */
  variant?: "default" | "elevated" | "emergency" | "active" | "resolved";
  /** Whether the tile is in a selected state */
  selected?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether to show the technical grid background */
  showGrid?: boolean;
  /** Compact mode with reduced padding */
  compact?: boolean;
}

/**
 * DashboardTile - Base container component for the command center UI
 *
 * Features:
 * - Thin-line border with subtle corner rounding
 * - Icon-in-corner layout matching AIP reference
 * - Gradient border variants for different states
 * - Technical grid background option
 */
export const DashboardTile = forwardRef<HTMLDivElement, DashboardTileProps>(
  (
    {
      title,
      subtitle,
      icon: Icon,
      children,
      className = "",
      variant = "default",
      selected = false,
      onClick,
      showGrid = false,
      compact = false,
    },
    ref
  ) => {
    const baseClasses = `
      relative
      rounded-lg
      border
      transition-all
      duration-200
      ${compact ? "p-3" : "p-4"}
      ${onClick ? "cursor-pointer" : ""}
    `;

    const variantClasses = {
      default: `
        bg-surface-card
        border-border-subtle
        hover:bg-surface-hover
        hover:border-border-default
      `,
      elevated: `
        bg-surface-elevated
        border-border-default
        shadow-lg
        shadow-black/40
      `,
      emergency: `
        bg-surface-card
        gradient-border-emergency
        shadow-[0_0_20px_rgba(239,68,68,0.15)]
      `,
      active: `
        bg-surface-card
        gradient-border-active
        shadow-[0_0_20px_rgba(59,130,246,0.15)]
      `,
      resolved: `
        bg-surface-card
        gradient-border-resolved
        shadow-[0_0_20px_rgba(34,197,94,0.15)]
      `,
    };

    const selectedClasses = selected
      ? "ring-1 ring-white/20 border-border-strong"
      : "";

    const gridClasses = showGrid ? "bg-grid" : "";

    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${selectedClasses}
          ${gridClasses}
          ${className}
        `}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        {/* Corner Icon */}
        {Icon && (
          <div className="tile-icon">
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className={`${Icon ? "pr-8" : ""} ${compact ? "mb-2" : "mb-3"}`}>
            {title && (
              <h3 className="text-text-primary font-medium text-sm leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-text-tertiary text-xs mt-0.5 font-mono">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div className="relative">{children}</div>
      </div>
    );
  }
);

DashboardTile.displayName = "DashboardTile";

/**
 * EmptyTile - Placeholder tile for empty states
 */
export interface EmptyTileProps {
  icon?: LucideIcon;
  message: string;
  description?: string;
  className?: string;
}

export function EmptyTile({
  icon: Icon,
  message,
  description,
  className = "",
}: EmptyTileProps) {
  return (
    <DashboardTile className={`text-center ${className}`}>
      {Icon && (
        <Icon className="w-12 h-12 text-text-muted mx-auto mb-3" strokeWidth={1} />
      )}
      <p className="text-text-secondary text-sm font-medium">{message}</p>
      {description && (
        <p className="text-text-muted text-xs mt-1">{description}</p>
      )}
    </DashboardTile>
  );
}

/**
 * TileGroup - Container for grouping multiple tiles
 */
export interface TileGroupProps {
  children: ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

export function TileGroup({ children, className = "", gap = "md" }: TileGroupProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  return (
    <div className={`grid ${gapClasses[gap]} ${className}`}>{children}</div>
  );
}
