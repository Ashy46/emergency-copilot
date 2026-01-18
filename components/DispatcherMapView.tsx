"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CallerLocation {
  callerId: string;
  coords: { lat: number; lng: number };
  accuracy?: number;
  scenario: "carAccident" | "fire" | "medical" | "unknown";
  timestamp: number;
}

// Also support flat lat/lng for Event compatibility
interface CallerLocationFlat {
  callerId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  scenario: "carAccident" | "fire" | "medical" | "unknown";
  timestamp: number;
}

type CallerLocationInput = CallerLocation | CallerLocationFlat;

interface DispatcherMapViewProps {
  callers: CallerLocationInput[];
  selectedCallerId: string | null;
  onSelectCaller: (callerId: string) => void;
  recenterTrigger?: number;
}

// Fix default marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Create custom colored icons for different scenarios
const createScenarioIcon = (scenario: string, isSelected: boolean) => {
  const colorMap: Record<string, string> = {
    carAccident: "#ef4444", // red
    fire: "#f97316", // orange
    medical: "#3b82f6", // blue
    unknown: "#6b7280", // gray
  };

  const color = colorMap[scenario] || colorMap.unknown;
  const size = isSelected ? 40 : 30;

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size === 40 ? '18px' : '14px'};
        ${isSelected ? 'animation: pulse 2s infinite;' : ''}
      ">
        ${scenario === 'carAccident' ? '🚗' : scenario === 'fire' ? '🔥' : scenario === 'medical' ? '⚕️' : '❓'}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapController({ callers, recenterTrigger }: { callers: CallerLocationInput[]; recenterTrigger?: number }) {
  const map = useMap();

  useEffect(() => {
    if (callers.length > 0 && recenterTrigger) {
      // Fit bounds to show all callers
      const bounds = L.latLngBounds(
        callers.map(c => {
          // Handle both nested and flat structures
          const lat = 'coords' in c ? c.coords.lat : c.lat;
          const lng = 'coords' in c ? c.coords.lng : c.lng;
          return [lat, lng];
        })
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [recenterTrigger, callers, map]);

  return null;
}

export default function DispatcherMapView({
  callers,
  selectedCallerId,
  onSelectCaller,
  recenterTrigger,
}: DispatcherMapViewProps) {
  const defaultCenter: [number, number] = [41.79012, -87.60045];

  // Calculate center from callers or use default
  const center: [number, number] =
    callers.length > 0
      ? 'coords' in callers[0]
        ? [callers[0].coords.lat, callers[0].coords.lng]
        : [callers[0].lat, callers[0].lng]
      : defaultCenter;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const scenarioLabels = {
    carAccident: "Car Accident",
    fire: "Fire",
    medical: "Medical",
    unknown: "Unknown",
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {callers.map((caller) => {
        const isSelected = caller.callerId === selectedCallerId;
        // Handle both nested and flat structures
        const lat = 'coords' in caller ? caller.coords.lat : caller.lat;
        const lng = 'coords' in caller ? caller.coords.lng : caller.lng;

        return (
          <div key={caller.callerId}>
            <Marker
              position={[lat, lng]}
              icon={createScenarioIcon(caller.scenario, isSelected)}
              eventHandlers={{
                click: () => onSelectCaller(caller.callerId),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-1">{caller.callerId}</div>
                  <div className="text-gray-600">
                    {scenarioLabels[caller.scenario]}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(caller.timestamp)}
                  </div>
                </div>
              </Popup>
            </Marker>
            {caller.accuracy && (
              <Circle
                center={[lat, lng]}
                radius={caller.accuracy}
                pathOptions={{
                  fillColor: isSelected ? "#3b82f6" : "#6b7280",
                  fillOpacity: 0.1,
                  color: isSelected ? "#3b82f6" : "#6b7280",
                  weight: 1,
                }}
              />
            )}
          </div>
        );
      })}
      <MapController callers={callers} recenterTrigger={recenterTrigger} />
    </MapContainer>
  );
}
