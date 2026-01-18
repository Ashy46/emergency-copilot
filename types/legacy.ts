/**
 * Legacy types for unused dispatcher components
 * These components reference an old Event type that no longer exists
 * This file provides type definitions to maintain build compatibility
 */

import type { scenarioColors } from "@/lib/constants";

export type ScenarioKey = keyof typeof scenarioColors;

export interface LegacyEvent {
  id: string;
  timestamp: number;
  scenario: ScenarioKey;
  lat: number;
  lng: number;
  videoId: string;
  incidentId: string;
  bystanderReport?: string;
  data?: Record<string, unknown>;
}
