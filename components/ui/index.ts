/**
 * Emergency Copilot v2 UI Component Library
 *
 * AIP Operations Center Aesthetic
 * - Dark, technical command-center look
 * - Thin borders with muted neon gradient accents
 * - Modular bento-box tile layout
 */

// Base Containers
export {
  DashboardTile,
  EmptyTile,
  TileGroup,
  type DashboardTileProps,
  type EmptyTileProps,
  type TileGroupProps,
} from "./DashboardTile";

// Video Components
export {
  LiveVideoFeed,
  VideoFeedPlaceholder,
  VideoFeedGrid,
  type LiveVideoFeedProps,
  type VideoFeedPlaceholderProps,
  type VideoFeedGridProps,
} from "./LiveVideoFeed";

// Timeline Components
export {
  TimelineEvent,
  Timeline,
  TimelineHeader,
  type TimelineEventProps,
  type TimelineEventData,
  type TimelineProps,
  type TimelineHeaderProps,
} from "./TimelineEvent";

// Map Markers
export {
  createMarkerIcon,
  getMarkerIcon,
  MarkerIcons,
  MarkerLegend,
  type MarkerConfig,
  type MarkerType,
  type MarkerStatus,
  type ScenarioType,
} from "./IncidentMarker";

// Status Indicators
export {
  SignalStatusBadge,
  DetectionStatus,
  SignalMeter,
  type SignalStatusBadgeProps,
  type DetectionStatusProps,
  type SignalMeterProps,
} from "./SignalStatusBadge";

// Buttons
export {
  ActionButton,
  ButtonGroup,
  IconButton,
  ResolveButton,
  EscalateButton,
  DispatchButton,
  type ActionButtonProps,
  type ButtonGroupProps,
  type IconButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "./ActionButton";

// Layout Components
export {
  DispatcherLayout,
  LayoutHeader,
  Panel,
  PanelSection,
  EmptyPanel,
  type DispatcherLayoutProps,
  type LayoutHeaderProps,
  type PanelProps,
  type PanelSectionProps,
  type EmptyPanelProps,
} from "./DispatcherLayout";
