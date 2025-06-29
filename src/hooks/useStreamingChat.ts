'use client'

import { useChat } from 'ai/react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { useCallback } from 'react'

interface UserContext {
  name?: string
  currentRole?: string
  experienceLevel?: string
  skills?: string[]
  goals?: string
  industry?: string
}

export function useStreamingChat() {
  const { user } = useUser()
  const supabase = createClient()

  // Get user context for personalized coaching
  const getUserContext = useCallback(async (): Promise<UserContext> => {
    if (!user?.id) return {}

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        return {
          name: user.fullName || user.firstName || 'there',
          currentRole: profile.current_role,
          experienceLevel: profile.experience_level,
          skills: profile.skills || [],
          goals: profile.professional_goals,
          industry: profile.industry
        }
      }
    } catch (error) {
      console.error('Error fetching user context:', error)
    }

    return {
      name: user.fullName || user.firstName || 'there'
    }
  }, [user, supabase])

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    stop,
    reload,
  } = useChat({
    api: '/api/chat',
    onFinish: async (message) => {
      // Save conversation to database
      if (user?.id) {
        try {
          await supabase.from('conversations').insert({
            user_id: user.id,
            message_type: 'assistant',
            content: message.content,
            created_at: new Date().toISOString()
          })
        } catch (error) {
          console.error('Error saving message:', error)
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
    body: {
      userId: user?.id,
      userContext: null, // Will be populated when sendMessage is called
    },
  })

  // Enhanced send message function with user context
  const sendMessage = useCallback(async (message: string) => {
    const userContext = await getUserContext()
    
    // Save user message to database
    if (user?.id) {
      try {
        await supabase.from('conversations').insert({
          user_id: user.id,
          message_type: 'user',
          content: message,
          created_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error saving user message:', error)
      }
    }

    // Send message with user context
    await append({
      role: 'user',
      content: message,
    }, {
      body: {
        userId: user?.id,
        userContext,
      },
    })
  }, [append, getUserContext, user?.id, supabase])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    sendMessage,
    stop,
    reload,
  }
}