'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'
import { getContextualPrompt, defaultCoachPrompts, CoachPrompts } from '@/lib/prompts/quest-coach-prompts'

export default function QuestHumeProductionPage() {
  const { userId, isLoaded } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  const [wasInterrupted, setWasInterrupted] = useState(false)
  
  // Hume production refs
  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const voiceDetectionRef = useRef<boolean>(false)
  const isSpeakingRef = useRef<boolean>(false)
  const humeSocketRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isLoaded && userId) {
      checkUserProfile()
    }
  }, [isLoaded, userId])

  const checkUserProfile = async () => {
    try {
      const response = await fetch('/api/debug-users')
      const data = await response.json()
      
      const userProfile = data.users.find((u: any) => u.id === userId)
      setUserProfile(userProfile)
      
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  const createUserProfile = async () => {
    if (!userId) return
    
    try {
      const response = await fetch('/api/init-db-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force_user_id: userId,
          user_data: {
            email: 'dan@ckdelta.ai',
            name: 'Dan Keegan',
            company: 'CKDelta',
            current_role: 'Entrepreneur/Consultant'
          }
        })
      })

      if (response.ok) {
        checkUserProfile()
        setLastResponse('✅ User profile created successfully!')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
    }
  }

  const initializeHumeEVI = async () => {
    try {
      // Check for Hume API key
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY
      if (!apiKey) {
        setLastResponse('❌ Hume API key not configured. Please add NEXT_PUBLIC_HUME_API_KEY to environment variables.')
        return
      }

      setLastResponse('🔄 Connecting to Hume EVI...')

      // Get microphone access with enhanced settings (matching the working enhanced version)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,  // Match enhanced version settings
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 16000
        } 
      })
      mediaStreamRef.current = stream

      // Initialize AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Use official Hume EVI WebSocket endpoint
      const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || '8f16326f-a45d-4433-9a12-890120244ec3'
      const websocketUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`
      
      console.log('🔄 Connecting to Hume EVI WebSocket...')
      const socket = new WebSocket(websocketUrl)
      humeSocketRef.current = socket

      socket.onopen = () => {
        console.log('🎤 Connected to Hume EVI')
        setIsConnected(true)
        
        // Initialize session
        const initMessage = {
          type: 'session_settings',
          metadata: {
            user_id: userId,
            session_type: 'quest_production_hume',
            platform: 'quest_hume_production'
          }
        }
        
        socket.send(JSON.stringify(initMessage))
        setLastResponse('🎤 Hume EVI connected with authentic voice and enhanced interruption handling!')
      }

      socket.onerror = (error) => {
        console.error('❌ Hume WebSocket error:', error)
        setLastResponse('❌ Connection error with Hume EVI. Check API key and config ID.')
        setIsConnected(false)
      }

      socket.onclose = (event) => {
        console.log('🔌 Hume WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsRecording(false)
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📥 Hume response:', data)
          
          // Handle different message types from Hume EVI (match working quest-hume-real)
          if (data.type === 'user_message') {
            // User's transcribed speech
            setLastResponse(`You: "${data.message?.content || 'Listening...'}"`)
          } else if (data.type === 'assistant_message') {
            // AI response with audio
            setLastResponse(`Quest AI: ${data.message?.content || 'Responding...'}`)
            setIsSpeaking(true)
            isSpeakingRef.current = true
            // Hume EVI handles the audio playback automatically
          } else if (data.type === 'session_settings') {
            console.log('✅ Session configured:', data)
          } else if (data.type === 'error') {
            console.error('❌ Hume EVI error:', data)
            setLastResponse(`❌ Error: ${data.message || 'Unknown error'}`)
          }
        } catch (error) {
          console.error('❌ Error parsing Hume message:', error)
        }
      }

      // Start audio streaming to Hume
      startAudioStreaming(socket, stream, audioContext)
      
    } catch (error) {
      console.error('❌ Error initializing Hume EVI:', error)
      setLastResponse('Failed to initialize Hume EVI: ' + error)
    }
  }

  const startAudioStreaming = (socket: WebSocket, stream: MediaStream, audioContext: AudioContext) => {
    const source = audioContext.createMediaStreamSource(stream)
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    
    processor.onaudioprocess = (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        const inputBuffer = event.inputBuffer.getChannelData(0)
        
        // Use the working format from quest-hume-real
        const audioData = {
          type: 'audio_input',
          audio: Array.from(inputBuffer),
          sample_rate: audioContext.sampleRate
        }
        
        socket.send(JSON.stringify(audioData))
      }
    }
    
    source.connect(processor)
    processor.connect(audioContext.destination)
  }

  const playHumeAudio = (audioData: number[]) => {
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    const buffer = audioContext.createBuffer(1, audioData.length, audioContext.sampleRate)
    const channelData = buffer.getChannelData(0)
    
    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i]
    }
    
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.connect(audioContext.destination)
    source.start()
    
    setIsSpeaking(true)
    isSpeakingRef.current = true
    source.onended = () => {
      setIsSpeaking(false)
      isSpeakingRef.current = false
    }
  }

  const setupVoiceActivityDetection = async (existingStream?: MediaStream) => {
    try {
      console.log('🔧 Setting up enhanced voice activity detection for Hume...')
      
      let stream: MediaStream
      if (existingStream) {
        stream = existingStream
        console.log('🎤 Using existing microphone stream for voice detection')
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        })
        console.log('🎤 New microphone access granted for voice detection')
      }

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.2
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      console.log('🔊 Enhanced audio analysis setup complete')

      let consecutiveVoiceFrames = 0
      let lastInterruptTime = 0
      const monitorVoiceActivity = () => {
        if (!analyserRef.current || !isRecording) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        const sum = dataArray.reduce((a, b) => a + b, 0)
        const average = sum / bufferLength
        
        const midFreqStart = Math.floor(bufferLength * 0.2)
        const midFreqEnd = Math.floor(bufferLength * 0.8)
        const midFreqSum = dataArray.slice(midFreqStart, midFreqEnd).reduce((a, b) => a + b, 0)
        const midFreqAverage = midFreqSum / (midFreqEnd - midFreqStart)
        
        const combinedLevel = Math.max(average, midFreqAverage * 0.8)
        const voiceThreshold = 12  // More sensitive for better interruption
        const isVoiceActive = combinedLevel > voiceThreshold
        
        setVoiceLevel(Math.round(combinedLevel))

        if (isVoiceActive && !voiceDetectionRef.current) {
          console.log('🎤 Voice activity detected! Level:', combinedLevel)
          voiceDetectionRef.current = true
        } else if (!isVoiceActive && voiceDetectionRef.current) {
          console.log('🤫 Voice activity stopped')
          voiceDetectionRef.current = false
        }

        if (isVoiceActive) {
          consecutiveVoiceFrames++
        } else {
          consecutiveVoiceFrames = 0
        }

        const now = Date.now()
        if (consecutiveVoiceFrames >= 2 && isSpeakingRef.current && (now - lastInterruptTime) > 300) {
          console.log('🛑 ENHANCED VOICE INTERRUPTION! Level:', combinedLevel, 'Frames:', consecutiveVoiceFrames)
          
          if ('speechSynthesis' in window) {
            speechSynthesis.cancel()
          }
          setIsSpeaking(false)
          isSpeakingRef.current = false
          setWasInterrupted(true)
          if (utteranceRef.current) {
            utteranceRef.current = null
          }
          
          consecutiveVoiceFrames = 0
          lastInterruptTime = now
        }

        if (isRecording) {
          requestAnimationFrame(monitorVoiceActivity)
        }
      }

      console.log('▶️ Starting enhanced voice activity monitoring')
      monitorVoiceActivity()

    } catch (error) {
      console.error('❌ Error setting up voice activity detection:', error)
      setLastResponse('❌ Voice detection setup failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const startVoiceConversation = async () => {
    if (!userProfile) {
      alert('Please create your user profile first')
      return
    }

    try {
      setIsRecording(true)
      await initializeHumeEVI()
      
      // Also setup the enhanced version's voice activity detection for the UI feedback
      await setupVoiceActivityDetection()
      
    } catch (error) {
      console.error('❌ Error starting Hume voice conversation:', error)
      setIsRecording(false)
      setIsConnected(false)
    }
  }

  const stopVoiceConversation = () => {
    setIsRecording(false)
    setIsConnected(false)
    setLastResponse('')
    
    // Close Hume WebSocket
    if (humeSocketRef.current) {
      humeSocketRef.current.close()
      humeSocketRef.current = null
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    
    setIsSpeaking(false)
    isSpeakingRef.current = false
    setIsProcessing(false)
  }

  const interruptConversation = () => {
    // Send interrupt signal to Hume
    if (humeSocketRef.current && humeSocketRef.current.readyState === WebSocket.OPEN) {
      const interrupt = {
        type: 'interrupt',
        action: 'stop_speaking'
      }
      humeSocketRef.current.send(JSON.stringify(interrupt))
    }
    
    setIsSpeaking(false)
    isSpeakingRef.current = false
    setIsProcessing(false)
    setLastResponse('🔄 Hume conversation interrupted. Listening for new input...')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Production Hume Voice</h1>
        <p className="text-muted-foreground">
          Professional voice conversation with authentic Hume voice synthesis and enhanced interruption handling
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Hume Voice Assistant</CardTitle>
            <CardDescription>
              Authentic Hume voice synthesis with advanced interruption detection from the enhanced version
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={isLoaded ? "default" : "secondary"}>
                {isLoaded ? '✅ Auth Ready' : '⏳ Loading...'}
              </Badge>
              
              <Badge variant={userId ? "default" : "destructive"}>
                {userId ? `👤 ${userId.substring(0, 12)}...` : '❌ No User'}
              </Badge>
              
              <Badge variant={userProfile ? "default" : "secondary"}>
                {userProfile ? `📋 ${userProfile.name}` : '⏳ No Profile'}
              </Badge>

              <Badge variant="default">
                🎤 Authentic Hume Voice
              </Badge>
            </div>

            {/* Profile Management */}
            {!userProfile && userId && (
              <Button 
                onClick={createUserProfile}
                className="w-full"
                variant="outline"
              >
                👤 Create My Profile (Dan Keegan)
              </Button>
            )}

            {/* Voice Controls */}
            <div className="space-y-2">
              <Button 
                onClick={isRecording ? stopVoiceConversation : startVoiceConversation}
                className="w-full"
                variant={isRecording ? "destructive" : "default"}
                disabled={!userProfile}
                size="lg"
              >
                {isRecording ? '🛑 Stop Hume Quest AI' : '🎤 Start Hume Quest AI'}
              </Button>
              
              {isRecording && (
                <Button 
                  onClick={interruptConversation}
                  variant="outline"
                  className="w-full"
                  disabled={!isRecording}
                >
                  ⚡ Interrupt & Speak Now
                </Button>
              )}
              
              <Button 
                onClick={() => setDebugMode(!debugMode)}
                variant="outline"
                className="w-full"
                size="sm"
              >
                🔍 {debugMode ? 'Hide' : 'Show'} Debug Info
              </Button>
              
              <Button 
                onClick={() => window.open('/coach-prompts', '_blank')}
                variant="outline"
                className="w-full"
                size="sm"
              >
                ⚙️ Edit Coach Prompts
              </Button>
            </div>

            {/* Enhanced Status Display */}
            {isRecording && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border">
                <div className="text-sm font-medium mb-2">🎤 Enhanced Voice Status</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Mode:</span>
                    <span className="text-purple-600 font-medium">🔊 Enhanced</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Listening:</span>
                    <span className={isRecording ? 'text-green-600 font-medium' : 'text-gray-500'}>
                      {isRecording ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing:</span>
                    <span className={isProcessing ? 'text-yellow-600 font-medium' : 'text-gray-500'}>
                      {isProcessing ? '🟡 Thinking...' : '✅ Ready'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Speaking:</span>
                    <span className={isSpeaking ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                      {isSpeaking ? '🔊 Enhanced Voice' : '⚪ Silent'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Voice Level:</span>
                    <span className={voiceLevel > 12 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {voiceLevel} {voiceLevel > 12 ? '🟢' : '🔇'} {voiceLevel > 25 ? '🔊' : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugMode && (
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-sm font-medium mb-2">🔍 Enhanced Voice Debug</div>
                <div className="space-y-1 text-xs">
                  <div>Audio Context: {audioContextRef.current ? '🟢 Active' : '🔴 None'}</div>
                  <div>Analyser: {analyserRef.current ? '🟢 Connected' : '🔴 None'}</div>
                  <div>Voice Level: {voiceLevel} (threshold: 12)</div>
                  <div>Detection Active: {voiceLevel > 12 ? '🟢 YES' : '🔴 NO'}</div>
                  <div>AI Speaking (state): {isSpeaking ? '🟢 YES' : '🔴 NO'}</div>
                  <div>AI Speaking (ref): {isSpeakingRef.current ? '🟢 YES' : '🔴 NO'}</div>
                  <div>Was Interrupted: {wasInterrupted ? '🟡 YES' : '🔴 NO'}</div>
                  <div>Should Interrupt: {voiceLevel > 12 && isSpeakingRef.current ? '🟢 YES' : '🔴 NO'}</div>
                </div>
                <div className="mt-2 text-xs text-purple-700">
                  Enhanced sensitivity - level should go above 12 when speaking
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Conversation</CardTitle>
            <CardDescription>
              Real-time conversation with professional voice quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">Enhanced Voice Output</div>
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse || 'Enhanced Quest AI ready to start professional conversation...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Enhanced Voice Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🔊 Enhanced Audio Quality</h4>
              <ul className="text-sm space-y-1">
                <li>• Premium voice selection</li>
                <li>• Optimized speech parameters</li>
                <li>• Natural delivery timing</li>
                <li>• Professional tone quality</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🎤 Advanced Interruption</h4>
              <ul className="text-sm space-y-1">
                <li>• Enhanced voice detection (threshold: 12)</li>
                <li>• Faster interruption response</li>
                <li>• Natural conversation flow</li>
                <li>• Context-aware acknowledgment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}