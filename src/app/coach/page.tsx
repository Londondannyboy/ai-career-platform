'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react'

type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function CoachPage() {
  const { user, isLoaded } = useUser()
  const [conversationState, setConversationState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const recognitionRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{id: string; title: string; transcript: string; ai_analysis: string; created_at: string}[]>([])
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (isLoaded && user?.id) {
      // Load previous conversation when user is loaded
      loadPreviousConversation(user.id)
    }
  }, [isLoaded, user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // CRITICAL: Cleanup speech and audio when component unmounts or user leaves page
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🚨 Page unloading - stopping all speech and audio')
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContext) {
        audioContext.close()
      }
    }

    // Add event listeners for page navigation and unload
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    
    // Cleanup on component unmount
    return () => {
      console.log('🧹 Coach component unmounting - cleaning up audio')
      handleBeforeUnload()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
    }
  }, [audioContext]) // Include audioContext as dependency

  const loadPreviousConversation = async (userId: string) => {
    try {
      // Get the most recent coaching session
      const { data: recentSession } = await supabase
        .from('repo_sessions')
        .select('id, title, transcript, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'voice_coaching')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (recentSession) {
        setLastSessionId(recentSession.id)
        console.log('Found previous coaching session:', recentSession.title)
      }
      
      // Load conversation history for display  
      console.log('🔍 Loading conversation history for user:', userId)
      const { data: allSessions, error } = await supabase
        .from('repo_sessions')
        .select('id, title, transcript, ai_analysis, created_at')
        .eq('user_id', userId)
        .eq('session_type', 'voice_coaching')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('📊 Conversation history result:', { 
        allSessions, 
        error, 
        sessionCount: allSessions?.length || 0,
        userId 
      })
      
      if (error) {
        console.error('❌ Database error loading conversation history:', error)
      }
      
      if (allSessions && allSessions.length > 0) {
        setConversationHistory(allSessions)
        console.log('✅ Loaded', allSessions.length, 'previous sessions')
      } else {
        console.log('ℹ️ No previous coaching sessions found for user', userId)
        setConversationHistory([]) // Ensure it's set to empty array
      }
    } catch {
      console.log('No previous conversation found, starting fresh')
    }
  }

  const startConversation = async () => {
    try {
      // Check if browser supports speech recognition
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Your browser does not support speech recognition. Please use Chrome, Safari, or Edge.')
        return
      }

      // Request microphone permission with detailed logging
      console.log('🎤 Requesting microphone permission...')
      console.log('🔍 Navigator available:', !!navigator.mediaDevices)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      
      console.log('✅ Microphone stream obtained:', {
        active: stream.active,
        id: stream.id,
        tracks: stream.getTracks().length,
        audioTracks: stream.getAudioTracks().length
      })
      streamRef.current = stream
      
      // Set up audio monitoring for immediate interruption detection
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)() // eslint-disable-line @typescript-eslint/no-explicit-any
        const source = audioCtx.createMediaStreamSource(stream)
        const analyser = audioCtx.createAnalyser()
        
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.1
        source.connect(analyser)
        
        setAudioContext(audioCtx)
        setAudioAnalyser(analyser)
        
        console.log('🎤 Audio monitoring setup complete')
      } catch (error) {
        console.log('⚠️ Audio monitoring setup failed:', error)
      }
      
      setIsConnected(true)
      
      // Get user's name for personalized greeting
      let userName = 'there'
      if (user?.firstName) {
        userName = user.firstName
      }
      
      // Create personalized welcome message
      let welcomeText = `Hi ${userName}! I'm your AI career coach.`
      
      // Add context if previous session exists
      if (lastSessionId) {
        welcomeText += " I can see we've talked before. Feel free to continue where we left off or start something new."
      } else {
        welcomeText += " I can hear you now! What would you like to discuss about your career?"
      }
      
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: welcomeText,
        isUser: false,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
      
      // Start continuous listening immediately and speak welcome
      startContinuousListening()
      
      // Speak welcome message if voice is enabled
      if (isVoiceEnabled) {
        await speakTextWithInterruption(welcomeMessage.text)
      }
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert(`Could not access microphone: ${error}. Please check permissions and try again.`)
    }
  }

  const endConversation = () => {
    // Stop all audio/speech processes
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (audioContext) {
      audioContext.close()
      setAudioContext(null)
      setAudioAnalyser(null)
    }
    stopSpeaking()
    
    setIsConnected(false)
    setConversationState('idle')
    
    // Save conversation to repo
    saveConversationToRepo()
  }

  const stopSpeaking = () => {
    console.log('🛑 FORCE STOPPING AI SPEECH')
    // Aggressively stop any current speech synthesis
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel()
      // Call cancel multiple times to ensure it stops
      setTimeout(() => speechSynthesis.cancel(), 10)
      setTimeout(() => speechSynthesis.cancel(), 50)
    }
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.onend = null
      speechSynthesisRef.current.onerror = null
      speechSynthesisRef.current = null
    }
    console.log('✅ AI speech stopped')
  }

  const startAudioLevelMonitoring = () => {
    if (!audioAnalyser) {
      console.log('⚠️ No audio analyser available for level monitoring')
      return
    }
    
    const bufferLength = audioAnalyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let lastSpeechTime = 0
    
    const checkAudioLevel = () => {
      if (!audioAnalyser || !isConnected) return
      
      audioAnalyser.getByteFrequencyData(dataArray)
      
      // Calculate average audio level
      const sum = dataArray.reduce((a, b) => a + b, 0)
      const average = sum / bufferLength
      
      // Detect speech activity (adjust threshold as needed)
      const speechThreshold = 10 // Lower = more sensitive
      const currentTime = Date.now()
      
      if (average > speechThreshold) {
        // Speech detected!
        console.log('🔊 Audio level detected:', average, 'State:', conversationState)
        if (conversationState === 'speaking' && currentTime - lastSpeechTime > 100) {
          console.log('🎤 AUDIO LEVEL INTERRUPTION - Level:', average, 'Threshold:', speechThreshold)
          stopSpeaking()
          setConversationState('listening')
          lastSpeechTime = currentTime
        }
      }
      
      // Continue monitoring
      if (isConnected) {
        requestAnimationFrame(checkAudioLevel)
      }
    }
    
    console.log('🔊 Starting audio level monitoring with threshold:', 10)
    checkAudioLevel()
  }

  const startContinuousListening = () => {
    if (!streamRef.current) {
      console.log('No audio stream available')
      return
    }
    
    console.log('Starting continuous listening...')
    
    // Use Web Speech API for continuous speech recognition
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognitionRef.current = recognition
        
        recognition.continuous = true // Key change: continuous listening
        recognition.interimResults = true
        recognition.lang = 'en-US'
        
        recognition.onstart = () => {
          console.log('🎙️ Continuous speech recognition started')
          if (conversationState === 'idle') {
            setConversationState('listening')
          }
        }
        
        // IMMEDIATE interruption on speech start (before any transcription)
        recognition.onspeechstart = () => {
          console.log('🚨 SPEECH DETECTED - IMMEDIATE INTERRUPTION CHECK')
          if (conversationState === 'speaking') {
            console.log('💥 INTERRUPTING AI IMMEDIATELY - USER STARTED SPEAKING')
            stopSpeaking()
            setConversationState('listening')
          }
        }
        
        recognition.onspeechend = () => {
          console.log('🔇 Speech ended')
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const lastResult = event.results[event.results.length - 1]
          const transcript = lastResult[0].transcript.trim()
          const isInterim = !lastResult.isFinal
          
          console.log('📝 Transcript:', transcript, 'interim:', isInterim, 'state:', conversationState)
          
          // Additional interruption check on ANY text (backup to onspeechstart)
          if (conversationState === 'speaking' && transcript.length > 0) {
            console.log('🔄 BACKUP INTERRUPTION - User transcription detected')
            stopSpeaking()
            setConversationState('listening')
          }
          
          // Process final results for actual conversation
          if (lastResult.isFinal && transcript.length > 2) {
            console.log('✅ Processing final user input:', transcript)
            handleUserInput(transcript)
          }
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            // These are common and expected - just restart
            setTimeout(() => {
              if (isConnected && recognitionRef.current) {
                console.log('Restarting recognition after error:', event.error)
                recognition.start()
              }
            }, 1000)
          } else {
            // More serious error
            const errorMessage = {
              id: Date.now().toString(),
              text: `Speech recognition error: ${event.error}. Trying to reconnect...`,
              isUser: false,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
          }
        }
        
        recognition.onend = () => {
          console.log('Speech recognition ended - restarting if connected')
          if (isConnected) {
            setTimeout(() => {
              try {
                recognition.start()
              } catch (error) {
                console.log('Could not restart recognition:', error)
              }
            }, 1000)
          }
        }
        
        recognition.start()
        
        // Start audio level monitoring for ultra-fast interruption
        startAudioLevelMonitoring()
      } else {
        throw new Error('Speech recognition not supported')
      }
    } catch (error) {
      console.error('Failed to start continuous speech recognition:', error)
      const fallbackMessage = {
        id: Date.now().toString(),
        text: "Speech recognition isn't working. You can try refreshing the page.",
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, fallbackMessage])
    }
  }

  const handleUserInput = (transcript: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      isUser: true,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setConversationState('thinking')
    
    // Process with AI
    setTimeout(() => {
      generateAIResponse(transcript)
    }, 1500)
  }

  // Removed simulateUserInput - using real speech recognition only

  const generateAIResponse = async (userInput: string) => {
    try {
      setConversationState('speaking')
      
      // Get user profile for context
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()
      
      // Get recent repo sessions for context
      const { data: recentSessions } = await supabase
        .from('repo_sessions')
        .select('transcript, ai_analysis')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3)
      
      // Call OpenAI API with context
      const response = await fetch('/api/coach-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          conversationHistory: messages,
          userProfile: profile,
          recentSessions: recentSessions || []
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }
      
      const result = await response.json()
      const aiResponse = result.response
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // Speak AI response if voice is enabled
      if (isVoiceEnabled) {
        await speakTextWithInterruption(aiResponse)
      }
      
      // Let continuous listening handle the next input
      setConversationState('listening')
      
    } catch (error) {
      console.error('Error generating AI response:', error)
      // Fallback response
      const fallbackResponse = "I'm having trouble processing that right now. Could you try rephrasing your question?"
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      if (isVoiceEnabled) {
        await speakTextWithInterruption(fallbackResponse)
      }
      
      // Let continuous listening handle the next input
      setConversationState('listening')
    }
  }

  const speakTextWithInterruption = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isVoiceEnabled || isMuted) {
        resolve()
        return
      }
      
      // Stop any existing speech first
      stopSpeaking()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      speechSynthesisRef.current = utterance
      
      utterance.onstart = () => {
        console.log('🔊 Speech synthesis started')
        setConversationState('speaking')
      }
      
      utterance.onend = () => {
        console.log('✅ Speech synthesis ended')
        setConversationState('listening')
        speechSynthesisRef.current = null
        resolve()
      }
      
      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event)
        setConversationState('listening')
        speechSynthesisRef.current = null
        resolve()
      }
      
      console.log('🗣️ Starting speech synthesis:', {
        text: text.substring(0, 50) + '...',
        rate: utterance.rate,
        volume: utterance.volume,
        voicesAvailable: speechSynthesis.getVoices().length,
        speechSynthesisSupported: 'speechSynthesis' in window
      })
      
      speechSynthesis.speak(utterance)
    })
  }

  const extractTopics = (text: string): string => {
    if (!text) return 'General career discussion'
    
    const keywords = {
      'job search': ['job search', 'job hunting', 'looking for work', 'job applications', 'job interview'],
      'career change': ['career change', 'switching careers', 'new field', 'transition'],
      'promotion': ['promotion', 'advancement', 'moving up', 'next level'],
      'salary negotiation': ['salary', 'compensation', 'negotiate', 'raise', 'pay'],
      'skills development': ['skills', 'learning', 'training', 'development', 'courses'],
      'networking': ['networking', 'connections', 'contacts', 'professional network'],
      'work-life balance': ['work life', 'balance', 'stress', 'burnout', 'wellness'],
      'resume': ['resume', 'cv', 'curriculum vitae'],
      'interview prep': ['interview', 'interviewing', 'interview preparation']
    }
    
    const foundTopics: string[] = []
    const lowerText = text.toLowerCase()
    
    for (const [topic, phrases] of Object.entries(keywords)) {
      if (phrases.some(phrase => lowerText.includes(phrase))) {
        foundTopics.push(topic)
      }
    }
    
    if (foundTopics.length === 0) {
      return 'General career discussion'
    } else if (foundTopics.length === 1) {
      return `Discussed ${foundTopics[0]}`
    } else if (foundTopics.length === 2) {
      return `Discussed ${foundTopics[0]} and ${foundTopics[1]}`
    } else {
      return `Discussed ${foundTopics[0]}, ${foundTopics[1]} and ${foundTopics.length - 2} other topics`
    }
  }

  const saveConversationToRepo = async () => {
    if (!user || messages.length === 0) {
      console.log('⚠️ Not saving conversation - no user or messages:', { user: !!user, messageCount: messages.length })
      return
    }
    
    try {
      const conversation = messages.map(m => `${m.isUser ? 'You' : 'AI Coach'}: ${m.text}`).join('\n\n')
      
      console.log('💾 Saving conversation to repo:', {
        userId: user.id,
        messageCount: messages.length,
        conversationLength: conversation.length
      })
      
      const { data, error } = await supabase.from('repo_sessions').insert({
        user_id: user.id,
        title: `Career Coaching Session ${new Date().toLocaleDateString()}`,
        transcript: conversation,
        ai_analysis: 'Real-time coaching conversation completed.',
        session_type: 'voice_coaching',
        privacy_level: 'private'
      })
      
      if (error) {
        console.error('❌ Database error saving conversation:', error)
      } else {
        console.log('✅ Conversation saved successfully:', data)
        // Refresh conversation history after saving
        if (user?.id) {
          loadPreviousConversation(user.id)
        }
      }
    } catch (error) {
      console.error('💥 Error saving conversation:', error)
    }
  }

  const getStateIndicator = () => {
    switch (conversationState) {
      case 'listening':
        return (
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Listening...</span>
          </div>
        )
      case 'thinking':
        return (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Thinking...</span>
          </div>
        )
      case 'speaking':
        return (
          <div className="flex items-center space-x-2 text-purple-600">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Speaking...</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>Ready to start</span>
          </div>
        )
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Career Coach</h1>
          <p className="mt-2 text-gray-600">
            Have a real-time conversation with your AI career coach. Just speak naturally!
          </p>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            🔧 Version: 2.0.1 - Ultra-Sensitive Interruption + Cleanup Fix
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Career Coaching Session</span>
                  {getStateIndicator()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Mic className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <p>Click &ldquo;Start Conversation&rdquo; to begin your coaching session</p>
                      <p className="text-sm">Your AI coach will guide you through career discussions</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Controls */}
                <div className="border-t pt-4">
                  <div className="flex justify-center space-x-4">
                    {!isConnected ? (
                      <Button 
                        onClick={startConversation}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Phone className="mr-2 h-5 w-5" />
                        Start Conversation
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsMuted(!isMuted)}
                          variant={isMuted ? "destructive" : "outline"}
                          size="lg"
                        >
                          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        
                        <Button
                          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                          variant={!isVoiceEnabled ? "destructive" : "outline"}
                          size="lg"
                        >
                          {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        </Button>
                        
                        <Button 
                          onClick={endConversation}
                          variant="destructive"
                          size="lg"
                        >
                          <PhoneOff className="mr-2 h-5 w-5" />
                          End Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-medium ${
                      isConnected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Voice Output</span>
                    <span className={`text-sm font-medium ${
                      isVoiceEnabled ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isVoiceEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {conversationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {conversationHistory.map((session, index) => {
                      const date = new Date(session.created_at).toLocaleDateString()
                      const topics = extractTopics(session.transcript || session.ai_analysis || '')
                      return (
                        <div key={session.id} className="border-b pb-2 last:border-b-0">
                          <div className="text-sm font-medium text-gray-900">
                            {index === 0 ? 'Last time' : index === 1 ? 'Previous session' : `${index + 1} sessions ago`}
                          </div>
                          <div className="text-xs text-gray-500">{date}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {topics || 'General career discussion'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 mb-2">
                      No previous coaching sessions yet
                    </div>
                    <div className="text-xs text-gray-400">
                      Your conversation history will appear here after your first session
                    </div>
                    {/* Debug info */}
                    <div className="text-xs text-gray-300 mt-2 font-mono space-y-1">
                      <div>Debug: {conversationHistory.length} sessions loaded</div>
                      <div>User ID: {user?.id?.substring(0, 8)}...</div>
                      <div>Email: {user?.emailAddresses?.[0]?.emailAddress}</div>
                      <button 
                        onClick={() => {
                          console.log('🧪 Manual debug - User info:', { 
                            userId: user?.id, 
                            email: user?.emailAddresses?.[0]?.emailAddress, 
                            conversationHistory: conversationHistory.length 
                          })
                          if (user?.id) loadPreviousConversation(user.id)
                        }}
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        🔄 Reload History
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Speak naturally and clearly</p>
                  <p>• <strong>Try interrupting me!</strong> Start talking while I&apos;m speaking</p>
                  <p>• Be specific about your challenges</p>
                  <p>• Ask follow-up questions</p>
                  <p>• Your conversation is private and saved to your repo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}