'use client'

import { useState, useCallback, useEffect } from 'react'
import { RealtimeVision } from '@overshoot/sdk'
import { v4 as uuidv4 } from 'uuid'

import { Event } from '@/types/event'
import { useLocation } from './useLocation'

const prompt = `Analyze this emergency scene and respond with a complete JSON object matching this EXACT structure:

{
  "data": {
    "participantsCount": <number or null - total visible people involved>,
    "injuredCount": <number - count of visibly injured people>,
    "weapons": {
      "firearm": {
        "present": <boolean - seen or clearly indicated>,
        "used": <boolean - actually used (shots fired, brandished)>
      },
      "knife": {
        "present": <boolean>,
        "used": <boolean - actually used (stabbing, slashing, brandished)>
      },
      "bluntObject": {
        "present": <boolean - bat, pipe, bottle, etc.>,
        "used": <boolean - swung, hit with>
      },
      "explosive": {
        "present": <boolean>,
        "used": <boolean - detonated or thrown>
      },
      "vehicleAsWeapon": {
        "present": <boolean>,
        "used": <boolean - ramming, deliberately hitting people>
      },
      "other": {
        "present": <boolean - optional, any other weapon>,
        "used": <boolean>
      }
    },
    "aggressionLevel": "verbal" | "physical" | "armed" | "unknown"
  },
  "bystanderReport": "<detailed natural language description of what you observe in the scene>"
}

IMPORTANT: 
- Provide ONLY the JSON object, no additional text
- Base all assessments on visible evidence only
- Use realistic coordinates if location is visible, otherwise use default [0, 0]
- Set all weapon fields even if false
- Be precise with counts and descriptions`

export function useOvershootVision() {
  const [message, setMessage] = useState<string | null>(null)
  const [vision, setVision] = useState<RealtimeVision | null>(null)
  const { location } = useLocation()
  
  const startVision = useCallback((videoFile: File) => {
    console.log('Starting vision for:', videoFile.name)
    
    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? ''
    
    const newVision = new RealtimeVision({
      apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
      apiKey: apiKey,
      prompt: prompt,
      source: { type: 'video', file: videoFile },
      onResult: (result) => {
        console.log('Vision result:', result)
        try {
          // Parse the JSON response from the vision API
          const parsedData = JSON.parse(result.result)

          console.log('Parsed data:', parsedData)
          
          // Construct the full Event object
          const event: Event = {
            id: uuidv4(),
            callerId: uuidv4(), // Generate caller ID or use a stored one
            timestamp: Date.now(),
            coords: { lat: location?.latitude ?? 0, lng: location?.longitude ?? 0 },
            type: 'newReport',
            scenario: parsedData.scenario || 'unknown',
            data: parsedData.data,
            bystanderReport: parsedData.bystanderReport || 'Failed to parse result (Non error)'
          }
          
          console.log('Parsed event:', event)
          setMessage(event.bystanderReport)
        } catch (error) {
          console.error('Failed to parse vision result:', error)
          setMessage('Failed to parse vision result')
        }
      },
      onError: (error: any) => {
        console.error('Vision error:', error)
      }
    })
    
    console.log('Vision instance created')
    
    // Start the vision processing
    if (typeof newVision.start === 'function') {
      newVision.start()
    }
    
    setVision(newVision)
    return newVision
  }, [location])
  
  const clearVision = useCallback(() => {
    setVision(null)
    setMessage(null)
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vision) {
        // Clean up the vision instance
        setVision(null)
      }
    }
  }, [vision])
  
  return { message, vision, startVision, clearVision }
}
