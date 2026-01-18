export type SnapshotScenario = "carAccident" | "fire" | "medical" | "unknown";

export interface Snapshot {
  id: string;
  videoId: string;
  timestamp: number;
  lat: number;
  lng: number;
  scenario: SnapshotScenario;
  data: JSON;
}

// Event type used by dispatcher components for caller/incident tracking
export interface Event {
  id: string;
  videoId: string;
  incidentId: string;
  timestamp: number;
  lat: number;
  lng: number;
  scenario: SnapshotScenario;
  bystanderReport?: string;
  data?: Record<string, unknown>;
}
