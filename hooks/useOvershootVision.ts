'use client'

import { useState, useCallback, useEffect } from 'react'
import { RealtimeVision } from '@overshoot/sdk'
import { v4 as uuidv4 } from 'uuid'

import { useLocation } from './useLocation'

interface UseOvershootVisionProps {
  prompt: string;
  clipLengthSeconds: number;
  delaySeconds: number;
  onResult: (event: unknown) => void;
  onError: (error: Error) => void;
}

export function useOvershootVision({
  prompt,
  clipLengthSeconds,
  delaySeconds,
  onResult,
  onError
}: UseOvershootVisionProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [vision, setVision] = useState<RealtimeVision | null>(null)
  const { location } = useLocation()
  
  const startVision = useCallback((videoFile: File) => {
    console.log('Starting vision for:', videoFile.name)
    
    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? ''
    
    const newVision = new RealtimeVision({
      apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
      apiKey: apiKey,
      prompt: prompt ?? prompt,
      source: { type: 'video', file: videoFile },
      processing: {
        clip_length_seconds: clipLengthSeconds,
        delay_seconds: delaySeconds
      },
      onResult: (result) => onResult(result),
      onError: onError
    })
    
    console.log('Vision instance created')
    
    // Start the vision processing
    if (typeof newVision.start === 'function') {
      newVision.start()
    }
    
    setVision(newVision)
    return newVision
  }, [location, prompt, clipLengthSeconds, delaySeconds, onResult, onError])
  
  const clearVision = useCallback(() => {
    if (vision && typeof vision.stop === 'function') {
      console.log('Stopping vision instance')
      vision.stop()
    }
    setVision(null)
    setMessage(null)
  }, [vision])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vision && typeof vision.stop === 'function') {
        console.log('Cleaning up vision instance on unmount')
        vision.stop()
      }
    }
  }, [vision])
  
  return { message, vision, startVision, clearVision }
}
