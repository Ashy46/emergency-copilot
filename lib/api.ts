import type {
  Incident,
  IncidentWithDetails,
  Video,
  TimelineEvent,
  Snapshot,
  IncidentStatus,
  VideoStatus,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// === Helper ===
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// === Incidents ===
export async function getIncidents(params?: {
  status?: IncidentStatus;
  limit?: number;
}): Promise<Incident[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return fetchJSON<Incident[]>(`${API_URL}/incidents${query ? `?${query}` : ""}`);
}

export async function getIncident(id: string): Promise<IncidentWithDetails> {
  return fetchJSON<IncidentWithDetails>(`${API_URL}/incidents/${id}`);
}

export async function getIncidentTimeline(id: string): Promise<TimelineEvent[]> {
  return fetchJSON<TimelineEvent[]>(`${API_URL}/incidents/${id}/timeline`);
}

export async function getIncidentSnapshots(
  id: string,
  params?: { limit?: number }
): Promise<Snapshot[]> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return fetchJSON<Snapshot[]>(`${API_URL}/incidents/${id}/snapshots${query ? `?${query}` : ""}`);
}

// === Videos ===
export async function getVideos(params?: {
  status?: VideoStatus;
  incidentId?: string;
  limit?: number;
}): Promise<Video[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.incidentId) searchParams.set("incidentId", params.incidentId);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return fetchJSON<Video[]>(`${API_URL}/videos${query ? `?${query}` : ""}`);
}

export async function getVideo(id: string): Promise<Video> {
  return fetchJSON<Video>(`${API_URL}/videos/${id}`);
}

export async function getVideoTimeline(id: string): Promise<TimelineEvent[]> {
  return fetchJSON<TimelineEvent[]>(`${API_URL}/videos/${id}/timeline`);
}

export async function updateVideo(
  id: string,
  data: { status?: VideoStatus; videoUrl?: string }
): Promise<Video> {
  return fetchJSON<Video>(`${API_URL}/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// === Snapshots ===
export async function getSnapshots(params?: {
  videoId?: string;
  incidentId?: string;
  limit?: number;
}): Promise<Snapshot[]> {
  const searchParams = new URLSearchParams();
  if (params?.videoId) searchParams.set("videoId", params.videoId);
  if (params?.incidentId) searchParams.set("incidentId", params.incidentId);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return fetchJSON<Snapshot[]>(`${API_URL}/snapshots${query ? `?${query}` : ""}`);
}

export async function getSnapshot(id: string): Promise<Snapshot> {
  return fetchJSON<Snapshot>(`${API_URL}/snapshots/${id}`);
}

export async function postSnapshot(data: {
  videoId: string;
  timestamp?: string;
  lat: number;
  lng: number;
  type: string;
  scenario: string;
  data?: Record<string, unknown>;
}): Promise<{ snapshotId: string; incidentId: string; videoId: string; isNewVideo: boolean }> {
  return fetchJSON(`${API_URL}/snapshots`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// === SSE URL ===
export function getSSEUrl(clientId?: string): string {
  const params = clientId ? `?clientId=${encodeURIComponent(clientId)}` : "";
  return `${API_URL}/stream${params}`;
}
