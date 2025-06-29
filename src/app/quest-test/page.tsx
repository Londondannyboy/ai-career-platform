'use client'

import { useState, useEffect } from 'react'
import { useVoice, VoiceReadyState } from '@humeai/voice-react'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff } from 'lucide-react'

export default function QuestTestPage() {
  const [messages, setMessages] = useState<Array<{id: string, content: string, role: 'user' | 'assistant'}>>([])
  
  // Official Hume AI Voice React SDK integration - using correct API
  const { connect, disconnect, readyState, messages: voiceMessages } = useVoice()

  const isConnected = readyState === VoiceReadyState.OPEN
  const isConnecting = readyState === VoiceReadyState.CONNECTING

  // Handle voice messages from official SDK
  useEffect(() => {
    if (voiceMessages && voiceMessages.length > 0) {
      const latestMessage = voiceMessages[voiceMessages.length - 1]
      console.log('📨 Official Hume message:', latestMessage)
      
      // Add message to our local state
      if (latestMessage.type === 'user_message' && latestMessage.message?.content) {
        const content = latestMessage.message.content
        setMessages(prev => {
          const exists = prev.some(m => m.content === content && m.role === 'user')
          if (exists) return prev
          
          return [...prev, {
            id: Date.now().toString(),
            content: content,
            role: 'user'
          }]
        })
      } else if (latestMessage.type === 'assistant_message' && latestMessage.message?.content) {
        const content = latestMessage.message.content
        setMessages(prev => {
          const exists = prev.some(m => m.content === content && m.role === 'assistant')
          if (exists) return prev
          
          return [...prev, {
            id: Date.now().toString(), 
            content: content,
            role: 'assistant'
          }]
        })
      }
    }
  }, [voiceMessages])

  const handleConnect = async () => {
    try {
      console.log('🔗 Connecting with official Hume SDK...')
      await connect()
    } catch (error) {
      console.error('❌ Connection failed:', error)
    }
  }

  const handleDisconnect = () => {
    console.log('🔌 Disconnecting with official SDK...')
    disconnect()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Quest Test - Official SDK
          </h1>
          <p className="mt-2 text-gray-600">
            Testing official Hume AI Voice React SDK + Vercel AI SDK integration
          </p>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            🧪 Version: OFFICIAL SDK TEST - Following Documentation Exactly
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Official Implementation */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Official Hume AI SDK</span>
                <div className={`flex items-center space-x-2 ${
                  isConnected ? 'text-green-600' : 
                  isConnecting ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 
                    isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span>{
                    isConnected ? 'Connected' : 
                    isConnecting ? 'Connecting...' : 'Offline'
                  }</span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mic className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>Click &ldquo;Connect&rdquo; to start official Hume AI voice chat</p>
                    <p className="text-sm">This uses the official SDK directly</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
                            : 'bg-white text-gray-900 shadow-sm border'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Controls */}
              <div className="border-t pt-4">
                <div className="flex justify-center space-x-4">
                  {!isConnected ? (
                    <Button 
                      onClick={handleConnect}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      disabled={isConnecting}
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      {isConnecting ? 'Connecting...' : 'Connect Official SDK'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleDisconnect}
                      variant="destructive"
                      size="lg"
                    >
                      <MicOff className="mr-2 h-5 w-5" />
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status and Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Official SDK Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ready State</span>
                  <span className="text-sm font-medium">{readyState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Messages</span>
                  <span className="text-sm font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Voice Messages</span>
                  <span className="text-sm font-medium">{voiceMessages?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SDK</span>
                  <span className="text-sm font-medium text-green-600">@humeai/voice-react</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium mb-2">Implementation Comparison</h4>
                <div className="space-y-2 text-sm">
                  <p>🟢 <strong>Official SDK</strong>: Uses @humeai/voice-react hook</p>
                  <p>🔵 <strong>Custom Implementation</strong>: Manual WebSocket</p>
                  <p>🎯 <strong>Goal</strong>: Compare which approach works</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  This test page uses the exact official Hume AI documentation approach to see if it works better than our custom implementation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}