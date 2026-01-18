import type { Incident, Video, IncidentStatus, VideoStatus } from "@/types/api";

// Marker types
export interface IncidentMarker {
  type: "incident";
  id: string;
  lat: number;
  lng: number;
  status: IncidentStatus;
  videoCount?: number;
}

export interface VideoMarker {
  type: "video";
  id: string;
  incidentId: string;
  lat: number;
  lng: number;
  status: VideoStatus;
  currentState?: string | null;
}

export type MapMarker = IncidentMarker | VideoMarker;

// Helper functions to convert API types to markers
export function incidentToMarker(incident: Incident, videoCount?: number): IncidentMarker {
  return {
    type: "incident",
    id: incident.id,
    lat: incident.lat,
    lng: incident.lng,
    status: incident.status,
    videoCount,
  };
}

export function videoToMarker(video: Video): VideoMarker {
  return {
    type: "video",
    id: video.id,
    incidentId: video.incidentId,
    lat: video.lat,
    lng: video.lng,
    status: video.status,
    currentState: video.currentState,
  };
}
