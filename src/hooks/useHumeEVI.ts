'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

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
  
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Real Hume AI EVI WebSocket connection
  const connect = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log('🔗 Connecting to Hume AI EVI...')
      
      // Get Hume AI credentials with detailed debugging
      const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '8f16326f-a45d-4433-9a12-890120244ec3' // TEMPORARY FALLBACK
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
      
      // TEMPORARY DEBUG: Log environment variable details
      console.log('🔍 ENVIRONMENT DEBUG:');
      console.log('  configId:', configId);
      console.log('  configId type:', typeof configId);
      console.log('  configId undefined?:', configId === undefined);
      console.log('  apiKey present?:', !!apiKey);
      console.log('  All HUME env vars:', Object.keys(process.env).filter(k => k.includes('HUME')));
      
      if (!configId || !apiKey) {
        const errorDetails = {
          configId: configId || 'MISSING',
          apiKey: apiKey ? 'PRESENT' : 'MISSING',
          allHumeVars: Object.keys(process.env).filter(k => k.includes('HUME')),
          timestamp: new Date().toISOString()
        };
        console.error('❌ Hume AI credentials missing:', errorDetails);
        throw new Error(`Hume AI credentials not found: ${JSON.stringify(errorDetails)}`)
      }
      
      // Request microphone permission
      console.log('🎤 Requesting microphone permission...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      mediaStreamRef.current = stream
      console.log('✅ Microphone permission granted')
      
      // Create audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })
      
      // Set up MediaRecorder for audio capture
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        sendAudioToHume(audioBlob)
        audioChunksRef.current = []
      }
      
      // Connect to Hume AI EVI WebSocket
      const wsUrl = `wss://api.hume.ai/v0/evi/chat?config_id=${configId}&api_key=${apiKey}`
      console.log('🔌 Connecting to Hume EVI WebSocket...')
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('✅ Connected to Hume AI EVI')
        setIsConnected(true)
        setIsLoading(false)
        setIsListening(true)
        config.onConnectionChange(true)
        
        config.onMessage({
          type: 'connection_status',
          text: 'Connected to Hume AI EVI! I can now hear and respond to your voice with emotional intelligence.',
          timestamp: new Date(),
          status: 'connected'
        })
        
        // Send initial greeting message to trigger Hume AI response
        setTimeout(() => {
          const greetingMessage = {
            type: 'assistant_input',
            text: 'Hello! How can I help you with your career quest today?'
          }
          console.log('📤 Sending initial greeting to Hume AI:', greetingMessage)
          wsRef.current?.send(JSON.stringify(greetingMessage))
        }, 1000)
        
        // Start recording audio
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
          mediaRecorderRef.current.start(1000) // Send audio chunks every second
        }
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Hume AI message received:', JSON.stringify(data, null, 2))
          
          // Handle different Hume EVI message types
          if (data.type === 'session_settings') {
            console.log('⚙️ Session settings received')
            
          } else if (data.type === 'user_message' || data.type === 'user_input') {
            // User spoke - Hume AI transcribed it
            console.log('🗣️ User message transcribed:', data.message?.content || data.text)
            config.onMessage({
              type: 'user_message',
              text: data.message?.content || data.text || data.transcript,
              timestamp: new Date(),
              emotionalMeasures: data.emotions || data.emotional_measures || data.inference
            })
            setIsListening(false)
            
          } else if (data.type === 'assistant_message' || data.type === 'assistant_input') {
            // AI response received
            const responseText = data.message?.content || data.text || data.content
            console.log('🤖 Assistant response:', responseText)
            
            config.onMessage({
              type: 'assistant_message',
              text: responseText,
              timestamp: new Date()
            })
            setIsSpeaking(true)
            
            // Play audio if provided
            if (data.audio || data.audio_data || data.data) {
              console.log('🔊 Playing audio response')
              playAudioResponse(data.audio || data.audio_data || data.data)
            } else {
              console.log('⚠️ No audio data in assistant message')
            }
            
          } else if (data.type === 'audio_output' || data.type === 'audio') {
            // Audio response from Hume AI
            console.log('🎵 Audio output received')
            if (data.data || data.audio) {
              playAudioResponse(data.data || data.audio)
            }
            
          } else if (data.type === 'expression_measurement') {
            // Emotion/expression data
            console.log('😊 Expression measurement:', data.inference)
            
          } else {
            console.log('❓ Unknown message type:', data.type, data)
          }
          
        } catch (error) {
          console.error('❌ Error parsing Hume AI message:', error)
          console.error('Raw message data:', event.data)
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Hume AI WebSocket error:', error)
        config.onError('WebSocket connection error')
        setIsLoading(false)
      }
      
      wsRef.current.onclose = () => {
        console.log('🔌 Hume AI WebSocket closed')
        setIsConnected(false)
        setIsListening(false)
        setIsSpeaking(false)
        config.onConnectionChange(false)
      }
      
    } catch (error) {
      console.error('❌ Failed to connect to Hume AI:', error)
      config.onError(error instanceof Error ? error.message : 'Connection failed')
      setIsLoading(false)
      
      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [config])

  // Send audio data to Hume AI
  const sendAudioToHume = useCallback((audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    
    // Convert blob to base64 for WebSocket transmission
    const reader = new FileReader()
    reader.onload = () => {
      const base64Audio = reader.result as string
      const audioData = base64Audio.split(',')[1] // Remove data:audio/webm;base64, prefix
      
      const message = {
        type: 'audio_input',
        data: audioData,
        encoding: 'webm'
      }
      
      wsRef.current?.send(JSON.stringify(message))
    }
    reader.readAsDataURL(audioBlob)
  }, [])
  
  // Play audio response from Hume AI
  const playAudioResponse = useCallback(async (audioData: string) => {
    try {
      console.log('🎵 Attempting to play audio, data length:', audioData?.length)
      
      if (!audioData) {
        console.log('⚠️ No audio data provided')
        return
      }
      
      // Try different audio formats that Hume AI might use
      let audioBlob
      try {
        // Try base64 decode first
        const binaryString = atob(audioData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        audioBlob = new Blob([bytes], { type: 'audio/wav' }) // Try WAV format
        console.log('✅ Created audio blob as WAV, size:', audioBlob.size)
      } catch {
        console.log('⚠️ Base64 decode failed, trying direct blob creation')
        audioBlob = new Blob([audioData], { type: 'audio/webm' })
      }
      
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onloadstart = () => console.log('🎵 Audio loading started')
      audio.oncanplay = () => console.log('🎵 Audio can play')
      audio.onplay = () => console.log('🎵 Audio started playing')
      audio.onended = () => {
        console.log('🎵 Audio playback ended')
        setIsSpeaking(false)
        setIsListening(true)
        URL.revokeObjectURL(audioUrl)
        
        // Resume recording if still connected
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume()
        }
      }
      
      audio.onerror = (e) => {
        console.error('🚨 Audio playback error:', e)
        setIsSpeaking(false)
        setIsListening(true)
        URL.revokeObjectURL(audioUrl)
      }
      
      // Pause recording while AI speaks
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause()
      }
      
      console.log('🎵 Starting audio playback...')
      await audio.play()
      
    } catch (error) {
      console.error('❌ Error playing audio response:', error)
      setIsSpeaking(false)
      setIsListening(true)
    }
  }, [])

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from Hume AI')
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setIsConnected(false)
    setIsListening(false)
    setIsSpeaking(false)
    setIsLoading(false)
    config.onConnectionChange(false)
  }, [config])

  // Send text message to Hume AI
  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('⚠️ Not connected to Hume AI')
      config.onError('Not connected to Hume AI')
      return
    }

    console.log('📤 Sending text message to Hume AI:', text)
    
    const message = {
      type: 'user_message',
      text: text
    }
    
    wsRef.current.send(JSON.stringify(message))
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