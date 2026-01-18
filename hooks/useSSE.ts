"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getSSEUrl } from "@/lib/api";
import type {
  SSEConnectedEvent,
  SSENewVideoEvent,
  SSESnapshotReceivedEvent,
  SSETimelineEventEvent,
  SSEStateUpdatedEvent,
  SSEVideoStatusChangedEvent,
} from "@/types/api";

export type SSEConnectionState = "connecting" | "connected" | "disconnected" | "error";

export interface SSEEventHandlers {
  onConnected?: (data: SSEConnectedEvent) => void;
  onNewVideo?: (data: SSENewVideoEvent) => void;
  onSnapshotReceived?: (data: SSESnapshotReceivedEvent) => void;
  onTimelineEvent?: (data: SSETimelineEventEvent) => void;
  onStateUpdated?: (data: SSEStateUpdatedEvent) => void;
  onVideoStatusChanged?: (data: SSEVideoStatusChangedEvent) => void;
}

interface UseSSEOptions {
  clientId?: string;
  autoConnect?: boolean;
  handlers: SSEEventHandlers;
}

export function useSSE({ clientId, autoConnect = true, handlers }: UseSSEOptions) {
  const [connectionState, setConnectionState] = useState<SSEConnectionState>("disconnected");
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef(handlers);
  const isConnectingRef = useRef(false);
  const clientIdRef = useRef(clientId);

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnectionState("disconnected");
    }
  }, []);

  const connect = useCallback(() => {
    // Don't reconnect if already connected or connecting
    if (eventSourceRef.current?.readyState === EventSource.OPEN || isConnectingRef.current) {
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectingRef.current = true;
    setConnectionState("connecting");

    const url = getSSEUrl(clientIdRef.current);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      isConnectingRef.current = false;
      setConnectionState("connected");
    };

    eventSource.onerror = () => {
      isConnectingRef.current = false;
      setConnectionState("error");
      // EventSource will auto-reconnect
    };

    // Handle specific events
    eventSource.addEventListener("connected", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEConnectedEvent;
        handlersRef.current.onConnected?.(data);
      } catch (err) {
        console.error("Failed to parse connected event:", err);
      }
    });

    eventSource.addEventListener("newVideo", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSENewVideoEvent;
        handlersRef.current.onNewVideo?.(data);
      } catch (err) {
        console.error("Failed to parse newVideo event:", err);
      }
    });

    eventSource.addEventListener("snapshotReceived", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSESnapshotReceivedEvent;
        handlersRef.current.onSnapshotReceived?.(data);
      } catch (err) {
        console.error("Failed to parse snapshotReceived event:", err);
      }
    });

    eventSource.addEventListener("timelineEvent", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSETimelineEventEvent;
        handlersRef.current.onTimelineEvent?.(data);
      } catch (err) {
        console.error("Failed to parse timelineEvent event:", err);
      }
    });

    eventSource.addEventListener("stateUpdated", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEStateUpdatedEvent;
        handlersRef.current.onStateUpdated?.(data);
      } catch (err) {
        console.error("Failed to parse stateUpdated event:", err);
      }
    });

    eventSource.addEventListener("videoStatusChanged", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as SSEVideoStatusChangedEvent;
        handlersRef.current.onVideoStatusChanged?.(data);
      } catch (err) {
        console.error("Failed to parse videoStatusChanged event:", err);
      }
    });
  }, []);

  // Auto-connect on mount only
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Also close on page unload (refresh, close tab, navigate away)
    const handleBeforeUnload = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
  };
}
