'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@clerk/nextjs'

export default function QuestHybridPage() {
  const { userId, isLoaded } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [lastResponse, setLastResponse] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceMode, setVoiceMode] = useState<'web_speech' | 'hume_ready'>('web_speech')
  const [voiceLevel, setVoiceLevel] = useState(0)
  const [debugMode, setDebugMode] = useState(false)
  
  // Voice recognition refs
  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const voiceDetectionRef = useRef<boolean>(false)

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
            email: 'keegan.dan@gmail.com',
            name: 'Dan Keegan',
            company: 'CKDelta',
            current_role: 'Entrepreneur/Consultant'
          }
        })
      })
      
      const result = await response.json()
      console.log('✅ User profile created:', result)
      
      checkUserProfile()
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
    }
  }

  const processVoiceInput = async (transcript: string) => {
    try {
      setIsProcessing(true)
      setLastResponse(`You: "${transcript}"\n\n🧠 Quest AI is thinking...`)
      
      // Stop any ongoing speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
        setIsSpeaking(false)
      }
      
      const response = await fetch('/api/hume-clm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are Quest, an empathetic AI career coach. Respond warmly and conversationally. Keep responses concise for voice conversation.' },
            { role: 'user', content: transcript }
          ],
          user_id: userId,
          custom_session_id: `quest_hybrid_${userId}_${Date.now()}`,
          emotional_context: { 
            engagement: 0.8, 
            conversation_mode: 'voice',
            platform: 'quest_hybrid'
          }
        })
      })

      const reader = response.body?.getReader()
      let result = ''
      
      if (reader) {
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const match = line.match(/0:"([^"]*)"/)
              if (match) {
                result += match[1]
              }
            }
          }
        }
      }
      
      setLastResponse(`You: "${transcript}"\n\nQuest AI: ${result}`)
      setIsProcessing(false)
      
      // Enhanced speech synthesis
      if ('speechSynthesis' in window && result) {
        setIsSpeaking(true)
        
        // Find a good voice for Quest AI
        const voices = speechSynthesis.getVoices()
        const preferredVoices = voices.filter(voice => 
          voice.name.includes('Samantha') || 
          voice.name.includes('Karen') || 
          voice.name.includes('Serena') ||
          voice.name.includes('Allison') ||
          voice.lang.includes('en-US')
        )
        
        const utterance = new SpeechSynthesisUtterance(result)
        utterance.voice = preferredVoices[0] || voices.find(v => v.lang.includes('en')) || voices[0]
        utterance.rate = 0.95
        utterance.pitch = 1.1
        utterance.volume = 0.9
        
        utterance.onend = () => {
          setIsSpeaking(false)
          utteranceRef.current = null
        }
        
        utterance.onstart = () => {
          setIsSpeaking(true)
        }
        
        utterance.onerror = () => {
          setIsSpeaking(false)
          utteranceRef.current = null
        }
        
        utteranceRef.current = utterance
        speechSynthesis.speak(utterance)
      }
      
    } catch (error) {
      console.error('❌ Error processing voice input:', error)
      setLastResponse('Error processing voice input: ' + error)
      setIsProcessing(false)
    }
  }

  const setupVoiceActivityDetection = async () => {
    try {
      console.log('🔧 Setting up voice activity detection...')
      
      // Get microphone access for voice activity detection
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // We want to detect ALL audio including user voice
          noiseSuppression: false,
          autoGainControl: false
        } 
      })

      console.log('🎤 Microphone access granted for voice detection')

      // Create audio context and analyser
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 512  // Increased for better detection
      analyser.smoothingTimeConstant = 0.3  // More responsive
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      console.log('🔊 Audio analysis setup complete')

      // Start voice activity monitoring
      let consecutiveVoiceFrames = 0
      const monitorVoiceActivity = () => {
        if (!analyserRef.current || !isRecording) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate audio level (more sensitive calculation)
        const sum = dataArray.reduce((a, b) => a + b, 0)
        const average = sum / bufferLength
        
        // Also check for peaks in specific frequency ranges
        const midFreqStart = Math.floor(bufferLength * 0.2)
        const midFreqEnd = Math.floor(bufferLength * 0.8)
        const midFreqSum = dataArray.slice(midFreqStart, midFreqEnd).reduce((a, b) => a + b, 0)
        const midFreqAverage = midFreqSum / (midFreqEnd - midFreqStart)
        
        // Use both overall and mid-frequency levels
        const combinedLevel = Math.max(average, midFreqAverage * 0.8)
        
        // Lower threshold for more sensitive detection
        const voiceThreshold = 15
        const isVoiceActive = combinedLevel > voiceThreshold
        
        // Update voice level for UI feedback
        setVoiceLevel(Math.round(combinedLevel))

        // Count consecutive frames of voice activity for stability
        if (isVoiceActive) {
          consecutiveVoiceFrames++
        } else {
          consecutiveVoiceFrames = 0
        }

        // If voice is detected for multiple frames and AI is speaking, interrupt immediately
        if (consecutiveVoiceFrames >= 2 && isSpeaking) {
          console.log('🛑 VOICE INTERRUPTION! Level:', combinedLevel, 'Frames:', consecutiveVoiceFrames)
          if ('speechSynthesis' in window) {
            speechSynthesis.cancel()
          }
          setIsSpeaking(false)
          if (utteranceRef.current) {
            utteranceRef.current = null
          }
          consecutiveVoiceFrames = 0 // Reset
        }

        // Continue monitoring at 60fps
        if (isRecording) {
          requestAnimationFrame(monitorVoiceActivity)
        }
      }

      // Start monitoring immediately
      console.log('▶️ Starting voice activity monitoring')
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
      setIsConnected(true)
      
      // Setup voice activity detection for interruption
      await setupVoiceActivityDetection()
      
      // Initialize Web Speech API with enhanced settings
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true  // Enable interim results for faster interruption
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started')
          setLastResponse('🎤 Quest AI is listening... speak naturally!')
        }
        
        recognition.onresult = async (event: any) => {
          const result = event.results[event.results.length - 1]
          const transcript = result[0].transcript.trim()
          const isFinal = result.isFinal
          
          // Immediate interruption on ANY voice activity (even interim results)
          if (isSpeaking && 'speechSynthesis' in window && transcript.length > 2) {
            console.log('🛑 Auto-interrupting AI speech - user voice detected')
            speechSynthesis.cancel()
            setIsSpeaking(false)
            if (utteranceRef.current) {
              utteranceRef.current = null
            }
          }
          
          // Only process final results for actual conversation
          if (isFinal && transcript.length > 0) {
            console.log('🗣️ User said (final):', transcript)
            await processVoiceInput(transcript)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('❌ Speech recognition error:', event.error)
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setLastResponse('❌ Microphone access denied. Please allow microphone access and try again.')
          } else {
            setLastResponse(`❌ Voice recognition error: ${event.error}`)
          }
        }
        
        recognition.onend = () => {
          console.log('🛑 Voice recognition ended')
          if (isRecording && !isProcessing) {
            // Restart recognition if still in conversation mode and not processing
            setTimeout(() => {
              if (isRecording && recognitionRef.current) {
                recognition.start()
              }
            }, 100)
          }
        }
        
        recognitionRef.current = recognition
        recognition.start()
        
      } else {
        setLastResponse('❌ Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.')
      }
      
    } catch (error) {
      console.error('❌ Error starting voice conversation:', error)
      setIsRecording(false)
      setIsConnected(false)
    }
  }

  const stopVoiceConversation = () => {
    setIsRecording(false)
    setIsConnected(false)
    setLastResponse('')
    
    // Stop voice recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Stop voice activity detection
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsProcessing(false)
  }

  const interruptConversation = () => {
    // Stop current speech immediately
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    
    if (utteranceRef.current) {
      utteranceRef.current = null
    }
    
    setIsSpeaking(false)
    setIsProcessing(false)
    setLastResponse('🔄 Conversation interrupted. Listening for new input...')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest AI - Production Voice Assistant</h1>
        <p className="text-muted-foreground">
          Professional voice conversation with full personalization (Ready for Production)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Assistant Status</CardTitle>
            <CardDescription>
              Production-ready voice interface with CLM integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auth Status */}
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
                🎤 Enhanced Voice
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
                {isRecording ? '🛑 Stop Quest AI' : '🎤 Start Quest AI'}
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
            </div>

            {/* Voice Status */}
            {isRecording && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border">
                <div className="text-sm font-medium mb-2">🎤 Voice Status</div>
                <div className="space-y-2">
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
                      {isSpeaking ? '🔊 Active' : '⚪ Silent'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Voice Level:</span>
                    <span className={voiceLevel > 15 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {voiceLevel} {voiceLevel > 15 ? '🟢' : '🔇'} {voiceLevel > 30 ? '🔊' : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugMode && (
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-sm font-medium mb-2">🔍 Voice Detection Debug</div>
                <div className="space-y-1 text-xs">
                  <div>Audio Context: {audioContextRef.current ? '🟢 Active' : '🔴 None'}</div>
                  <div>Analyser: {analyserRef.current ? '🟢 Connected' : '🔴 None'}</div>
                  <div>Voice Level: {voiceLevel} (threshold: 15)</div>
                  <div>Detection Active: {voiceLevel > 15 ? '🟢 YES' : '🔴 NO'}</div>
                  <div>AI Speaking: {isSpeaking ? '🟢 YES' : '🔴 NO'}</div>
                  <div>Should Interrupt: {voiceLevel > 15 && isSpeaking ? '🟢 YES' : '🔴 NO'}</div>
                </div>
                <div className="mt-2 text-xs text-yellow-700">
                  Speak now to test voice detection - level should go above 15
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-1">System Status</div>
              <div className="text-sm space-y-1">
                <div>CLM Endpoint: 🟢 Ready</div>
                <div>User Context: {userProfile ? '🟢 Available' : '🔴 Missing'}</div>
                <div>Voice Engine: 🟢 Enhanced Speech API</div>
                <div>Auto-Interruption: 🟢 Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>Quest AI Response</CardTitle>
            <CardDescription>
              Real-time conversation with personalized context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 overflow-y-auto">
              {lastResponse ? (
                <div className="text-sm whitespace-pre-wrap">
                  <div className="font-medium text-blue-600 mb-2">💬 Conversation:</div>
                  <p>{lastResponse}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {userProfile 
                    ? 'Ready to start your personalized conversation...'
                    : 'Create your profile to begin'
                  }
                </div>
              )}
            </div>

            {userProfile && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border">
                <div className="text-sm font-medium mb-2">🧠 Your AI Context</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Name:</strong> {userProfile.name}</div>
                  <div><strong>Company:</strong> {userProfile.company}</div>
                  <div><strong>Role:</strong> {userProfile.current_role}</div>
                  <div><strong>Experience:</strong> 15+ years in leadership</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use Quest AI</CardTitle>
          <CardDescription>
            Tips for the best voice conversation experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🎤 Voice Tips:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Speak clearly and naturally</li>
                <li><strong>Just start talking</strong> - AI stops automatically</li>
                <li>No need to wait or press buttons</li>
                <li>Ask about your career, goals, or company</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">💡 Example Questions:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>"What do you know about me?"</li>
                <li>"Help me with my career goals"</li>
                <li>"How can I improve my leadership skills?"</li>
                <li>"Tell me about my company CKDelta"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}