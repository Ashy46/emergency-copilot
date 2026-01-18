// API Types based on Emergency Copilot API

// === Incident ===
export type IncidentStatus = "active" | "resolved" | "archived";

export interface Incident {
  id: string;
  status: IncidentStatus;
  lat: number;
  lng: number;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentWithDetails extends Incident {
  videos: Video[];
  snapshotCount: number;
  timelineEventCount: number;
}

// === Video ===
export type VideoStatus = "live" | "ended" | "recorded";

export interface Video {
  id: string;
  incidentId: string;
  status: VideoStatus;
  currentState: string | null; // AI summary of current situation for this video stream
  videoUrl: string | null;
  lat: number;
  lng: number;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// === Timeline Event ===
export interface TimelineEvent {
  id: string;
  videoId: string;
  timestamp: string;
  description: string;
  fromState: Record<string, unknown>;
  toState: Record<string, unknown>;
  confidence: number;
  sourceSnapshots: string[];
  createdAt: string;
}

// === Snapshot ===
export interface Snapshot {
  id: string;
  videoId: string;
  timestamp: string;
  lat: number;
  lng: number;
  type: string;
  scenario: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// === SSE Events ===
export interface SSEConnectedEvent {
  clientId: string;
  timestamp: string;
}

export interface SSENewVideoEvent {
  videoId: string;
  incidentId: string;
  lat: number;
  lng: number;
  status: VideoStatus;
  timestamp: string;
}

export interface SSESnapshotReceivedEvent {
  videoId: string;
  snapshot: Snapshot;
  timestamp: string;
}

export interface SSETimelineEventEvent {
  videoId: string;
  event: TimelineEvent;
  timestamp: string;
}

export interface SSEStateUpdatedEvent {
  videoId: string;
  incidentId: string;
  state: string;
  timestamp: string;
}

export interface SSEVideoStatusChangedEvent {
  videoId: string;
  status: VideoStatus;
  videoUrl?: string;
  timestamp: string;
}

// === API Response Types ===
export interface SnapshotPostResponse {
  snapshotId: string;
  incidentId: string;
  videoId: string;
  isNewVideo: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  activeSSEClients: number;
  activeWebSocketSessions: number;
}

export interface ErrorResponse {
  error: string;
}
