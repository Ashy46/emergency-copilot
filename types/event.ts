export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WeaponStatus {
  present: boolean;    // seen or clearly indicated
  used: boolean;       // actually used (shots fired, swung, brandished aggressively)
}

export interface WeaponsStatus {
  firearm: WeaponStatus;
  knife: WeaponStatus;
  bluntObject: WeaponStatus;      // bat, pipe, bottle
  explosive: WeaponStatus;
  vehicleAsWeapon: WeaponStatus;  // ramming
  other?: WeaponStatus;           // caller-described “other weapon”
}


export interface ConfrontationEventData {
  participantsCount: number | null;          // total visible people involved
  injuredCount: number;                      // visible injuries
  weapons: WeaponsStatus;                    // see below
  aggressionLevel: "verbal" | "physical" | "armed" | "unknown";
}

export type EventType = "updateReport" | "newReport";

export type EventScenario = "carAccident" | "fire" | "medical" | "unknown";

export interface Event {
  id: string;
  callerId: string;
  timestamp: number;
  coords: Coordinates;
  type: EventType;
  scenario: EventScenario;
  data: ConfrontationEventData;
  bystanderReport: string;
}
