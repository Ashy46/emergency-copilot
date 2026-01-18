'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { RealtimeVision } from '@overshoot/sdk'
import { SignalDetectionConfig, SignalResult } from '@/types/signal'

const ANOMALY_DETECTION_PROMPT = `You are monitoring a security feed for threats and dangerous situations. Analyze this frame and determine if there is any threatening or dangerous activity.

Respond with ONLY a JSON object:

{
  "anomalyDetected": <boolean - true if threat/danger detected>,
  "type": "<string - type of threat: 'weapon', 'violence', 'intrusion', 'accident', 'fire', 'medical', 'suspicious', 'none'>",
  "confidence": <number 0-1 - how confident you are in this detection>
}

CRITICAL THREATS (ALWAYS flag with high confidence):
- Weapons: Guns, knives, bats, or any objects being wielded as weapons
- Weapon-like postures: People holding objects in threatening manner
- Military/tactical gear: Body armor, tactical vests, military uniforms, helmets
- Threatening body language: Combat stances, aggressive postures, pointing weapons
- Physical violence: Fighting, attacking, hitting, kicking
- Dangerous materials: Explosives, suspicious packages, chemical containers, fire
- Armed intrusion: Forced entry, breaking windows/doors while armed
- Active shooter indicators: Person with firearm in public space, aiming at people

MODERATE THREATS (flag if confidence > 0.6):
- Suspicious behavior: Loitering with bags, casing areas, covering face unnaturally
- Crowd panic: People running, screaming, scattering in fear
- Medical emergencies: Person collapsed, visible injury, distress signals
- Fire/smoke: Any visible flames or smoke
- Vehicle accidents: Collisions, vehicles in dangerous positions
- Trespassing: Unauthorized access, climbing fences

NORMAL ACTIVITY (DO NOT flag):
- People walking, standing, talking calmly
- Normal work attire or casual clothing
- Regular business activities
- Children playing
- Normal traffic flow
- Construction workers with tools (unless threatening behavior)
- Security guards in uniform doing rounds

IMPORTANT: 
- Be HIGHLY sensitive to weapons and military gear
- Combat stances and aggressive postures are RED FLAGS
- If someone looks like they're holding a gun-like object, FLAG IT
- Tactical gear + weapon-like object = IMMEDIATE FLAG
- Better to flag a potential threat than miss a real one`

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

  // Pure refs - no state, no re-renders
  const lastTriggerRef = useRef<number>(0)
  const signalCountRef = useRef<number>(0)
  const thresholdReachedRef = useRef<boolean>(false)
  const currentVideoFileRef = useRef<File | null>(null)
  
  const sensitivityThreshold = config?.sensitivityThreshold ?? 0.5
  const cooldownMs = config?.cooldownMs ?? 5000
  const signalThreshold = config?.signalThreshold ?? 3
  const onTransition = config?.onTransition

  const startDetection = useCallback((videoSource: File) => {
    console.log('Starting signal detection...')
    setIsDetecting(true)
    setShouldStream(false)
    setLastSignal(null)
    signalCountRef.current = 0
    thresholdReachedRef.current = false
    currentVideoFileRef.current = videoSource // Store the video file

    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? ''

    const newVision = new RealtimeVision({
      apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
      apiKey: apiKey,
      prompt: ANOMALY_DETECTION_PROMPT,
      source: { type: 'video', file: videoSource },
      processing: {
        clip_length_seconds: 1.0,  // Short clips for faster detection
        delay_seconds: 0.5       // Low delay for real-time response
      },
      onResult: (result: any) => {
        try {
          // Handle the result structure from Overshoot
          let parsed: AnomalyResponse
          
          if (result?.ok && result?.result) {
            // Clean up markdown if present
            let cleanResult = result.result.trim()
            cleanResult = cleanResult.replace(/^```(?:json)?\s*/g, '').replace(/\s*```$/g, '')
            cleanResult = cleanResult.trim()
            
            parsed = JSON.parse(cleanResult)
          } else if (typeof result === 'string') {
            parsed = JSON.parse(result)
          } else {
            parsed = result
          }
          
          console.log('Signal detection parsed:', parsed)

          // Check if anomaly detected with sufficient confidence
          if (parsed.anomalyDetected && parsed.confidence >= sensitivityThreshold) {
            const now = Date.now()
            
            // Increment signal count immediately - no cooldown!
            signalCountRef.current++
            console.log(`Signal count: ${signalCountRef.current}/${signalThreshold}`)

            const signalResult: SignalResult = {
              shouldStream: true,
              detectedAt: now,
              anomalyType: parsed.type,
              confidence: parsed.confidence
            }

            console.log('Anomaly detected! Triggering stream:', signalResult)
            setShouldStream(true)
            setLastSignal(signalResult)
            
            // Check if threshold reached - FIRE IMMEDIATELY
            if (signalCountRef.current >= signalThreshold && !thresholdReachedRef.current) {
              thresholdReachedRef.current = true
              console.log('🚨🚨🚨 THRESHOLD REACHED! Firing transition NOW!')
              
              // Fire transition immediately with the video file
              if (onTransition && currentVideoFileRef.current) {
                console.log('Calling onTransition with video file...')
                onTransition(currentVideoFileRef.current).catch(err => {
                  console.error('Transition failed:', err)
                })
              } else {
                console.error('❌ No transition callback or no video file!')
              }
            }
          }
        } catch (error) {
          console.error('Failed to parse signal detection result:', error)
          console.error('Raw result was:', result)
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
  }, [sensitivityThreshold, cooldownMs, signalThreshold, onTransition])

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
