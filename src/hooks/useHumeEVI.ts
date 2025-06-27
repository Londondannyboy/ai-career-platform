'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export interface HumeMessage {
  type: 'user_message' | 'assistant_message' | 'user_interruption' | 'audio_output'
  text?: string
  timestamp: Date
  emotionalMeasures?: Record<string, unknown>
}

export interface HumeEVIConfig {
  onMessage: (message: HumeMessage) => void
  onConnectionChange: (connected: boolean) => void
  onError: (error: string) => void
}

export function useHumeEVI(config: HumeEVIConfig) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const socketRef = useRef<WebSocket | null>(null)
  
  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // For now, simulate connection until we properly implement Hume AI
      setTimeout(() => {
        setIsConnected(true)
        setIsLoading(false)
        setIsListening(true)
        config.onConnectionChange(true)
        
        // Send welcome message
        config.onMessage({
          type: 'assistant_message',
          text: 'Connected to Quest! Hume AI integration coming soon. For now, I\'m using standard speech recognition.',
          timestamp: new Date()
        })
      }, 1000)
      
    } catch (error) {
      console.error('Failed to connect:', error)
      config.onError(`Connection failed: ${error}`)
      setIsLoading(false)
    }
  }, [config])

  const sendMessage = useCallback((text: string) => {
    if (!isConnected) {
      config.onError('Not connected')
      return
    }

    // For now, just echo back - this will be replaced with actual Hume AI
    setTimeout(() => {
      config.onMessage({
        type: 'assistant_message',
        text: `I heard: "${text}". Full Hume AI integration coming soon!`,
        timestamp: new Date()
      })
    }, 1000)
    
    console.log('📤 Sent message to Quest AI:', text)
  }, [config, isConnected])

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Quest AI')
    
    if (socketRef.current) {
      socketRef.current.close()
    }

    setIsConnected(false)
    setIsListening(false)
    setIsSpeaking(false)
    setIsLoading(false)
    
    config.onConnectionChange(false)
  }, [config])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    isLoading,
    isListening,
    isSpeaking
  }
}