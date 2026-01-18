'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { RealtimeVision } from '@overshoot/sdk'
import { SignalDetectionConfig, SignalResult } from '@/types/signal'

const ANOMALY_DETECTION_PROMPT = `You are monitoring a CCTV feed for anomalies. Analyze this frame and determine if there is any unusual or concerning activity that warrants attention.

Respond with ONLY a JSON object:

{
  "anomalyDetected": <boolean - true if unusual/concerning activity detected>,
  "type": "<string - type of anomaly: 'violence', 'intrusion', 'accident', 'fire', 'medical', 'suspicious', 'none'>",
  "confidence": <number 0-1 - how confident you are in this detection>
}

Detect anomalies such as:
- Physical altercations or violence
- Unauthorized access or intrusion
- Accidents (falls, collisions, etc.)
- Fire or smoke
- Medical emergencies (person collapsed, etc.)
- Suspicious behavior (loitering, casing, etc.)

For normal activity (people walking, standing, talking normally), return anomalyDetected: false.

IMPORTANT: Be conservative - only flag true anomalies to avoid false positives.`

interface AnomalyResponse {
  anomalyDetected: boolean
  type: string
  confidence: number
}

export function useSignalDetection(config?: SignalDetectionConfig) {
  const [shouldStream, setShouldStream] = useState(false)
  const [lastSignal, setLastSignal] = useState<SignalResult | null>(null)
  const [vision, setVision] = useState<RealtimeVision | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  const lastTriggerRef = useRef<number>(0)
  const sensitivityThreshold = config?.sensitivityThreshold ?? 0.5
  const cooldownMs = config?.cooldownMs ?? 5000

  const startDetection = useCallback((videoSource: File) => {
    console.log('Starting signal detection...')
    setIsDetecting(true)
    setShouldStream(false)
    setLastSignal(null)

    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? ''

    const newVision = new RealtimeVision({
      apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
      apiKey: apiKey,
      prompt: ANOMALY_DETECTION_PROMPT,
      source: { type: 'video', file: videoSource },
      processing: {
        clip_length_seconds: 0.2,  // Short clips for faster detection
        delay_seconds: 0.2       // Low delay for real-time response
      },
      onResult: (result) => {
        try {
          const parsed: AnomalyResponse = JSON.parse(result.result)
          console.log('Signal detection result:', parsed)

          // Check if anomaly detected with sufficient confidence
          if (parsed.anomalyDetected && parsed.confidence >= sensitivityThreshold) {
            const now = Date.now()

            // Check cooldown to prevent rapid re-triggers
            if (now - lastTriggerRef.current >= cooldownMs) {
              lastTriggerRef.current = now

              const signalResult: SignalResult = {
                shouldStream: true,
                detectedAt: now,
                anomalyType: parsed.type,
                confidence: parsed.confidence
              }

              console.log('Anomaly detected! Triggering stream:', signalResult)
              setShouldStream(true)
              setLastSignal(signalResult)
            }
          }
        } catch (error) {
          console.error('Failed to parse signal detection result:', error)
        }
      },
      onError: (error: Error) => {
        console.error('Signal detection error:', error)
      }
    })

    if (typeof newVision.start === 'function') {
      newVision.start()
    }

    setVision(newVision)
    return newVision
  }, [sensitivityThreshold, cooldownMs])

  const stopDetection = useCallback(() => {
    console.log('Stopping signal detection...')
    if (vision && typeof vision.stop === 'function') {
      vision.stop()
    }
    setVision(null)
    setIsDetecting(false)
  }, [vision])

  const resetSignal = useCallback(() => {
    setShouldStream(false)
    setLastSignal(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vision && typeof vision.stop === 'function') {
        vision.stop()
      }
    }
  }, [vision])

  return {
    shouldStream,
    lastSignal,
    isDetecting,
    startDetection,
    stopDetection,
    resetSignal
  }
}
