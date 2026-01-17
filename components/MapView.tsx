"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface MapViewProps {
  location: LocationData | null;
  recenterTrigger?: number;
}

// Fix default marker icon paths for webpack/bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapController({ location, recenterTrigger }: MapViewProps) {
  const map = useMap();

  useEffect(() => {
    if (location && recenterTrigger) {
      map.setView([location.latitude, location.longitude], 16, {
        animate: true,
      });
    }
  }, [recenterTrigger, location, map]);

  return null;
}

export default function MapView({ location, recenterTrigger }: MapViewProps) {
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const center: [number, number] = location
    ? [location.latitude, location.longitude]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={location ? 16 : 13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {location && (
        <>
          <Marker position={[location.latitude, location.longitude]} />
          <Circle
            center={[location.latitude, location.longitude]}
            radius={location.accuracy}
            pathOptions={{
              fillColor: "blue",
              fillOpacity: 0.2,
              color: "blue",
              weight: 2,
            }}
          />
        </>
      )}
      <MapController location={location} recenterTrigger={recenterTrigger} />
    </MapContainer>
  );
}
