'use client'

/**
 * Modular Hume Voice Interface Component
 * 
 * Drop-in component for any Next.js application that needs voice AI.
 * Handles all the complexity of Hume EVI integration internally.
 * 
 * @example
 * ```tsx
 * <VoiceInterface
 *   apiKey={process.env.NEXT_PUBLIC_HUME_API_KEY!}
 *   configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID!}
 *   userId="user_123"
 *   onMessage={(msg) => console.log(msg)}
 * />
 * ```
 */

import { useState, useRef, useCallback } from 'react'
import { EVIWebAudioPlayer } from 'hume'

interface VoiceInterfaceProps {
  /** Hume API key */
  apiKey: string
  /** Hume configuration ID */
  configId: string
  /** User ID for personalization (optional) */
  userId?: string
  /** Additional CSS classes */
  className?: string
  /** Status change callback */
  onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void
  /** Message callback */
  onMessage?: (message: any) => void
  /** Error callback */
  onError?: (error: string) => void
  /** Custom styling options */
  styling?: {
    connectButton?: string
    disconnectButton?: string
    statusIndicator?: string
  }
  /** Debug mode */
  debug?: boolean
}

export default function VoiceInterface({
  apiKey,
  configId,
  userId,
  className = '',
  onStatusChange,
  onMessage,
  onError,
  styling = {},
  debug = false
}: VoiceInterfaceProps) {
  // Connection state
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lastMessage, setLastMessage] = useState<string>('')
  
  // Refs for cleanup
  const socketRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioPlayerRef = useRef<EVIWebAudioPlayer | null>(null)
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update status with callback
  const updateStatus = useCallback((newStatus: typeof status) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
    if (debug) {
      console.log('🎤 Voice Interface Status:', newStatus)
    }
  }, [onStatusChange, debug])

  // Handle messages with callback
  const handleMessage = useCallback((message: any) => {
    onMessage?.(message)
    if (debug) {
      console.log('📥 Hume Message:', message.type, message)
    }
  }, [onMessage, debug])

  // Audio streaming function
  const startAudioStreaming = useCallback((socket: WebSocket, stream: MediaStream) => {
    const audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    
    processor.onaudioprocess = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        const inputBuffer = event.inputBuffer.getChannelData(0)
        
        // Convert Float32Array to 16-bit PCM for Hume
        const pcmData = new Int16Array(inputBuffer.length)
        for (let i = 0; i < inputBuffer.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32767))
        }
        
        // Convert to bytes and base64
        const audioBytes = new Uint8Array(pcmData.buffer)
        const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(audioBytes)))
        
        // Send to Hume
        socket.send(JSON.stringify({
          type: 'audio_input',
          data: base64Audio
        }))
      }
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
    
    if (debug) {
      console.log('🎙️ Audio streaming started with 16-bit PCM format')
    }
  }, [debug])

  // Connect to Hume
  const connect = useCallback(async () => {
    try {
      updateStatus('connecting')
      
      // Get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      mediaStreamRef.current = stream

      // Build WebSocket URL
      let websocketUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`
      if (userId) {
        websocketUrl += `&custom_session_id=${userId}`
      }
      
      if (debug) {
        console.log('🔗 Connecting to Hume WebSocket:', websocketUrl.replace(apiKey, 'API_KEY_HIDDEN'))
      }

      // Connect WebSocket
      const socket = new WebSocket(websocketUrl)
      socketRef.current = socket

      socket.onopen = async () => {
        updateStatus('connected')

        // Initialize audio player
        const player = new EVIWebAudioPlayer()
        await player.init()
        audioPlayerRef.current = player
        
        if (debug) {
          console.log('🎵 Audio player initialized')
        }

        // CRITICAL: Configure audio format for Hume
        const sessionSettings = {
          type: 'session_settings',
          audio: {
            encoding: 'linear16',
            sample_rate: 16000,
            channels: 1
          }
        }
        socket.send(JSON.stringify(sessionSettings))
        
        if (debug) {
          console.log('🔧 Sent audio format configuration')
        }

        // Start audio streaming
        startAudioStreaming(socket, stream)
        setIsListening(true)
      }

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)

          // Handle different message types
          switch (data.type) {
            case 'user_message':
              const userText = data.message?.content || ''
              setLastMessage(`You: "${userText}"`)
              setIsListening(false)
              
              // Stop any current AI speech when user speaks
              if (audioPlayerRef.current) {
                audioPlayerRef.current.stop()
              }
              setIsSpeaking(false)
              break

            case 'assistant_message':
              const aiText = data.message?.content || ''
              setLastMessage(`AI: ${aiText}`)
              setIsSpeaking(true)
              
              // Auto-stop speaking after reasonable delay
              if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current)
              }
              speakingTimeoutRef.current = setTimeout(() => {
                setIsSpeaking(false)
                setIsListening(true)
              }, 4000)
              break

            case 'audio_output':
              // Play audio chunk using Hume's official player
              if (audioPlayerRef.current) {
                await audioPlayerRef.current.enqueue(data)
              }
              break

            case 'user_interruption':
              // User interrupted AI speech
              if (audioPlayerRef.current) {
                audioPlayerRef.current.stop()
              }
              setIsSpeaking(false)
              setIsListening(true)
              break

            default:
              if (debug) {
                console.log('📨 Unknown message type:', data.type)
              }
          }
        } catch (error) {
          console.error('Error parsing message:', error)
          onError?.('Failed to parse message from Hume')
        }
      }

      socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        updateStatus('error')
        onError?.('WebSocket connection error')
      }

      socket.onclose = (event) => {
        if (debug) {
          console.log('🔌 WebSocket closed:', event.code, event.reason)
        }
        updateStatus('disconnected')
        setIsSpeaking(false)
        setIsListening(false)
      }

    } catch (error) {
      console.error('❌ Connection error:', error)
      updateStatus('error')
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error'
      onError?.(errorMessage)
      
      // Clean up on error
      disconnect()
    }
  }, [apiKey, configId, userId, updateStatus, handleMessage, startAudioStreaming, debug, onError])

  // Disconnect from Hume
  const disconnect = useCallback(() => {
    if (debug) {
      console.log('🔌 Disconnecting from Hume...')
    }

    // Clear speaking timeout
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current)
      speakingTimeoutRef.current = null
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Stop audio player
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop()
      audioPlayerRef.current = null
    }

    // Reset state
    updateStatus('disconnected')
    setIsSpeaking(false)
    setIsListening(false)
    setLastMessage('')
  }, [updateStatus, debug])

  // Default styling
  const defaultStyling = {
    connectButton: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
    disconnectButton: 'px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors',
    statusIndicator: 'flex items-center space-x-2 text-sm'
  }

  const styles = { ...defaultStyling, ...styling }

  return (
    <div className={`voice-interface ${className}`}>
      {/* Connection Button */}
      <div className="mb-4">
        {status === 'disconnected' ? (
          <button 
            onClick={connect}
            className={styles.connectButton}
          >
            Start Voice Chat
          </button>
        ) : status === 'connecting' ? (
          <button 
            disabled
            className={styles.connectButton}
          >
            Connecting...
          </button>
        ) : (
          <button 
            onClick={disconnect}
            className={styles.disconnectButton}
          >
            End Chat
          </button>
        )}
      </div>

      {/* Status Indicators */}
      <div className={styles.statusIndicator}>
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            status === 'error' ? 'bg-red-500' : 'bg-gray-400'
          }`} />
          <span className="capitalize">{status}</span>
        </div>

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>AI Speaking</span>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && status === 'connected' && !isSpeaking && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Listening</span>
          </div>
        )}
      </div>

      {/* Last Message */}
      {lastMessage && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
          {lastMessage}
        </div>
      )}

      {/* Debug Info */}
      {debug && status === 'connected' && (
        <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-xs">
          <strong>Debug Info:</strong>
          <br />
          Status: {status} | Speaking: {isSpeaking ? 'Yes' : 'No'} | Listening: {isListening ? 'Yes' : 'No'}
          <br />
          User ID: {userId || 'None'} | Config: {configId}
        </div>
      )}
    </div>
  )
}