'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseSnapshotWebSocketProps {
  videoId: string
  lat: number
  lng: number
  onConnected?: () => void
  onError?: (error: string) => void
  onInitialized?: (data: { videoId: string; incidentId: string; isNewVideo: boolean }) => void
}

export function useSnapshotWebSocket({
  videoId,
  lat,
  lng,
  onConnected,
  onError,
  onInitialized
}: UseSnapshotWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [incidentId, setIncidentId] = useState<string | null>(null)

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:8080'
    const ws = new WebSocket(`${wsUrl}/ws/snapshots`)

    ws.onopen = () => {
      console.log('📡 WebSocket connected to /ws/snapshots')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📨 WebSocket message:', message)

        switch (message.type) {
          case 'connected':
            console.log('✅ Server ready, sending init...')
            onConnected?.()
            // Send init message
            sendInit(ws)
            break

          case 'initialized':
            console.log('✅ Session initialized:', message)
            setIsInitialized(true)
            setIncidentId(message.incidentId)
            onInitialized?.(message)
            break

          case 'snapshot_ack':
            console.log('✅ Snapshot acknowledged:', message.snapshotId)
            break

          case 'error':
            console.error('❌ WebSocket error:', message.message)
            onError?.(message.message)
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
    }

    ws.onclose = () => {
      console.log('📡 WebSocket disconnected')
      setIsConnected(false)
      setIsInitialized(false)
    }

    wsRef.current = ws
  }, [videoId, lat, lng, onConnected, onError, onInitialized])

  const sendInit = useCallback((ws: WebSocket) => {
    const initMessage = {
      type: 'init',
      videoId,
      lat,
      lng
    }
    console.log('📤 Sending init:', initMessage)
    ws.send(JSON.stringify(initMessage))
  }, [videoId, lat, lng])

  const sendSnapshot = useCallback((scenario: string, data: any) => {
    if (!wsRef.current || !isInitialized) {
      console.warn('Cannot send snapshot: WebSocket not initialized')
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
  }, [isInitialized])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      console.log('📡 Closing WebSocket connection...')
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  return {
    connect,
    disconnect,
    sendSnapshot,
    isConnected,
    isInitialized,
    incidentId
  }
}
