"use client";

import { ReactNode, forwardRef, useState, useCallback } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { IconButton } from "./ActionButton";

export interface DispatcherLayoutProps {
  /** Left sidebar content (incident/video list) */
  sidebar?: ReactNode;
  /** Main content area (map) */
  children: ReactNode;
  /** Right panel content (details) */
  details?: ReactNode;
  /** Header content */
  header?: ReactNode;
  /** Whether sidebar is visible */
  sidebarOpen?: boolean;
  /** Callback when sidebar visibility changes */
  onSidebarToggle?: (open: boolean) => void;
  /** Whether details panel is visible */
  detailsOpen?: boolean;
  /** Callback when details panel visibility changes */
  onDetailsToggle?: (open: boolean) => void;
  /** Custom sidebar width */
  sidebarWidth?: number;
  /** Custom details panel width */
  detailsWidth?: number;
  /** Additional className */
  className?: string;
}

/**
 * DispatcherLayout - 3-column grid layout for the command center
 *
 * Features:
 * - Modular tile/bento-box aesthetic
 * - Collapsible sidebar and details panels
 * - Responsive design with mobile bottom sheet
 * - Technical grid background
 */
export const DispatcherLayout = forwardRef<HTMLDivElement, DispatcherLayoutProps>(
  (
    {
      sidebar,
      children,
      details,
      header,
      sidebarOpen = true,
      onSidebarToggle,
      detailsOpen = true,
      onDetailsToggle,
      sidebarWidth = 320,
      detailsWidth = 400,
      className = "",
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          h-screen
          w-screen
          overflow-hidden
          bg-bg-primary
          bg-grid
          ${className}
        `}
      >
        {/* Optional Header */}
        {header && (
          <div className="h-14 border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-sm flex items-center px-4 z-50">
            {header}
          </div>
        )}

        {/* Main Grid */}
        <div
          className="flex h-full"
          style={{ height: header ? "calc(100vh - 56px)" : "100vh" }}
        >
          {/* Sidebar */}
          <div
            className={`
              relative
              h-full
              bg-bg-secondary
              border-r
              border-border-subtle
              flex-shrink-0
              transition-all
              duration-300
              ${sidebarOpen ? "" : "-ml-80 opacity-0 pointer-events-none"}
            `}
            style={{ width: sidebarOpen ? sidebarWidth : 0 }}
          >
            {/* Sidebar Toggle */}
            {onSidebarToggle && (
              <div className="absolute -right-10 top-4 z-20">
                <IconButton
                  icon={sidebarOpen ? PanelLeftClose : PanelLeftOpen}
                  label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                  onClick={() => onSidebarToggle(!sidebarOpen)}
                  variant="glass"
                />
              </div>
            )}

            {/* Sidebar Content */}
            <div className="h-full overflow-hidden flex flex-col">
              {sidebar}
            </div>
          </div>

          {/* Floating Toggle when Sidebar Closed */}
          {!sidebarOpen && onSidebarToggle && (
            <div className="absolute top-4 left-4 z-50">
              <IconButton
                icon={Menu}
                label="Open sidebar"
                onClick={() => onSidebarToggle(true)}
                variant="glass"
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 relative overflow-hidden bg-bg-tertiary">
            {children}
          </div>

          {/* Details Panel */}
          <div
            className={`
              relative
              h-full
              bg-bg-secondary
              border-l
              border-border-subtle
              flex-shrink-0
              transition-all
              duration-300
              ${detailsOpen && details ? "" : "w-0 opacity-0 pointer-events-none"}
            `}
            style={{ width: detailsOpen && details ? detailsWidth : 0 }}
          >
            {/* Details Toggle */}
            {onDetailsToggle && details && (
              <div className="absolute -left-10 top-4 z-20">
                <IconButton
                  icon={detailsOpen ? PanelRightClose : PanelRightOpen}
                  label={detailsOpen ? "Close details" : "Open details"}
                  onClick={() => onDetailsToggle(!detailsOpen)}
                  variant="glass"
                />
              </div>
            )}

            {/* Details Content */}
            <div className="h-full overflow-hidden flex flex-col">
              {details}
            </div>
          </div>

          {/* Floating Toggle when Details Closed */}
          {!detailsOpen && details && onDetailsToggle && (
            <div className="absolute top-4 right-4 z-50">
              <IconButton
                icon={PanelRightOpen}
                label="Open details"
                onClick={() => onDetailsToggle(true)}
                variant="glass"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

DispatcherLayout.displayName = "DispatcherLayout";

/**
 * LayoutHeader - Pre-styled header component for DispatcherLayout
 */
export interface LayoutHeaderProps {
  title?: string;
  subtitle?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

export function LayoutHeader({
  title = "Dispatch Center",
  subtitle,
  leftContent,
  rightContent,
  className = "",
}: LayoutHeaderProps) {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      <div className="flex items-center gap-4">
        {leftContent || (
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-status-active" />
            <div>
              <h1 className="text-text-primary font-semibold text-sm">{title}</h1>
              {subtitle && (
                <p className="text-text-muted text-[10px] font-mono">{subtitle}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
    </div>
  );
}

/**
 * Panel - Generic panel component for sidebar/details content
 */
export interface PanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Panel({
  children,
  title,
  subtitle,
  icon,
  actions,
  onClose,
  className = "",
}: PanelProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Panel Header */}
      {(title || onClose) && (
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {icon && <div className="text-text-tertiary">{icon}</div>}
            <div>
              {title && (
                <h2 className="text-text-primary font-medium text-sm">{title}</h2>
              )}
              {subtitle && (
                <p className="text-text-muted text-[10px] font-mono">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onClose && (
              <IconButton icon={X} label="Close" onClick={onClose} variant="ghost" />
            )}
          </div>
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

/**
 * PanelSection - Section within a panel
 */
export interface PanelSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function PanelSection({ children, title, className = "" }: PanelSectionProps) {
  return (
    <div className={`p-4 ${className}`}>
      {title && (
        <h3 className="text-text-tertiary text-[10px] font-mono uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * EmptyPanel - Placeholder for empty panel states
 */
export interface EmptyPanelProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyPanel({ icon, title, description }: EmptyPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {icon && <div className="text-text-muted mb-3">{icon}</div>}
      <p className="text-text-secondary text-sm font-medium">{title}</p>
      {description && (
        <p className="text-text-muted text-xs mt-1">{description}</p>
      )}
    </div>
  );
}
