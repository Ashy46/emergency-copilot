export interface Coordinates {
  lat: number;
  lng: number;
}

export interface FireEventData {
  vehicles: number;
  injuredCount: number;
  hazards: string[];
  weather: string;
  fireVisible: boolean;
  extras?: string;
}

export type EventType = "updateReport" | "newReport";

export type EventScenario = "carAccident" | "fire" | "medical" | "unknown";

export interface Event {
  id: string;
  timestamp: number;
  coords: Coordinates;
  type: EventType;
  scenario: EventScenario;
  data: FireEventData;
  bystanderReport: string;
}
