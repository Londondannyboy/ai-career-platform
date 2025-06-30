# Voice Integration Module Documentation

## Overview
This document captures the working implementation pattern for integrating Hume AI's Empathic Voice Interface (EVI) with React applications. This pattern was successfully developed for the AI Career Platform and can be reused across different applications.

## Key Success Pattern: Official SDK vs Custom Implementation

### ✅ WORKING APPROACH - Official SDK
**File**: `src/app/quest/page.tsx` (Lines 41-46)
```typescript
// 🎉 OFFICIAL HUME AI SDK - This is what works!
const { connect, disconnect, readyState, messages: voiceMessages } = useVoice()

const isConnected = readyState === VoiceReadyState.OPEN
const isConnecting = readyState === VoiceReadyState.CONNECTING
```

### ❌ FAILED APPROACH - Custom WebSocket
- Manual WebSocket connection implementation
- Complex audio processing and state management
- Environment variable issues and connection problems

## Required Dependencies

```json
{
  "@humeai/voice-react": "latest",
  "@ai-sdk/openai": "latest", 
  "ai": "latest"
}
```

## Core Implementation Pattern

### 1. Root Layout Setup
**File**: `src/app/layout.tsx` (Lines 28-36)

```typescript
<VoiceProvider 
  auth={{
    type: "apiKey",
    value: process.env.NEXT_PUBLIC_HUME_API_KEY || "",
  }}
  configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID || "fallback-config-id"}
>
  {children}
</VoiceProvider>
```

**Critical Pattern**: Always provide fallback values for environment variables to prevent production runtime issues.

### 2. Voice Hook Usage
**File**: `src/app/quest/page.tsx` (Lines 41-105)

```typescript
// Official SDK integration
const { connect, disconnect, readyState, messages: voiceMessages } = useVoice()

// Message handling with deduplication
useEffect(() => {
  if (voiceMessages && voiceMessages.length > 0) {
    const latestMessage = voiceMessages[voiceMessages.length - 1]
    
    if (latestMessage.type === 'user_message' && latestMessage.message?.content) {
      // Handle user speech transcription
      const content = latestMessage.message.content
      setMessages(prev => {
        const exists = prev.some(m => m.text === content && m.isUser === true)
        if (exists) return prev  // Prevent duplicates
        return [...prev, userMessage]
      })
    } else if (latestMessage.type === 'assistant_message' && latestMessage.message?.content) {
      // Handle AI responses
      const content = latestMessage.message.content
      // Similar deduplication logic
    }
  }
}, [voiceMessages])
```

### 3. Connection Management
**File**: `src/app/quest/page.tsx` (Lines 238-253)

```typescript
const startQuestConversation = async () => {
  try {
    console.log('🔗 Starting Quest with official Hume AI SDK...')
    await connect()
  } catch (error) {
    console.error('Failed to start Quest conversation:', error)
    alert('Could not connect to Quest AI. Please check your connection and try again.')
  }
}

const endQuestConversation = () => {
  console.log('🔌 Ending Quest with official SDK...')
  disconnect()
  // Additional cleanup logic
}
```

## Required Environment Variables

```env
NEXT_PUBLIC_HUME_API_KEY=your_hume_api_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_hume_config_id
```

**Critical**: Use `NEXT_PUBLIC_` prefix for client-side access in Next.js.

## State Management Pattern

### Connection States
```typescript
import { VoiceReadyState } from '@humeai/voice-react'

const isConnected = readyState === VoiceReadyState.OPEN
const isConnecting = readyState === VoiceReadyState.CONNECTING
```

### UI State Indicators
**File**: `src/app/quest/page.tsx` (Lines 288-337)

```typescript
const getStateIndicator = () => {
  if (isConnecting) return <ConnectingIndicator />
  if (isConnected) {
    switch (conversationState) {
      case 'listening': return <ListeningIndicator />
      case 'thinking': return <ThinkingIndicator />
      case 'speaking': return <SpeakingIndicator />
      default: return <ReadyIndicator />
    }
  }
  return <OfflineIndicator />
}
```

## Message Structure

```typescript
interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  emotionalMeasures?: Record<string, unknown>  // From Hume AI
  playbook?: PlaybookType                      // Application-specific
}
```

## Integration with Vercel AI SDK

This pattern can be combined with Vercel AI SDK for enhanced text-based AI responses:

```typescript
// Vercel AI SDK for enhanced streaming conversations
const streamingChat = useStreamingChat()

// Detect intent and process with streaming AI
const detectedPlaybook = detectPlaybook(content)
setTimeout(() => {
  generateQuestResponse(content)  // Uses Vercel AI SDK
}, 1000)
```

## Critical Success Factors

1. **Use Official SDK**: Never attempt custom WebSocket implementation
2. **Environment Variable Fallbacks**: Always provide fallback values in production
3. **Message Deduplication**: Prevent duplicate messages in state
4. **Error Handling**: Wrap all connection attempts in try-catch blocks
5. **State Management**: Use proper VoiceReadyState enum values

## Troubleshooting

### Common Issues
- **Environment Variables**: Use debug endpoints to verify runtime availability
- **Connection Failures**: Check API key validity and network connectivity  
- **Duplicate Messages**: Implement proper deduplication logic
- **State Synchronization**: Use useEffect with proper dependencies

### Debug Tools
Create debug endpoints for environment variable verification:
```typescript
// /api/debug-env/route.ts
export async function GET() {
  return Response.json({
    hasHumeApiKey: !!process.env.NEXT_PUBLIC_HUME_API_KEY,
    hasHumeConfigId: !!process.env.NEXT_PUBLIC_HUME_CONFIG_ID
  })
}
```

## Reusability Checklist

When implementing this pattern in a new application:

- [ ] Install required dependencies
- [ ] Set up VoiceProvider in root layout
- [ ] Configure environment variables with fallbacks
- [ ] Implement message handling with deduplication
- [ ] Add proper error handling for connections
- [ ] Create state indicators for user feedback
- [ ] Test connection and message flow

## Version History

- **v1.0-v3.0**: Custom WebSocket implementation (FAILED)
- **v4.0.0**: Official Hume AI SDK Integration (SUCCESS) ✅

This pattern represents a major milestone in voice AI integration and should be the standard approach for future implementations.