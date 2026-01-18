"use client";

import { useState, useRef } from "react";

export interface LocationData {
  latitude: number;
  longitude: number;
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const enableLocation = () => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    watchIdRef.current = watchId;
  };

  const stopLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocation(null);
  };

  return {
    location,
    enableLocation,
    stopLocation,
  };
}
