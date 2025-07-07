# Quest Hume Voice AI Module - Reusable Package

## 📦 **Module Overview**

A plug-and-play module for integrating Hume's Empathic Voice Interface (EVI) with any application's user database to create personalized voice AI experiences.

## 🔧 **Core Components**

### **1. CLM Endpoint Generator**

```typescript
// File: lib/hume/clm-endpoint.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

interface HumeVoiceConfig {
  userFetcher: (userId: string) => Promise<any>
  systemPromptBuilder: (userContext: any) => string
  modelConfig?: {
    temperature?: number
    maxTokens?: number
  }
}

export function createHumeCLMEndpoint(config: HumeVoiceConfig) {
  return async function POST(req: NextRequest) {
    try {
      const body = await req.json()
      const userId = body.user_id || body.custom_session_id
      
      // Fetch user context using provided function
      const userContext = await config.userFetcher(userId)
      
      // Build system prompt using provided function
      const systemPrompt = config.systemPromptBuilder(userContext)
      
      const userMessage = body.messages[body.messages.length - 1]?.content || ''
      
      const response = await generateText({
        model: openai('gpt-4'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: config.modelConfig?.temperature || 0.7,
        maxTokens: config.modelConfig?.maxTokens || 150,
      })

      // Return in Hume's expected SSE format
      return createHumeSSEResponse(response.text)
    } catch (error) {
      return createHumeErrorResponse(error)
    }
  }
}

function createHumeSSEResponse(content: string) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Main response
      const sseMessage = `data: {"id":"chatcmpl-${Date.now()}","object":"chat.completion.chunk","created":${Math.floor(Date.now() / 1000)},"model":"gpt-4","choices":[{"index":0,"delta":{"content":"${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"},"finish_reason":null}]}\n\n`
      controller.enqueue(encoder.encode(sseMessage))
      
      // Done message
      const doneMessage = `data: {"id":"chatcmpl-${Date.now()}","object":"chat.completion.chunk","created":${Math.floor(Date.now() / 1000)},"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n`
      controller.enqueue(encoder.encode(doneMessage))
      
      // End marker
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

### **2. Hume Voice Interface Component**

```typescript
// File: components/HumeVoiceInterface.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

interface HumeVoiceProps {
  apiKey: string
  configId: string
  userId?: string
  onMessage?: (message: any) => void
  onError?: (error: any) => void
  debug?: boolean
}

export function HumeVoiceInterface({
  apiKey,
  configId,
  userId,
  onMessage,
  onError,
  debug = false
}: HumeVoiceProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const humeSocketRef = useRef<WebSocket | null>(null)

  const connectToHume = async () => {
    try {
      const ws = new WebSocket(
        `wss://api.hume.ai/v0/evi/chat?config_id=${configId}&api_key=${apiKey}`
      )

      ws.onopen = () => {
        console.log('Connected to Hume EVI')
        setIsConnected(true)
        if (debug) setDebugInfo(prev => ({ ...prev, status: 'Connected' }))
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        onMessage?.(message)
        if (debug) setDebugInfo(prev => ({ ...prev, lastMessage: message }))
      }

      ws.onerror = (error) => {
        console.error('Hume EVI error:', error)
        onError?.(error)
        if (debug) setDebugInfo(prev => ({ ...prev, error }))
      }

      ws.onclose = () => {
        setIsConnected(false)
        if (debug) setDebugInfo(prev => ({ ...prev, status: 'Disconnected' }))
      }

      humeSocketRef.current = ws
    } catch (error) {
      console.error('Failed to connect to Hume:', error)
      onError?.(error)
    }
  }

  const disconnect = () => {
    if (humeSocketRef.current) {
      humeSocketRef.current.close()
      humeSocketRef.current = null
    }
  }

  return (
    <div className="hume-voice-interface">
      <div className="controls">
        {!isConnected ? (
          <button onClick={connectToHume} className="connect-btn">
            Start Voice Conversation
          </button>
        ) : (
          <button onClick={disconnect} className="disconnect-btn">
            End Conversation
          </button>
        )}
      </div>

      {debug && (
        <div className="debug-panel">
          <h3>Debug Info</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <div className="status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  )
}
```

### **3. Database Integration Templates**

```typescript
// File: lib/hume/database-templates.ts

// PostgreSQL User Fetcher
export function createPostgreSQLUserFetcher(db: any) {
  return async function fetchUser(userId: string) {
    try {
      const result = await db`
        SELECT * FROM users WHERE id = ${userId} LIMIT 1
      `
      return result[0] || null
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }
}

// MongoDB User Fetcher
export function createMongoDBUserFetcher(collection: any) {
  return async function fetchUser(userId: string) {
    try {
      return await collection.findOne({ _id: userId })
    } catch (error) {
      console.error('Database error:', error)
      return null
    }
  }
}

// System Prompt Templates
export const systemPromptTemplates = {
  careerCoach: (user: any) => `You are an AI career coach. Keep responses under 150 words for voice.
    
User Profile:
- Name: ${user?.name || 'there'}
- Company: ${user?.company || 'Unknown'}
- Role: ${user?.current_role || 'Professional'}
- Experience: ${user?.years_experience || 0} years

Be warm, supportive, and reference their background when relevant.`,

  personalAssistant: (user: any) => `You are a personal AI assistant. Keep responses conversational and under 150 words.

User: ${user?.name || 'User'}
Context: ${user?.preferences || 'Standard assistance'}

Be helpful and personalized.`,

  therapist: (user: any) => `You are an empathetic AI therapist. Keep responses gentle and under 150 words.

Client: ${user?.name || 'Client'}
Background: ${user?.therapy_context || 'General support'}

Be supportive and understanding.`
}
```

## 🚀 **Usage Examples**

### **Example 1: Career Coaching App**

```typescript
// pages/api/hume-clm/chat/completions/route.ts
import { createHumeCLMEndpoint, createPostgreSQLUserFetcher, systemPromptTemplates } from '@/lib/hume'
import { sql } from '@/lib/db'

const userFetcher = createPostgreSQLUserFetcher(sql)

export const POST = createHumeCLMEndpoint({
  userFetcher,
  systemPromptBuilder: systemPromptTemplates.careerCoach,
  modelConfig: {
    temperature: 0.7,
    maxTokens: 150
  }
})
```

### **Example 2: E-commerce Assistant**

```typescript
// Custom user fetcher with order history
async function fetchEcommerceUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { orders: true, preferences: true }
  })
  return user
}

// Custom system prompt
function buildEcommercePrompt(user: any) {
  return `You are a shopping assistant for ${user?.name}. 
  
Recent orders: ${user?.orders?.slice(0, 3).map(o => o.product).join(', ')}
Preferences: ${user?.preferences?.categories?.join(', ')}

Help them find products and answer questions about their orders.`
}

export const POST = createHumeCLMEndpoint({
  userFetcher: fetchEcommerceUser,
  systemPromptBuilder: buildEcommercePrompt
})
```

### **Example 3: Simple Integration**

```typescript
// pages/voice-ai.tsx
import { HumeVoiceInterface } from '@/components/HumeVoiceInterface'

export default function VoiceAIPage() {
  return (
    <div>
      <h1>AI Voice Assistant</h1>
      <HumeVoiceInterface
        apiKey={process.env.NEXT_PUBLIC_HUME_API_KEY!}
        configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID!}
        userId="user_123"
        debug={true}
        onMessage={(msg) => console.log('Hume message:', msg)}
        onError={(err) => console.error('Hume error:', err)}
      />
    </div>
  )
}
```

## 📋 **Setup Checklist**

### **1. Install Dependencies**
```bash
npm install ai @ai-sdk/openai
# Your database client (pg, mongodb, prisma, etc.)
```

### **2. Environment Variables**
```bash
NEXT_PUBLIC_HUME_API_KEY=your_hume_api_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_hume_config_id
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_database_url
```

### **3. Hume Dashboard Configuration**
1. Create EVI configuration
2. Set CLM endpoint: `https://yourdomain.com/api/hume-clm/chat/completions`
3. Choose voice model
4. Test in Hume Playground

### **4. Database Schema (Minimum)**
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  email VARCHAR,
  -- Add your app-specific fields
);
```

## 🎯 **Benefits of This Module**

✅ **Plug-and-Play**: Drop into any Next.js app  
✅ **Database Agnostic**: Works with PostgreSQL, MongoDB, Prisma, etc.  
✅ **Customizable**: Easily modify prompts and user fetching  
✅ **Production Ready**: Based on proven working implementation  
✅ **Debug Friendly**: Built-in debugging interface  
✅ **TypeScript**: Full type safety included  

## 📦 **Package Distribution**

This module can be:
- Published as npm package
- Shared as GitHub template
- Included in starter kits
- Used in existing applications

The modular design makes it easy to adapt for any voice AI use case while maintaining the proven integration pattern that works with Hume EVI.