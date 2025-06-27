'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from 'react'

export interface HumeMessage {
  type: 'user_message' | 'assistant_message' | 'user_interruption' | 'audio_output' | 'connection_status'
  text?: string
  timestamp: Date
  emotionalMeasures?: Record<string, unknown>
  status?: string
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔗 Connecting to Hume AI EVI...')
      
      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      })
      streamRef.current = stream
      console.log('🎤 Microphone access granted')

      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext
      
      // Connect to Hume AI EVI WebSocket
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
      if (!apiKey) {
        throw new Error('Hume API key not found')
      }

      const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}`
      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        console.log('✅ Connected to Hume AI EVI')
        setIsConnected(true)
        setIsLoading(false)
        setIsListening(true)
        config.onConnectionChange(true)
        
        // Send session configuration with correct format
        socket.send(JSON.stringify({
          type: 'SessionSettings',
          session_settings: {
            language: 'en'
          }
        }))
        
        // Start audio streaming
        startAudioStreaming()
        
        // Send connection status message
        config.onMessage({
          type: 'connection_status',
          text: 'Connected to Hume AI! I can now hear you and respond with natural, empathetic voice.',
          timestamp: new Date(),
          status: 'connected'
        })
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleHumeMessage(data)
        } catch (error) {
          console.error('❌ Error parsing Hume message:', error)
        }
      }

      socket.onerror = (error) => {
        console.error('❌ Hume WebSocket error:', error)
        config.onError('Hume AI connection error occurred')
      }

      socket.onclose = (event) => {
        console.log('🔌 Disconnected from Hume AI EVI', event.code, event.reason)
        setIsConnected(false)
        setIsListening(false)
        setIsSpeaking(false)
        config.onConnectionChange(false)
      }

    } catch (error) {
      console.error('❌ Failed to connect to Hume AI:', error)
      config.onError(`Connection failed: ${error}`)
      setIsLoading(false)
      
      // Fallback to basic functionality
      fallbackToBasicMode()
    }
  }, [config])

  const fallbackToBasicMode = useCallback(() => {
    console.log('🔄 Falling back to basic mode without Hume AI')
    setIsConnected(true)
    setIsLoading(false)
    setIsListening(true)
    config.onConnectionChange(true)
    
    config.onMessage({
      type: 'connection_status',
      text: 'Connected in basic mode. Hume AI integration will be enhanced soon!',
      timestamp: new Date(),
      status: 'fallback'
    })
  }, [config])

  const startAudioStreaming = useCallback(() => {
    if (!streamRef.current || !socketRef.current) return

    try {
      // Set up MediaRecorder for audio streaming to Hume
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          console.log('🎤 Audio data available, size:', event.data.size, 'type:', event.data.type)
          
          // Send binary audio data directly to Hume AI
          // Hume AI likely expects raw binary data, not JSON-wrapped arrays
          event.data.arrayBuffer().then(buffer => {
            console.log('📡 Sending binary audio to Hume AI, size:', buffer.byteLength)
            
            // Try sending as binary data instead of JSON
            socketRef.current?.send(buffer)
          }).catch(error => {
            console.error('❌ Error processing audio data:', error)
          })
        }
      }

      mediaRecorder.start(100) // Stream in 100ms chunks
      console.log('🎵 Started audio streaming to Hume AI')

    } catch (error) {
      console.error('❌ Failed to start audio streaming:', error)
      config.onError('Failed to start audio streaming')
    }
  }, [config])

  const handleHumeMessage = useCallback((data: any) => {
    console.log('📨 Hume AI message received:', data.type, data)

    switch (data.type) {
      case 'UserMessage':
        // User speech was transcribed by Hume AI
        console.log('🎤 User speech transcribed:', data.message?.content)
        config.onMessage({
          type: 'user_message',
          text: data.message?.content || '',
          timestamp: new Date(),
          emotionalMeasures: data.models?.prosody || data.prosody
        })
        break

      case 'AssistantMessage':
        // AI generated a text response
        console.log('🤖 Assistant message:', data.message?.content)
        setIsSpeaking(true)
        config.onMessage({
          type: 'assistant_message',
          text: data.message?.content || '',
          timestamp: new Date()
        })
        break

      case 'AudioOutput':
        // AI generated audio to play
        console.log('🔊 Audio output received from Hume AI')
        if (data.data) {
          playHumeAudio(data.data)
        }
        break

      case 'UserInterruption':
        // User interrupted the AI
        console.log('🚨 User interruption detected by Hume AI')
        setIsSpeaking(false)
        config.onMessage({
          type: 'user_interruption',
          timestamp: new Date()
        })
        break

      case 'Error':
        console.error('❌ Hume AI error:', data.message || data.error)
        config.onError(data.message || data.error || 'Hume AI error occurred')
        break

      case 'ChatMetadata':
        console.log('📊 Chat metadata:', data)
        // Handle chat metadata if needed
        break

      default:
        console.log('❓ Unknown Hume message type:', data.type, 'Data:', data)
    }
  }, [config])

  const playHumeAudio = useCallback(async (audioData: number[] | string) => {
    try {
      if (!audioContextRef.current) return

      let buffer: ArrayBuffer

      if (typeof audioData === 'string') {
        // Base64 encoded audio
        const binaryString = atob(audioData)
        buffer = new ArrayBuffer(binaryString.length)
        const view = new Uint8Array(buffer)
        for (let i = 0; i < binaryString.length; i++) {
          view[i] = binaryString.charCodeAt(i)
        }
      } else {
        // Array of numbers
        buffer = new Uint8Array(audioData).buffer
      }

      const decodedAudio = await audioContextRef.current.decodeAudioData(buffer)
      
      const source = audioContextRef.current.createBufferSource()
      source.buffer = decodedAudio
      source.connect(audioContextRef.current.destination)
      
      source.onended = () => {
        setIsSpeaking(false)
        console.log('🔊 Hume AI audio playback finished')
      }
      
      source.start()
      console.log('🔊 Playing Hume AI audio response')

    } catch (error) {
      console.error('❌ Failed to play Hume audio:', error)
      setIsSpeaking(false)
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.log('⚠️ Not connected to Hume AI, using fallback')
      
      // Fallback response
      setTimeout(() => {
        config.onMessage({
          type: 'assistant_message',
          text: `I understand you said: "${text}". I'm working on connecting to Hume AI for better responses!`,
          timestamp: new Date()
        })
      }, 1000)
      return
    }

    // Send text message to Hume AI with correct format
    const message = {
      type: 'UserInput',
      text: text
    }

    socketRef.current.send(JSON.stringify(message))
    console.log('📤 Sent text to Hume AI:', text)
  }, [config])

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Hume AI EVI')
    
    // Stop media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close()
    }

    // Reset states
    setIsConnected(false)
    setIsListening(false)
    setIsSpeaking(false)
    setIsLoading(false)
    
    config.onConnectionChange(false)
  }, [config])

  // Cleanup on unmount
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