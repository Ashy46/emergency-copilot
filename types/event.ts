export type EventScenario = "carAccident" | "fire" | "medical" | "unknown";

export interface Event {
  id: string;
  videoId: string;
  timestamp: number;
  lat: number;
  lng: number;
  scenario: EventScenario;
  data: JSON;
}
