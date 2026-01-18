'use client'

import { useRef, useCallback, useState } from 'react'

interface UseSnapshotWebSocketProps {
  onConnected?: () => void
  onError?: (error: string) => void
  onInitialized?: (data: { videoId: string; incidentId: string; isNewVideo: boolean }) => void
}

export function useSnapshotWebSocket({
  onConnected,
  onError,
  onInitialized
}: UseSnapshotWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [incidentId, setIncidentId] = useState<string | null>(null)
  
  // Use ref for isInitialized to avoid stale closure in sendSnapshot
  const isInitializedRef = useRef(false)
  const isConnectedRef = useRef(false)
  
  // Store resolve functions for promises
  const connectResolveRef = useRef<(() => void) | null>(null)
  const connectRejectRef = useRef<((reason: Error) => void) | null>(null)
  const initResolveRef = useRef<((value: { incidentId: string }) => void) | null>(null)
  const initRejectRef = useRef<((reason: Error) => void) | null>(null)

  // Step 1: Just establish WebSocket connection (no init message)
  // Returns a promise that resolves when connection is ready
  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      connectResolveRef.current = resolve
      connectRejectRef.current = reject
      
      const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:8080'
      console.log('📡 Establishing WebSocket connection to', wsUrl)
      const ws = new WebSocket(`${wsUrl}/ws/snapshots`)

      ws.onopen = () => {
        console.log('📡 WebSocket TCP connected to /ws/snapshots')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 WebSocket message:', message)

          switch (message.type) {
            case 'connected':
              console.log('✅ Server ready (connection preempted, waiting for init)')
              isConnectedRef.current = true
              onConnected?.()
              // Resolve the connect promise - but DON'T send init yet
              connectResolveRef.current?.()
              break

            case 'initialized':
              console.log('✅ Session initialized:', message)
              isInitializedRef.current = true
              setIsInitialized(true)
              setIncidentId(message.incidentId)
              onInitialized?.(message)
              // Resolve the initialize promise
              initResolveRef.current?.({ incidentId: message.incidentId })
              break

            case 'snapshot_ack':
              console.log('✅ Snapshot acknowledged:', message.snapshotId)
              break

            case 'error':
              console.error('❌ WebSocket error:', message.message)
              onError?.(message.message)
              connectRejectRef.current?.(new Error(message.message))
              initRejectRef.current?.(new Error(message.message))
              break

            default:
              console.log('Unknown message type:', message.type)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        onError?.('WebSocket connection error')
        connectRejectRef.current?.(new Error('WebSocket connection error'))
        initRejectRef.current?.(new Error('WebSocket connection error'))
      }

      ws.onclose = () => {
        console.log('📡 WebSocket disconnected')
        isConnectedRef.current = false
        isInitializedRef.current = false
        setIsConnected(false)
        setIsInitialized(false)
      }

      wsRef.current = ws
    })
  }, [onConnected, onError, onInitialized])

  // Step 2: Send init message to create incident/video (call after anomaly detected)
  // Returns a promise that resolves when initialized with incidentId
  // filename is used by backend to set videoUrl for replay (e.g., "/videos/pov1.mov")
  const initialize = useCallback((videoId: string, lat: number, lng: number, filename?: string): Promise<{ incidentId: string }> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || !isConnectedRef.current) {
        reject(new Error('WebSocket not connected - call connect() first'))
        return
      }

      initResolveRef.current = resolve
      initRejectRef.current = reject

      const initMessage = { type: 'init', videoId, lat, lng, filename }
      console.log('📤 Sending init (creating incident/video):', initMessage)
      wsRef.current.send(JSON.stringify(initMessage))
    })
  }, [])

  const sendSnapshot = useCallback((scenario: string, data: Record<string, unknown>) => {
    if (!wsRef.current || !isInitializedRef.current) {
      console.warn('Cannot send snapshot: WebSocket not initialized', {
        hasWs: !!wsRef.current,
        isInitialized: isInitializedRef.current
      })
      return
    }

    const snapshotMessage = {
      type: 'snapshot',
      scenario,
      timestamp: new Date().toISOString(),
      data
    }

    console.log('📤 Sending snapshot:', snapshotMessage)
    wsRef.current.send(JSON.stringify(snapshotMessage))
  }, []) // No dependencies - uses refs

  // Notify backend that video has ended (for replay functionality)
  const sendVideoEnded = useCallback(() => {
    if (!wsRef.current || !isInitializedRef.current) {
      console.warn('Cannot send videoEnded: WebSocket not initialized')
      return
    }

    const endMessage = {
      type: 'videoEnded',
      timestamp: new Date().toISOString()
    }

    console.log('📤 Sending videoEnded:', endMessage)
    wsRef.current.send(JSON.stringify(endMessage))
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('📡 Closing WebSocket connection...')
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  return {
    connect,
    initialize,
    disconnect,
    sendSnapshot,
    sendVideoEnded,
    isConnected,
    isInitialized,
    incidentId
  }
}
