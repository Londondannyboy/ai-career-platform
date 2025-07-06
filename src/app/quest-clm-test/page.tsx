'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@clerk/nextjs'

interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  implementation: 'original' | 'clm'
}

interface TestMetrics {
  responseTime: number
  hasUserContext: boolean
  emotionalContext?: any
  implementation: 'original' | 'clm'
}

export default function QuestCLMTestPage() {
  const { userId, isLoaded } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [testMode, setTestMode] = useState<'original' | 'clm'>('clm')
  const [metrics, setMetrics] = useState<TestMetrics[]>([])
  const [lastResponse, setLastResponse] = useState<string>('')
  const [userContext, setUserContext] = useState<any>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (isLoaded && userId) {
      fetchUserContext()
    }
  }, [isLoaded, userId])

  const fetchUserContext = async () => {
    try {
      // This would normally fetch from your user context API
      setUserContext({
        name: 'Test User',
        hasProfile: true,
        implementation: testMode
      })
    } catch (error) {
      console.error('Error fetching user context:', error)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudioMessage(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // For now, use a simple prompt for user input since we don't have Whisper API
    // In production, this would send audioBlob to /api/transcribe
    const userInput = prompt("Enter your message (speech recognition not available in this test):")
    
    if (userInput && userInput.trim()) {
      return userInput.trim()
    }
    
    // Fallback to test message
    return "Hello, I'm testing the new CLM integration"
  }

  const processAudioMessage = async (audioBlob: Blob) => {
    const startTime = Date.now()
    
    try {
      // Use Web Speech API for transcription (fallback to hardcoded for testing)
      const userMessage = await transcribeAudio(audioBlob)
      
      // Add user message to conversation
      const userTurn: ConversationTurn = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        implementation: testMode
      }
      setConversation(prev => [...prev, userTurn])

      // Call appropriate API based on test mode
      const apiEndpoint = testMode === 'clm' ? '/api/hume-clm' : '/api/quest-conversation'
      
      let response: string
      
      if (testMode === 'clm') {
        response = await callHumeCLM(userMessage)
      } else {
        response = await callOriginalAPI(userMessage)
      }

      const responseTime = Date.now() - startTime

      // Add assistant response to conversation
      const assistantTurn: ConversationTurn = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        implementation: testMode
      }
      setConversation(prev => [...prev, assistantTurn])
      setLastResponse(response)

      // Record metrics
      const metric: TestMetrics = {
        responseTime,
        hasUserContext: testMode === 'clm',
        implementation: testMode
      }
      setMetrics(prev => [...prev, metric])

      // Speak the response
      await speakResponse(response)

    } catch (error) {
      console.error('Error processing audio:', error)
    }
  }

  const callHumeCLM = async (userMessage: string): Promise<string> => {
    // Use Dan's hardcoded ID if no Clerk user is logged in
    const effectiveUserId = userId || 'user_2cNjk7xDvHPeCKhDLxH0GBMqVzI'
    
    console.log('Calling CLM with userId:', effectiveUserId)
    
    const response = await fetch('/api/hume-clm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are Quest, an AI career coach.' },
          { role: 'user', content: userMessage }
        ],
        custom_session_id: `user_${effectiveUserId}_${Date.now()}`,
        user_id: effectiveUserId,
        emotional_context: { engagement: 0.8, stress: 0.2 }
      })
    })

    if (!response.ok) {
      throw new Error('CLM API failed')
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    let result = ''
    
    if (reader) {
      const decoder = new TextDecoder()
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Handle the streaming format: 0:"content"
            const match = line.match(/0:"([^"]*)"/)
            if (match) {
              result += match[1]
            }
          } else if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            // Handle standard SSE format
            try {
              const data = JSON.parse(line.slice(6))
              if (data.choices?.[0]?.delta?.content) {
                result += data.choices[0].delta.content
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    console.log('CLM Response:', result)
    return result || 'Hello! I\'m Quest with enhanced context. How can I help you today?'
  }

  const callOriginalAPI = async (userMessage: string): Promise<string> => {
    const response = await fetch('/api/quest-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: userMessage,
        conversationHistory: [],
        userProfile: null, // Original doesn't have context
        emotionalContext: null
      })
    })

    if (!response.ok) {
      throw new Error('Original API failed')
    }

    const data = await response.json()
    return data.response || 'Hello! I\'m the original Quest. How can I help?'
  }

  const speakResponse = async (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  const testTextMessage = async () => {
    const testMessage = "Can you help me prepare for a software engineering interview?"
    
    const userTurn: ConversationTurn = {
      role: 'user',
      content: testMessage,
      timestamp: new Date(),
      implementation: testMode
    }
    setConversation(prev => [...prev, userTurn])

    await processAudioMessage(new Blob()) // Dummy blob for text test
  }

  const clearConversation = () => {
    setConversation([])
    setMetrics([])
  }

  const createUserProfile = async () => {
    if (!userId) return
    
    try {
      // Create Dan Keegan profile for the logged-in user
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
      console.log('User profile creation result:', result)
      
      // Update user context
      fetchUserContext()
      
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  const averageResponseTime = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length 
    : 0

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest CLM Integration Test</h1>
        <p className="text-muted-foreground">
          Compare original Hume integration vs new CLM with user context
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Switch between implementations and test voice interaction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={testMode} onValueChange={(value) => setTestMode(value as 'original' | 'clm')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="original">Original</TabsTrigger>
                <TabsTrigger value="clm">CLM Enhanced</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Badge variant={testMode === 'clm' ? 'default' : 'secondary'}>
                {testMode === 'clm' ? 'CLM with Context' : 'Original Implementation'}
              </Badge>
              
              {userContext && (
                <Badge variant="outline">
                  User Context: {userContext.hasProfile ? 'Available' : 'None'}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={isRecording ? stopRecording : startRecording}
                className="w-full"
                variant={isRecording ? "destructive" : "default"}
              >
                {isRecording ? '🛑 Stop Recording' : '🎤 Start Voice Test'}
              </Button>
              
              <Button 
                onClick={testTextMessage}
                variant="outline"
                className="w-full"
              >
                📝 Test Text Message
              </Button>
              
              <Button 
                onClick={clearConversation}
                variant="outline"
                className="w-full"
              >
                🗑️ Clear Conversation
              </Button>
              
              <Button 
                onClick={createUserProfile}
                variant="outline"
                className="w-full"
                disabled={!userId}
              >
                👤 Create My Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conversation */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Real-time conversation with {testMode} implementation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto space-y-3">
              {conversation.map((turn, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  turn.role === 'user' 
                    ? 'bg-blue-50 ml-4' 
                    : 'bg-gray-50 mr-4'
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">
                      {turn.role === 'user' ? 'You' : 'Quest'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {turn.implementation}
                    </Badge>
                  </div>
                  <p className="text-sm">{turn.content}</p>
                  <span className="text-xs text-muted-foreground">
                    {turn.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {conversation.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Start a conversation to see the comparison
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Compare response times and context awareness
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(averageResponseTime)}ms
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Response Time
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.filter(m => m.hasUserContext).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  With Context
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Recent Metrics</h4>
              {metrics.slice(-5).map((metric, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{metric.implementation}</span>
                  <span>{metric.responseTime}ms</span>
                  <Badge variant={metric.hasUserContext ? "default" : "secondary"} className="text-xs">
                    {metric.hasUserContext ? 'Context' : 'No Context'}
                  </Badge>
                </div>
              ))}
            </div>

            {lastResponse && (
              <div>
                <h4 className="font-medium mb-2">Last Response Preview</h4>
                <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                  {lastResponse.substring(0, 100)}...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={isLoaded ? "default" : "secondary"}>
                {isLoaded ? '✅ Auth Ready' : '⏳ Loading...'}
              </Badge>
              
              <Badge variant={userId ? "default" : "destructive"}>
                {userId ? `👤 Clerk ID: ${userId.substring(0, 12)}...` : '❌ No User'}
              </Badge>
              
              <Badge variant="outline">
                Using: {userId || 'user_2cNjk7xDvHPeCKhDLxH0GBMqVzI'}
              </Badge>
              
              <Badge variant={userContext ? "default" : "secondary"}>
                {userContext ? '📋 Context Loaded' : '⏳ Loading Context...'}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Testing: {testMode === 'clm' ? 'Enhanced CLM' : 'Original'} | 
              Turns: {conversation.length} | 
              Avg: {Math.round(averageResponseTime)}ms
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}