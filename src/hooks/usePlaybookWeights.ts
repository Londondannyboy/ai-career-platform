'use client'

import { useState, useEffect, useCallback } from 'react'
import { multiAgentCoachingEngine, CoachWeights } from '@/lib/coaching/multiAgentEngine'

export interface UsePlaybookWeightsOptions {
  userId: string
  defaultWeights?: CoachWeights
  autoSave?: boolean
  onWeightsChange?: (weights: CoachWeights) => void
}

export interface PlaybookWeightsState {
  weights: CoachWeights
  isLoading: boolean
  error: string | null
  hasUnsavedChanges: boolean
  totalWeight: number
}

export function usePlaybookWeights({
  userId,
  defaultWeights = {},
  autoSave = true,
  onWeightsChange
}: UsePlaybookWeightsOptions) {
  const [state, setState] = useState<PlaybookWeightsState>({
    weights: defaultWeights,
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    totalWeight: 0
  })

  // Calculate total weight whenever weights change
  useEffect(() => {
    const total = Object.values(state.weights).reduce((sum, weight) => sum + weight, 0)
    setState(prev => ({ ...prev, totalWeight: total }))
  }, [state.weights])

  // Load saved weights from localStorage on mount
  useEffect(() => {
    const loadSavedWeights = () => {
      try {
        const saved = localStorage.getItem(`playbook-weights-${userId}`)
        if (saved) {
          const savedWeights = JSON.parse(saved)
          setState(prev => ({
            ...prev,
            weights: { ...defaultWeights, ...savedWeights },
            hasUnsavedChanges: false
          }))
        }
      } catch (error) {
        console.error('Failed to load saved playbook weights:', error)
        setState(prev => ({
          ...prev,
          error: 'Failed to load saved preferences'
        }))
      }
    }

    loadSavedWeights()
  }, [userId, defaultWeights])

  // Auto-save weights when they change
  useEffect(() => {
    if (autoSave && state.hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveWeights()
      }, 1000) // Debounce saves by 1 second

      return () => clearTimeout(timeoutId)
    }
  }, [state.weights, state.hasUnsavedChanges, autoSave])

  const updateWeights = useCallback((newWeights: CoachWeights) => {
    setState(prev => ({
      ...prev,
      weights: newWeights,
      hasUnsavedChanges: true,
      error: null
    }))

    // Notify coaching engine of weight changes
    multiAgentCoachingEngine.updateCoachingWeights(newWeights)

    // Call external change handler
    onWeightsChange?.(newWeights)
  }, [onWeightsChange])

  const updateSingleWeight = useCallback((coachType: string, weight: number) => {
    const newWeights = { ...state.weights, [coachType]: weight }
    updateWeights(newWeights)
  }, [state.weights, updateWeights])

  const saveWeights = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Save to localStorage
      localStorage.setItem(`playbook-weights-${userId}`, JSON.stringify(state.weights))
      
      // TODO: Save to database for persistence across devices
      // await saveWeightsToDatabase(userId, state.weights)
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasUnsavedChanges: false
      }))
    } catch (error) {
      console.error('Failed to save playbook weights:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to save preferences'
      }))
    }
  }, [userId, state.weights])

  const resetWeights = useCallback(() => {
    const emptyWeights: CoachWeights = {}
    updateWeights(emptyWeights)
  }, [updateWeights])

  const applyPreset = useCallback((preset: 'career_focus' | 'productivity_focus' | 'leadership_focus' | 'technical_focus') => {
    let presetWeights: CoachWeights = {}
    
    switch (preset) {
      case 'career_focus':
        presetWeights = {
          career_coaching: 50,
          communication_coach: 30,
          networking_coach: 20
        }
        break
      case 'productivity_focus':
        presetWeights = {
          productivity_coach: 40,
          procrastination_coach: 30,
          delivery_coach: 20,
          stress_management: 10
        }
        break
      case 'leadership_focus':
        presetWeights = {
          leadership_coaching: 45,
          communication_coach: 25,
          stress_management: 15,
          delivery_coach: 15
        }
        break
      case 'technical_focus':
        presetWeights = {
          engineering_coach: 50,
          productivity_coach: 25,
          learning_coach: 25
        }
        break
    }
    
    updateWeights(presetWeights)
  }, [updateWeights])

  const normalizeWeights = useCallback((targetTotal: number = 100) => {
    const currentTotal = state.totalWeight
    if (currentTotal === 0 || currentTotal === targetTotal) return

    const normalizedWeights: CoachWeights = {}
    const multiplier = targetTotal / currentTotal

    Object.entries(state.weights).forEach(([coachType, weight]) => {
      if (weight > 0) {
        normalizedWeights[coachType] = Math.round(weight * multiplier)
      }
    })

    updateWeights(normalizedWeights)
  }, [state.weights, state.totalWeight, updateWeights])

  const getActiveCoaches = useCallback(() => {
    return Object.entries(state.weights)
      .filter(([_, weight]) => weight > 0)
      .sort(([_, a], [__, b]) => b - a) // Sort by weight descending
      .map(([coachType, weight]) => ({ type: coachType, weight }))
  }, [state.weights])

  const getPrimaryCoach = useCallback(() => {
    const activeCoaches = getActiveCoaches()
    return activeCoaches.length > 0 ? activeCoaches[0] : null
  }, [getActiveCoaches])

  const isBalanced = useCallback((tolerance: number = 5) => {
    return Math.abs(state.totalWeight - 100) <= tolerance
  }, [state.totalWeight])

  const getRecommendations = useCallback(() => {
    const recommendations: string[] = []
    
    if (state.totalWeight === 0) {
      recommendations.push("Select at least one coaching focus to get started")
    } else if (state.totalWeight < 80) {
      recommendations.push(`Consider adding ${100 - state.totalWeight}% more focus areas`)
    } else if (state.totalWeight > 120) {
      recommendations.push(`Consider reducing focus by ${state.totalWeight - 100}% for better results`)
    }
    
    const activeCoaches = getActiveCoaches()
    if (activeCoaches.length === 1 && activeCoaches[0].weight === 100) {
      recommendations.push("Consider adding a support coach for more comprehensive guidance")
    }
    
    return recommendations
  }, [state.totalWeight, getActiveCoaches])

  return {
    // State
    weights: state.weights,
    totalWeight: state.totalWeight,
    isLoading: state.isLoading,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    
    // Actions
    updateWeights,
    updateSingleWeight,
    saveWeights,
    resetWeights,
    applyPreset,
    normalizeWeights,
    
    // Computed values
    activeCoaches: getActiveCoaches(),
    primaryCoach: getPrimaryCoach(),
    isBalanced: isBalanced(),
    recommendations: getRecommendations(),
    
    // Validation
    isValid: state.totalWeight > 0 && state.totalWeight <= 100,
    isOptimal: isBalanced() && getActiveCoaches().length >= 2
  }
}

// Helper hook for managing coaching session state
export function useCoachingSession(userId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [coaches, setCoaches] = useState<any[]>([])
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle')

  const startSession = useCallback(async (context: any, weights?: CoachWeights) => {
    try {
      const newSessionId = await multiAgentCoachingEngine.startSession(context, weights)
      setSessionId(newSessionId)
      setIsActive(true)
      
      // Get initial coach state
      const status = multiAgentCoachingEngine.getSessionStatus()
      if (status) {
        setCoaches(status.activeCoaches)
      }
    } catch (error) {
      console.error('Failed to start coaching session:', error)
    }
  }, [])

  const endSession = useCallback(async () => {
    try {
      await multiAgentCoachingEngine.endSession()
      setSessionId(null)
      setIsActive(false)
      setCoaches([])
      setConversationState('idle')
    } catch (error) {
      console.error('Failed to end coaching session:', error)
    }
  }, [])

  const processInput = useCallback(async (input: string) => {
    if (!isActive) return null
    
    try {
      setConversationState('thinking')
      const responseStream = await multiAgentCoachingEngine.processUserInput(input)
      setConversationState('speaking')
      return responseStream
    } catch (error) {
      console.error('Failed to process input:', error)
      setConversationState('idle')
      return null
    }
  }, [isActive])

  const updateSessionWeights = useCallback(async (weights: CoachWeights) => {
    if (!isActive) return
    
    try {
      await multiAgentCoachingEngine.updateCoachingWeights(weights)
      
      // Update coach state
      const status = multiAgentCoachingEngine.getSessionStatus()
      if (status) {
        setCoaches(status.activeCoaches)
      }
    } catch (error) {
      console.error('Failed to update session weights:', error)
    }
  }, [isActive])

  return {
    sessionId,
    isActive,
    coaches,
    conversationState,
    startSession,
    endSession,
    processInput,
    updateSessionWeights,
    setConversationState
  }
}