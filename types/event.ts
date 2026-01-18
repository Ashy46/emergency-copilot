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
