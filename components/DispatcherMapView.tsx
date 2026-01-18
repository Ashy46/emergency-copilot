"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { IncidentStatus, VideoStatus } from "@/types/api";
import type { MapMarker } from "@/lib/mapHelpers";

interface DispatcherMapViewProps {
  markers: MapMarker[];
  selectedMarkerId: string | null;
  selectedMarkerType: "incident" | "video" | null;
  onSelectMarker: (id: string, type: "incident" | "video") => void;
  recenterTrigger?: number;
}

// Fix default marker icon paths
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create incident marker icon
const createIncidentIcon = (status: IncidentStatus, isSelected: boolean) => {
  const colorMap: Record<IncidentStatus, string> = {
    active: "#dc2626", // red-600
    resolved: "#16a34a", // green-600
    archived: "#6b7280", // gray-500
  };

  const color = colorMap[status];
  const size = isSelected ? 44 : 36;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 8px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Create video marker icon
const createVideoIcon = (status: VideoStatus, isSelected: boolean) => {
  const colorMap: Record<VideoStatus, string> = {
    live: "#dc2626", // red-600
    ended: "#6b7280", // gray-500
    recorded: "#16a34a", // green-600
  };

  const color = colorMap[status];
  const size = isSelected ? 36 : 28;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
        ${status === 'live' ? 'animation: livePulse 1.5s infinite;' : ''}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes livePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
        }
      </style>
    `,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapController({ markers, recenterTrigger }: { markers: MapMarker[]; recenterTrigger?: number }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0 && recenterTrigger) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [recenterTrigger, markers, map]);

  return null;
}

export default function DispatcherMapView({
  markers,
  selectedMarkerId,
  selectedMarkerType,
  onSelectMarker,
  recenterTrigger,
}: DispatcherMapViewProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194]; // San Francisco

  // Calculate center from markers or use default
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : defaultCenter;

  const incidentStatusLabels: Record<IncidentStatus, string> = {
    active: "Active",
    resolved: "Resolved",
    archived: "Archived",
  };

  const videoStatusLabels: Record<VideoStatus, string> = {
    live: "Live",
    ended: "Ended",
    recorded: "Recorded",
  };

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      />
      {markers.map((marker) => {
        const isSelected = selectedMarkerId === marker.id && selectedMarkerType === marker.type;

        if (marker.type === "incident") {
          return (
            <Marker
              key={`incident-${marker.id}`}
              position={[marker.lat, marker.lng]}
              icon={createIncidentIcon(marker.status, isSelected)}
              eventHandlers={{
                click: () => onSelectMarker(marker.id, "incident"),
              }}
              zIndexOffset={isSelected ? 1000 : marker.status === "active" ? 500 : 0}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="font-bold mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Incident
                  </div>
                  <div className="text-gray-600 text-xs mb-1">
                    {incidentStatusLabels[marker.status]}
                    {marker.videoCount !== undefined && ` • ${marker.videoCount} video${marker.videoCount !== 1 ? "s" : ""}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{marker.id.slice(0, 8)}...</div>
                </div>
              </Popup>
            </Marker>
          );
        } else {
          return (
            <Marker
              key={`video-${marker.id}`}
              position={[marker.lat, marker.lng]}
              icon={createVideoIcon(marker.status, isSelected)}
              eventHandlers={{
                click: () => onSelectMarker(marker.id, "video"),
              }}
              zIndexOffset={isSelected ? 1000 : marker.status === "live" ? 400 : 0}
            >
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <div className="font-bold mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video
                  </div>
                  <div className="text-gray-600 text-xs mb-1">{videoStatusLabels[marker.status]}</div>
                  {marker.currentState && (
                    <p className="text-xs text-gray-700 line-clamp-2 mt-1">{marker.currentState}</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1 font-mono">{marker.id.slice(0, 8)}...</div>
                </div>
              </Popup>
            </Marker>
          );
        }
      })}
      <MapController markers={markers} recenterTrigger={recenterTrigger} />
    </MapContainer>
  );
}
