import { useState, useEffect, useRef } from "react";
import type { Event } from "@/app/dispatcher/page";

type Incident = {
  incidentId: string;
  callers: string[];
  updatedAt: number;
};

export function usePlayback(eventHistory: Event[]) {
  const [playbackTime, setPlaybackTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [callersById, setCallersById] = useState<Record<string, Event>>({});
  const [incidentsById, setIncidentsById] = useState<Record<string, Incident>>({});

  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isLiveMode = playbackTime === null;
  const minTime = eventHistory.length > 0 ? eventHistory[0].timestamp : 0;
  const maxTime = eventHistory.length > 0 ? eventHistory[eventHistory.length - 1].timestamp : Date.now();
  const currentTime = playbackTime ?? maxTime;

  // Rebuild state from history up to a specific time
  const rebuildStateUpToTime = (targetTime: number) => {
    const eventsUpToTime = eventHistory.filter((e) => e.timestamp <= targetTime);

    const newCallersById: Record<string, Event> = {};
    const newIncidentsById: Record<string, Incident> = {};

    eventsUpToTime.forEach((event) => {
      // Update latest-per-caller
      newCallersById[event.id] = event;

      // Group by incident
      const existing = newIncidentsById[event.incidentId];
      const callers = existing?.callers || [];
      const updatedCallers = callers.includes(event.id)
        ? callers
        : [...callers, event.id];

      newIncidentsById[event.incidentId] = {
        incidentId: event.incidentId,
        callers: updatedCallers,
        updatedAt: Math.max(existing?.updatedAt || 0, event.timestamp),
      };
    });

    setCallersById(newCallersById);
    setIncidentsById(newIncidentsById);
  };

  const goToLive = () => {
    setPlaybackTime(null);
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    // Rebuild live state
    if (eventHistory.length > 0) {
      rebuildStateUpToTime(Date.now() + 1000000);
    }
  };

  const togglePlayback = () => {
    // If in live mode, start playback from beginning
    if (isLiveMode && eventHistory.length > 0) {
      setPlaybackTime(minTime);
      rebuildStateUpToTime(minTime);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleTimelineChange = (newTime: number) => {
    setPlaybackTime(newTime);
    setIsPlaying(false);
    rebuildStateUpToTime(newTime);
  };

  // Auto-playback effect
  useEffect(() => {
    if (isPlaying && playbackTime !== null && eventHistory.length > 0) {
      const minTime = eventHistory[0].timestamp;
      const maxTime = eventHistory[eventHistory.length - 1].timestamp;

      playbackIntervalRef.current = setInterval(() => {
        setPlaybackTime((current) => {
          if (current === null) return null;

          const increment = 1000 * playbackSpeed; // 1 second per tick * speed
          const nextTime = current + increment;

          if (nextTime >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }

          rebuildStateUpToTime(nextTime);
          return nextTime;
        });
      }, 100); // Update every 100ms

      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
          playbackIntervalRef.current = null;
        }
      };
    }
  }, [isPlaying, playbackSpeed, playbackTime, eventHistory]);

  // Update live state when new events come in (only in live mode)
  useEffect(() => {
    if (isLiveMode && eventHistory.length > 0) {
      const latestEvent = eventHistory[eventHistory.length - 1];

      setCallersById((prev) => ({
        ...prev,
        [latestEvent.id]: latestEvent,
      }));

      setIncidentsById((prev) => {
        const existing = prev[latestEvent.incidentId];
        const callers = existing?.callers || [];
        const updatedCallers = callers.includes(latestEvent.id)
          ? callers
          : [...callers, latestEvent.id];

        return {
          ...prev,
          [latestEvent.incidentId]: {
            incidentId: latestEvent.incidentId,
            callers: updatedCallers,
            updatedAt: Math.max(existing?.updatedAt || 0, latestEvent.timestamp),
          },
        };
      });
    }
  }, [eventHistory, isLiveMode]);

  return {
    playbackTime,
    isPlaying,
    playbackSpeed,
    playbackIntervalRef,
    callersById,
    incidentsById,
    isLiveMode,
    minTime,
    maxTime,
    currentTime,
    togglePlayback,
    goToLive,
    handleTimelineChange,
    setPlaybackSpeed,
    rebuildStateUpToTime,
  };
}
