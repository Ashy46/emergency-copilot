'use client'

import { useState, useCallback, useEffect } from 'react'
import { RealtimeVision } from '@overshoot/sdk'

export function useOvershootVision() {
  const [message, setMessage] = useState<string | null>(null)
  const [vision, setVision] = useState<RealtimeVision | null>(null)
  
  const startVision = useCallback((videoFile: File) => {
    console.log('Starting vision for:', videoFile.name)
    
    const apiKey = process.env.NEXT_PUBLIC_OVERSHOOT_API_KEY ?? ''
    
    const newVision = new RealtimeVision({
      apiUrl: 'https://cluster1.overshoot.ai/api/v0.2',
      apiKey: apiKey,
      prompt: 'Describe what you see',
      source: { type: 'video', file: videoFile },
      onResult: (result) => {
        console.log('Vision result:', result)
        setMessage(result.result)
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
  }, [])
  
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
