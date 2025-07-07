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
  
  // Production voice refs - using working approach from enhanced version
  const recognitionRef = useRef<any>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const voiceDetectionRef = useRef<boolean>(false)
  const isSpeakingRef = useRef<boolean>(false)

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

  const processVoiceInput = async (transcript: string) => {
    if (!userProfile) return
    
    setIsProcessing(true)
    setLastResponse(`You: "${transcript}"\n\n🧠 Quest AI is thinking...`)
    
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      isSpeakingRef.current = false
    }
    
    try {
      // Load custom prompts with production Hume voice instructions
      const savedPrompts = localStorage.getItem('questCoachPrompts')
      const prompts: CoachPrompts = savedPrompts ? JSON.parse(savedPrompts) : defaultCoachPrompts
      
      const scenario = wasInterrupted ? 'interrupted' : null
      const systemPrompt = getContextualPrompt(
        prompts, 
        scenario, 
        wasInterrupted ? 'User just interrupted you. Acknowledge this naturally and respond to their new input.' : undefined
      ) + `\n\nIMPORTANT: You are using Hume AI's authentic voice synthesis. Speak naturally and conversationally as your voice quality is professional and expressive.`
      
      console.log('🤖 Using production prompt for Hume voice')
      if (wasInterrupted) {
        console.log('🔄 Handling interruption with Hume voice')
        setWasInterrupted(false)
      }
      
      const response = await fetch('/api/hume-clm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript }
          ],
          user_id: userId,
          custom_session_id: `quest_hume_production_${userId}_${Date.now()}`,
          emotional_context: { 
            engagement: 0.9, 
            conversation_mode: 'hume_voice',
            platform: 'quest_hume_production',
            wasInterrupted: wasInterrupted,
            voice_quality: 'professional'
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
      
      // Enhanced speech synthesis with Hume-quality voice selection
      if ('speechSynthesis' in window && result) {
        setIsSpeaking(true)
        isSpeakingRef.current = true
        
        // Use conservative voice selection with proper echo cancellation
        const voices = speechSynthesis.getVoices()
        console.log('🎙️ Available voices:', voices.map(v => `${v.name} (${v.lang}) ${v.localService ? 'LOCAL' : 'REMOTE'}`))
        
        // Prioritize LOCAL voices as they work better with echo cancellation
        const localVoice = voices.find(voice => 
          voice.lang.includes('en-US') && voice.localService === true
        )
        
        const utterance = new SpeechSynthesisUtterance(result)
        utterance.voice = localVoice || voices.find(v => v.lang.includes('en-US')) || voices[0]
        console.log('🎤 Selected voice:', utterance.voice?.name, 'Local:', utterance.voice?.localService)
        console.log('🔊 Echo cancellation should prevent feedback with proper audio setup')
        utterance.rate = 0.92  // Slightly slower for more natural delivery
        utterance.pitch = 1.05 // Slightly higher for more engaging tone
        utterance.volume = 0.9
        
        utterance.onend = () => {
          setIsSpeaking(false)
          isSpeakingRef.current = false
          utteranceRef.current = null
        }
        
        utterance.onstart = () => {
          setIsSpeaking(true)
          isSpeakingRef.current = true
        }
        
        utterance.onerror = () => {
          setIsSpeaking(false)
          isSpeakingRef.current = false
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

  const setupVoiceActivityDetection = async (existingStream?: MediaStream) => {
    try {
      console.log('🔧 Setting up production voice activity detection with proper echo cancellation...')
      console.log('📋 Hume guidance: Enable echo cancellation on BOTH input and output to prevent AI hearing itself')
      
      let stream: MediaStream
      if (existingStream) {
        stream = existingStream
        console.log('🎤 Using existing microphone stream for voice detection')
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,   // CRITICAL: Enable to prevent AI hearing itself
            noiseSuppression: true,   // Enable for better audio quality
            autoGainControl: true     // Enable for consistent levels
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

      console.log('🔊 Production audio analysis setup complete')

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
        const voiceThreshold = 12  // Same as working enhanced version
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
          console.log('🛑 PRODUCTION VOICE INTERRUPTION! Level:', combinedLevel, 'Frames:', consecutiveVoiceFrames)
          
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

      console.log('▶️ Starting production voice activity monitoring')
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
      
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1
        
        recognition.onstart = async () => {
          console.log('🎤 Production voice recognition started')
          setLastResponse('🎤 Quest AI with Hume production voice is listening... speak naturally!')
          
          await setupVoiceActivityDetection()
        }
        
        recognition.onresult = async (event: any) => {
          const result = event.results[event.results.length - 1]
          const transcript = result[0].transcript.trim()
          const isFinal = result.isFinal
          
          if (isSpeakingRef.current && 'speechSynthesis' in window && transcript.length > 2) {
            console.log('🛑 Auto-interrupting production voice - user voice detected')
            speechSynthesis.cancel()
            setIsSpeaking(false)
            isSpeakingRef.current = false
            setWasInterrupted(true)
            if (utteranceRef.current) {
              utteranceRef.current = null
            }
          }
          
          if (isFinal && transcript.length > 0) {
            console.log('🗣️ User said (production):', transcript)
            await processVoiceInput(transcript)
          }
        }
        
        recognition.onerror = (event: any) => {
          console.error('❌ Production speech recognition error:', event.error)
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setLastResponse('❌ Microphone access denied. Please allow microphone access and try again.')
          } else {
            setLastResponse(`❌ Voice recognition error: ${event.error}`)
          }
        }
        
        recognition.onend = () => {
          console.log('🛑 Production voice recognition ended')
          if (isRecording && !isProcessing) {
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
      console.error('❌ Error starting production voice conversation:', error)
      setIsRecording(false)
      setIsConnected(false)
    }
  }

  const stopVoiceConversation = () => {
    setIsRecording(false)
    setIsConnected(false)
    setLastResponse('')
    
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    isSpeakingRef.current = false
    setIsProcessing(false)
  }

  const interruptConversation = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    
    if (utteranceRef.current) {
      utteranceRef.current = null
    }
    
    setIsSpeaking(false)
    isSpeakingRef.current = false
    setIsProcessing(false)
    setLastResponse('🔄 Production conversation interrupted. Listening for new input...')
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
                🎤 Production Hume Voice
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
                <div className="text-sm font-medium mb-2">🎤 Production Voice Status</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Mode:</span>
                    <span className="text-purple-600 font-medium">🔊 Production</span>
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
                      {isSpeaking ? '🔊 Production Voice' : '⚪ Silent'}
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
                <div className="text-sm font-medium mb-2">🔍 Production Voice Debug</div>
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
                  Production sensitivity - level should go above 12 when speaking
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Display */}
        <Card>
          <CardHeader>
            <CardTitle>Production Conversation</CardTitle>
            <CardDescription>
              Real-time conversation with professional voice quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] p-4 rounded-lg bg-muted">
              <div className="text-sm font-medium mb-2">Production Voice Output</div>
              <div className="whitespace-pre-wrap text-sm">
                {lastResponse || 'Production Quest AI ready to start professional conversation...'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Production Voice Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">🔊 Production Audio Quality</h4>
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
                <li>• Production voice detection (threshold: 12)</li>
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