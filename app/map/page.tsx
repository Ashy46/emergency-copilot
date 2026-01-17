"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
});

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

type LocationStatus = "idle" | "requesting" | "active" | "error";

export default function MapPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  const enableLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported by your browser");
      return;
    }

    setStatus("requesting");
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    };

    const successCallback = (position: GeolocationPosition) => {
      const newLocation: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      };
      setLocation(newLocation);
      setStatus("active");
      setError(null);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setStatus("error");
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError("Location permission denied");
          break;
        case error.POSITION_UNAVAILABLE:
          setError("Location unavailable");
          break;
        case error.TIMEOUT:
          setError("Location request timed out");
          break;
        default:
          setError("Unknown error occurred");
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
    watchIdRef.current = watchId;
  };

  const stopLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
    setLocation(null);
    setError(null);
  };

  const recenter = () => {
    setRecenterTrigger((prev) => prev + 1);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const isLowAccuracy = location && location.accuracy > 50;

  return (
    <main className="h-screen w-screen relative">
      <MapView location={location} recenterTrigger={recenterTrigger} />

      {/* Control Panel */}
      <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-md">
        {/* Status Line */}
        <div className="mb-3">
          {status === "idle" && (
            <p className="text-gray-600">Ready to enable location</p>
          )}
          {status === "requesting" && (
            <p className="text-blue-600">Requesting permission...</p>
          )}
          {status === "active" && location && (
            <p className="text-green-600">
              Location active (accuracy ~{Math.round(location.accuracy)}m)
            </p>
          )}
          {status === "error" && error && (
            <p className="text-red-600">{error}</p>
          )}
        </div>

        {/* Low Accuracy Warning */}
        {isLowAccuracy && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            Low accuracy — try moving outdoors for better precision
          </div>
        )}

        {/* Location Data */}
        {location && (
          <div className="mb-3 p-3 bg-gray-50 rounded text-sm font-mono space-y-1">
            <div>Lat: {location.latitude.toFixed(6)}</div>
            <div>Lng: {location.longitude.toFixed(6)}</div>
            <div>Accuracy: {Math.round(location.accuracy)}m</div>
            <div className="text-xs text-gray-500">
              Updated: {formatTimestamp(location.timestamp)}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {status !== "active" ? (
            <button
              onClick={enableLocation}
              disabled={status === "requesting"}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {status === "requesting" ? "Locating..." : "Enable Location"}
            </button>
          ) : (
            <>
              <button
                onClick={stopLocation}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium"
              >
                Stop Location
              </button>
              <button
                onClick={recenter}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Recenter
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
