/**
 * Multi-Agent Coaching Engine
 * Orchestrates multiple AI coaching agents with different specializations
 * Handles coach collaboration, handoffs, and relationship-aware coaching
 */

import { openai } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import { embeddingsService } from '../vector/embeddings'
import { promptRouter } from '../prompts/promptRouter'
import { coachCollaborator } from './coachCollaboration'
import { relationshipPromptManager } from '../prompts/relationshipPrompts'

export type CoachType = 
  // Primary Coaches
  | 'career_coaching' | 'leadership_coaching' | 'skill_development' | 'career_transition'
  | 'marketing_coach' | 'sales_coach' | 'engineering_coach' | 'product_coach' | 'finance_coach'
  | 'startup_coach' | 'enterprise_coach' | 'consulting_coach' | 'freelance_coach'
  
  // Support Coaches
  | 'productivity_coach' | 'procrastination_coach' | 'stress_management' | 'focus_coach'
  | 'communication_coach' | 'networking_coach' | 'negotiation_coach' | 'feedback_coach'
  | 'confidence_coach' | 'work_life_balance' | 'mindset_coach' | 'goal_setting'
  
  // Execution Coaches
  | 'delivery_coach' | 'accountability_coach' | 'strategy_coach' | 'change_coach'
  | 'learning_coach' | 'mentor_coach' | 'innovation_coach'
  
  // Contextual Coaches
  | 'interview_coach' | 'presentation_coach' | 'meeting_coach' | 'crisis_coach'
  | 'news_coach' | 'company_coach' | 'topic_coach' | 'real_time_coach'

export type RelationshipType = 
  | 'upward_coaching'     // Coaching your superior
  | 'peer_coaching'       // Coaching colleagues
  | 'downward_coaching'   // Coaching subordinates
  | 'self_coaching'       // AI-powered self development
  | 'external_coaching'   // Coaching external parties
  | 'client_coaching'     // Coaching clients/customers
  | 'community_coaching'  // Industry/community coaching

export type CoachingMode = 'single' | 'sequential' | 'parallel' | 'intervention'

export interface CoachWeights {
  [key: string]: number // Coach type to weight percentage (0-100)
}

export interface CoachingContext {
  userId: string
  userProfile?: any
  conversationHistory: Message[]
  currentGoals?: string[]
  recentSessions?: any[]
  companyContext?: string
  relationshipType?: RelationshipType
  urgencyLevel?: 'low' | 'medium' | 'high' | 'crisis'
  emotionalState?: any
}

export interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  coachType?: CoachType
  emotionalMeasures?: Record<string, unknown>
}

export interface CoachAgent {
  type: CoachType
  name: string
  expertise: string[]
  personality: string
  systemPrompt: string
  isActive: boolean
  confidence: number // 0-100 confidence in handling current situation
  weight: number // Current weight in the coaching session (0-100)
}

export interface CoachingSession {
  id: string
  userId: string
  activeCoaches: CoachAgent[]
  mode: CoachingMode
  relationshipType?: RelationshipType
  context: CoachingContext
  startTime: Date
  lastActivity: Date
}

export class MultiAgentCoachingEngine {
  private activeSession: CoachingSession | null = null
  private coachDefinitions: Map<CoachType, Partial<CoachAgent>> = new Map()

  constructor() {
    this.initializeCoachDefinitions()
  }

  /**
   * Initialize all coach definitions with their specializations and personalities
   */
  private initializeCoachDefinitions() {
    // Primary Coaches
    this.coachDefinitions.set('career_coaching', {
      name: 'Alex Chen',
      expertise: ['career_development', 'goal_setting', 'professional_growth', 'industry_navigation'],
      personality: 'empathetic, strategic, growth-oriented',
      systemPrompt: this.getCoachSystemPrompt('career_coaching')
    })

    this.coachDefinitions.set('marketing_coach', {
      name: 'Sarah Martinez',
      expertise: ['marketing_strategy', 'brand_development', 'campaign_management', 'customer_acquisition'],
      personality: 'creative, data-driven, results-focused',
      systemPrompt: this.getCoachSystemPrompt('marketing_coach')
    })

    this.coachDefinitions.set('engineering_coach', {
      name: 'David Kumar',
      expertise: ['technical_leadership', 'architecture', 'code_quality', 'team_scaling'],
      personality: 'analytical, practical, mentorship-focused',
      systemPrompt: this.getCoachSystemPrompt('engineering_coach')
    })

    // Support Coaches
    this.coachDefinitions.set('productivity_coach', {
      name: 'Emma Thompson',
      expertise: ['time_management', 'workflow_optimization', 'efficiency', 'organization'],
      personality: 'systematic, encouraging, action-oriented',
      systemPrompt: this.getCoachSystemPrompt('productivity_coach')
    })

    this.coachDefinitions.set('procrastination_coach', {
      name: 'Jordan Williams',
      expertise: ['motivation', 'action_taking', 'perfectionism', 'overwhelm_management'],
      personality: 'understanding, motivational, practical',
      systemPrompt: this.getCoachSystemPrompt('procrastination_coach')
    })

    this.coachDefinitions.set('communication_coach', {
      name: 'Dr. Lisa Park',
      expertise: ['presentation_skills', 'difficult_conversations', 'influence', 'clarity'],
      personality: 'articulate, confident, diplomatic',
      systemPrompt: this.getCoachSystemPrompt('communication_coach')
    })

    // Execution Coaches
    this.coachDefinitions.set('delivery_coach', {
      name: 'Michael Brown',
      expertise: ['project_execution', 'milestone_achievement', 'results_delivery', 'implementation'],
      personality: 'decisive, focused, results-driven',
      systemPrompt: this.getCoachSystemPrompt('delivery_coach')
    })

    // Add more coach definitions as needed...
  }

  /**
   * Start a new coaching session
   */
  async startSession(context: CoachingContext, initialWeights?: CoachWeights): Promise<string> {
    const sessionId = this.generateSessionId()
    
    // Determine initial coaching approach
    const { primaryCoach, supportingCoaches, mode } = await this.analyzeCoachingNeeds(context)
    
    // Apply user-specified weights or use AI-determined weights
    const weights = initialWeights || await this.calculateOptimalWeights(context, [primaryCoach, ...supportingCoaches])
    
    // Create active coaches
    const activeCoaches = await this.createActiveCoaches([primaryCoach, ...supportingCoaches], weights)
    
    this.activeSession = {
      id: sessionId,
      userId: context.userId,
      activeCoaches,
      mode,
      relationshipType: context.relationshipType,
      context,
      startTime: new Date(),
      lastActivity: new Date()
    }

    // Initialize coach collaboration
    await coachCollaborator.initializeCollaboration(this.activeSession, activeCoaches)

    return sessionId
  }

  /**
   * Process user input and generate coaching response
   */
  async processUserInput(input: string): Promise<AsyncGenerator<string>> {
    if (!this.activeSession) {
      throw new Error('No active coaching session')
    }

    // Update conversation history
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    }
    
    this.activeSession.context.conversationHistory.push(userMessage)

    // Analyze if coaching approach needs adjustment
    const needsCoachChange = await this.analyzeCoachingNeed(input, this.activeSession)
    
    // Check for coach intervention needs using advanced collaboration system
    const activeCoaches = this.activeSession.activeCoaches.filter(c => c.isActive)
    const primaryCoach = activeCoaches.length > 0 
      ? activeCoaches.find(c => c.weight === Math.max(...activeCoaches.map(c => c.weight))) 
      : null
    
    const interventionNeeded = await coachCollaborator.detectInterventionNeeds(
      this.activeSession.id,
      this.activeSession.context.conversationHistory,
      primaryCoach?.type || 'career_coaching'
    )
    
    if (interventionNeeded && interventionNeeded.urgency !== 'low') {
      // Execute automatic intervention
      await this.handleCoachIntervention(interventionNeeded)
    } else if (needsCoachChange.shouldChange) {
      await this.handleCoachTransition(needsCoachChange)
    }

    // Generate response from active coaches using collaboration system
    return this.generateCollaborativeResponse(input, this.activeSession)
  }

  /**
   * Analyze what type of coaching is needed based on user input and context
   */
  private async analyzeCoachingNeeds(context: CoachingContext): Promise<{
    primaryCoach: CoachType
    supportingCoaches: CoachType[]
    mode: CoachingMode
  }> {
    const analysisPrompt = `
    Analyze this coaching context and determine the optimal coaching approach:

    User Context:
    - Conversation History: ${JSON.stringify(context.conversationHistory.slice(-5))}
    - Goals: ${context.currentGoals?.join(', ') || 'Not specified'}
    - Relationship Type: ${context.relationshipType || 'Not specified'}
    - Urgency: ${context.urgencyLevel || 'medium'}
    - Company Context: ${context.companyContext || 'Not specified'}

    Available Coach Types:
    Primary: career_coaching, marketing_coach, sales_coach, engineering_coach, leadership_coaching
    Support: productivity_coach, communication_coach, stress_management, procrastination_coach
    Execution: delivery_coach, accountability_coach, strategy_coach

    Return JSON with:
    {
      "primaryCoach": "coach_type",
      "supportingCoaches": ["coach_type1", "coach_type2"],
      "mode": "single|sequential|parallel",
      "reasoning": "explanation"
    }
    `

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: analysisPrompt,
      temperature: 0.3,
    })

    try {
      const analysis = JSON.parse(text)
      return {
        primaryCoach: analysis.primaryCoach,
        supportingCoaches: analysis.supportingCoaches || [],
        mode: analysis.mode || 'single'
      }
    } catch {
      // Fallback to career coaching if analysis fails
      return {
        primaryCoach: 'career_coaching',
        supportingCoaches: [],
        mode: 'single'
      }
    }
  }

  /**
   * Calculate optimal weights for coaches based on context
   */
  private async calculateOptimalWeights(
    context: CoachingContext, 
    coaches: CoachType[]
  ): Promise<CoachWeights> {
    // Use AI to determine optimal weight distribution
    const weightPrompt = `
    Given this coaching context, determine optimal weight distribution for these coaches:
    
    Coaches: ${coaches.join(', ')}
    Context: ${JSON.stringify({
      goals: context.currentGoals,
      urgency: context.urgencyLevel,
      relationship: context.relationshipType
    })}
    
    Return JSON with weights that sum to 100:
    { "coach_type": weight_percentage }
    `

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: weightPrompt,
      temperature: 0.3,
    })

    try {
      return JSON.parse(text)
    } catch {
      // Fallback: equal distribution
      const equalWeight = Math.floor(100 / coaches.length)
      const weights: CoachWeights = {}
      coaches.forEach(coach => {
        weights[coach] = equalWeight
      })
      return weights
    }
  }

  /**
   * Create active coach agents with weights
   */
  private async createActiveCoaches(coachTypes: CoachType[], weights: CoachWeights): Promise<CoachAgent[]> {
    const activeCoaches: CoachAgent[] = []

    for (const coachType of coachTypes) {
      const definition = this.coachDefinitions.get(coachType)
      if (definition) {
        activeCoaches.push({
          type: coachType,
          name: definition.name || coachType,
          expertise: definition.expertise || [],
          personality: definition.personality || 'professional',
          systemPrompt: definition.systemPrompt || '',
          isActive: weights[coachType] > 0,
          confidence: 85, // TODO: Calculate based on context match
          weight: weights[coachType] || 0
        })
      }
    }

    return activeCoaches
  }

  /**
   * Analyze if coaching approach needs to change during conversation
   */
  private async analyzeCoachingNeed(input: string, session: CoachingSession): Promise<{
    shouldChange: boolean
    newCoach?: CoachType
    reason?: string
    transitionType?: 'handoff' | 'addition' | 'intervention'
  }> {
    const currentCoaches = session.activeCoaches.map(c => c.type).join(', ')
    
    const analysisPrompt = `
    Analyze if the coaching approach should change based on this user input:
    
    User Input: "${input}"
    Current Coaches: ${currentCoaches}
    Conversation Context: ${JSON.stringify(session.context.conversationHistory.slice(-3))}
    
    Look for signals that suggest:
    - Procrastination patterns → procrastination_coach
    - Stress/anxiety → stress_management
    - Communication challenges → communication_coach
    - Need for specific expertise → relevant specialist coach
    - Request for different type of help
    
    Return JSON:
    {
      "shouldChange": boolean,
      "newCoach": "coach_type" or null,
      "reason": "explanation",
      "transitionType": "handoff|addition|intervention"
    }
    `

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: analysisPrompt,
      temperature: 0.3,
    })

    try {
      return JSON.parse(text)
    } catch {
      return { shouldChange: false }
    }
  }

  /**
   * Handle transitions between coaches
   */
  private async handleCoachTransition(transition: {
    newCoach?: CoachType
    transitionType?: 'handoff' | 'addition' | 'intervention'
    reason?: string
  }) {
    if (!this.activeSession || !transition.newCoach) return

    const newCoachDef = this.coachDefinitions.get(transition.newCoach)
    if (!newCoachDef) return

    switch (transition.transitionType) {
      case 'handoff':
        // Replace primary coach
        this.activeSession.activeCoaches = this.activeSession.activeCoaches.map(coach => 
          coach.weight === Math.max(...this.activeSession!.activeCoaches.map(c => c.weight))
            ? { ...coach, isActive: false }
            : coach
        )
        break
        
      case 'addition':
        // Add new coach alongside existing
        break
        
      case 'intervention':
        // Temporarily bring in specialist
        this.activeSession.activeCoaches.forEach(coach => coach.isActive = false)
        break
    }

    // Add new coach
    const newCoach: CoachAgent = {
      type: transition.newCoach,
      name: newCoachDef.name || transition.newCoach,
      expertise: newCoachDef.expertise || [],
      personality: newCoachDef.personality || 'professional',
      systemPrompt: newCoachDef.systemPrompt || '',
      isActive: true,
      confidence: 90,
      weight: transition.transitionType === 'intervention' ? 100 : 40
    }

    this.activeSession.activeCoaches.push(newCoach)
  }

  /**
   * Generate coaching response from active coaches
   */
  private async *generateCoachingResponse(input: string, session: CoachingSession): AsyncGenerator<string> {
    const activeCoaches = session.activeCoaches.filter(c => c.isActive)
    const primaryCoach = activeCoaches.reduce((prev, current) => 
      prev.weight > current.weight ? prev : current
    )

    // Get optimized blended prompt using vector search
    const blendedPrompt = await promptRouter.getOptimalPrompts(
      primaryCoach.type,
      {
        userId: session.userId,
        companyName: session.context.companyContext,
        relationshipType: session.relationshipType,
        conversationHistory: session.context.conversationHistory.map(m => m.text),
        userGoals: session.context.currentGoals
      }
    )
    
    // Replace variables in the prompt
    const finalPrompt = this.replacePromptVariables(blendedPrompt.content, {
      ...blendedPrompt.variables,
      coachName: primaryCoach.name,
      userName: session.context.userProfile?.name || 'User',
      userInput: input,
      conversationContext: this.buildCoachingContext(session, primaryCoach),
      maxWords: '150'
    })
    
    // Generate response with the blended prompt
    const response = await streamText({
      model: openai('gpt-4'),
      system: finalPrompt,
      prompt: `User just said: "${input}"\n\nRespond naturally and conversationally.`,
      temperature: 0.7,
    })

    // Track prompt usage for effectiveness
    if (blendedPrompt.sources.length > 0) {
      const primarySourceId = blendedPrompt.sources[0].promptId
      // TODO: Log usage and effectiveness
    }

    for await (const chunk of response.textStream) {
      yield chunk
    }

    // Update session activity
    session.lastActivity = new Date()
  }

  /**
   * Replace variables in prompt content
   */
  private replacePromptVariables(content: string, variables: Record<string, string>): string {
    let result = content
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value)
    })
    
    return result
  }

  /**
   * Build coaching context for AI prompt
   */
  private buildCoachingContext(session: CoachingSession, coach: CoachAgent): string {
    const context = session.context
    
    return `
    You are ${coach.name}, a ${coach.type.replace('_', ' ')} coach with expertise in: ${coach.expertise.join(', ')}.
    Your personality is: ${coach.personality}.
    
    User Context:
    - Goals: ${context.currentGoals?.join(', ') || 'Not specified'}
    - Relationship Type: ${context.relationshipType || 'Not specified'}
    - Company: ${context.companyContext || 'Not specified'}
    
    Recent Conversation:
    ${context.conversationHistory.slice(-5).map(m => 
      `${m.isUser ? 'User' : 'Coach'}: ${m.text}`
    ).join('\n')}
    
    Other Active Coaches: ${session.activeCoaches.filter(c => c.isActive && c.type !== coach.type).map(c => c.name).join(', ') || 'None'}
    `
  }

  /**
   * Get system prompt for specific coach type
   */
  private getCoachSystemPrompt(coachType: CoachType): string {
    const basePrompt = `You are a professional AI coach specializing in ${coachType.replace('_', ' ')}. 
    You provide practical, actionable advice while being empathetic and supportive.`

    const specificPrompts: Record<CoachType, string> = {
      'career_coaching': `${basePrompt} You help people navigate their career paths, set professional goals, and overcome career challenges. Focus on growth opportunities and strategic career moves.`,
      
      'marketing_coach': `${basePrompt} You specialize in marketing strategy, campaign development, brand building, and customer acquisition. You're data-driven but creative in your approach.`,
      
      'engineering_coach': `${basePrompt} You focus on technical leadership, software architecture, code quality, and engineering team management. You balance technical excellence with practical delivery.`,
      
      'productivity_coach': `${basePrompt} You help people optimize their time, workflows, and systems for maximum efficiency. You're systematic and action-oriented in your recommendations.`,
      
      'procrastination_coach': `${basePrompt} You understand the psychology behind procrastination and help people overcome avoidance patterns. You're patient and encouraging while promoting action.`,
      
      'communication_coach': `${basePrompt} You improve presentation skills, facilitate difficult conversations, and enhance overall communication effectiveness. You're articulate and diplomatically skilled.`,
      
      'delivery_coach': `${basePrompt} You focus on execution, project delivery, and achieving concrete results. You're decisive and results-driven, helping turn plans into achievements.`,
      
      // Add more specific prompts for other coach types...
    } as Record<CoachType, string>

    return specificPrompts[coachType] || basePrompt
  }

  /**
   * Update coaching weights during session
   */
  async updateCoachingWeights(newWeights: CoachWeights): Promise<void> {
    if (!this.activeSession) return

    // Update weights for existing coaches
    this.activeSession.activeCoaches.forEach(coach => {
      if (newWeights[coach.type] !== undefined) {
        coach.weight = newWeights[coach.type]
        coach.isActive = coach.weight > 0
      }
    })

    // Add new coaches if needed
    for (const [coachType, weight] of Object.entries(newWeights)) {
      if (weight > 0 && !this.activeSession.activeCoaches.find(c => c.type === coachType)) {
        const definition = this.coachDefinitions.get(coachType as CoachType)
        if (definition) {
          const newCoach: CoachAgent = {
            type: coachType as CoachType,
            name: definition.name || coachType,
            expertise: definition.expertise || [],
            personality: definition.personality || 'professional',
            systemPrompt: definition.systemPrompt || '',
            isActive: true,
            confidence: 85,
            weight
          }
          this.activeSession.activeCoaches.push(newCoach)
        }
      }
    }
  }

  /**
   * Handle coach interventions using collaboration system
   */
  private async handleCoachIntervention(intervention: any) {
    if (!this.activeSession) return

    const suggestedCoachDef = this.coachDefinitions.get(intervention.suggestedCoach as CoachType)
    if (!suggestedCoachDef) return

    // Create intervention message
    const activeCoaches = this.activeSession.activeCoaches.filter(c => c.isActive)
    const currentPrimary = activeCoaches.length > 0 
      ? activeCoaches.find(c => c.weight === Math.max(...activeCoaches.map(c => c.weight)))
      : null

    if (currentPrimary) {
      // Execute handoff through collaboration system
      await coachCollaborator.executeCoachHandoff(
        this.activeSession.id,
        currentPrimary.type,
        intervention.suggestedCoach,
        intervention.reasoning,
        this.activeSession.context.conversationHistory.slice(-1)[0]?.text || ''
      )

      // Add or activate the suggested coach
      const existingCoach = this.activeSession.activeCoaches.find(c => c.type === intervention.suggestedCoach)
      if (existingCoach) {
        existingCoach.isActive = true
        existingCoach.weight = Math.max(40, existingCoach.weight)
      } else {
        const newCoach: CoachAgent = {
          type: intervention.suggestedCoach,
          name: suggestedCoachDef.name || intervention.suggestedCoach,
          expertise: suggestedCoachDef.expertise || [],
          personality: suggestedCoachDef.personality || 'professional',
          systemPrompt: suggestedCoachDef.systemPrompt || '',
          isActive: true,
          confidence: 90,
          weight: 50
        }
        this.activeSession.activeCoaches.push(newCoach)
      }
    }
  }

  /**
   * Generate collaborative response using coach collaboration system
   */
  private async *generateCollaborativeResponse(input: string, session: CoachingSession): AsyncGenerator<string> {
    const activeCoaches = session.activeCoaches.filter(c => c.isActive)
    
    if (activeCoaches.length === 1) {
      // Single coach - use standard response
      yield* this.generateCoachingResponse(input, session)
      return
    }

    // Multiple coaches - use collaboration system
    const collaborativeResponse = await coachCollaborator.generateCollaborativeResponse(
      session.id,
      input,
      activeCoaches
    )

    // Get optimized blended prompt for the speaking coach with relationship awareness
    const speakingCoach = activeCoaches.find(c => c.type === collaborativeResponse.speakingCoach) || activeCoaches[0]
    
    const blendedPrompt = await this.getRelationshipAwarePrompt(
      speakingCoach.type,
      session,
      input
    )
    
    // Replace variables in the prompt
    const finalPrompt = this.replacePromptVariables(blendedPrompt.content, {
      ...blendedPrompt.variables,
      coachName: speakingCoach.name,
      userName: session.context.userProfile?.name || 'User',
      userInput: input,
      conversationContext: this.buildCoachingContext(session, speakingCoach),
      maxWords: '150',
      collaborationType: collaborativeResponse.collaborationType,
      teamContext: activeCoaches.map(c => c.name).join(', ')
    })
    
    // Stream the collaborative response
    const response = await streamText({
      model: openai('gpt-4'),
      system: finalPrompt,
      prompt: collaborativeResponse.content || `User just said: "${input}"\n\nRespond naturally and conversationally.`,
      temperature: 0.7,
    })

    for await (const chunk of response.textStream) {
      yield chunk
    }

    // Update session activity
    session.lastActivity = new Date()
  }

  /**
   * Get current session status
   */
  getSessionStatus(): {
    activeCoaches: CoachAgent[]
    mode: CoachingMode
    relationshipType?: RelationshipType
    collaboration?: any
  } | null {
    if (!this.activeSession) return null

    const collaboration = coachCollaborator.getCollaborationStatus(this.activeSession.id)

    return {
      activeCoaches: this.activeSession.activeCoaches.filter(c => c.isActive),
      mode: this.activeSession.mode,
      relationshipType: this.activeSession.relationshipType,
      collaboration
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    if (this.activeSession) {
      // Clean up collaboration
      coachCollaborator.endCollaboration(this.activeSession.id)
      this.activeSession = null
    }
  }

  /**
   * Get relationship-aware prompt that combines coaching expertise with relationship dynamics
   */
  private async getRelationshipAwarePrompt(
    coachType: CoachType,
    session: CoachingSession,
    userInput: string
  ): Promise<any> {
    // Get base coaching prompt
    const basePrompt = await promptRouter.getOptimalPrompts(
      coachType,
      {
        userId: session.userId,
        companyName: session.context.companyContext,
        relationshipType: session.relationshipType,
        conversationHistory: session.context.conversationHistory.map(m => m.text),
        userGoals: session.context.currentGoals
      }
    )

    // If no specific relationship type, return base prompt
    if (!session.relationshipType) {
      return basePrompt
    }

    // Get relationship-specific enhancement
    const relationshipConfig = this.inferRelationshipConfig(session, userInput)
    
    const relationshipPrompt = await relationshipPromptManager.getRelationshipPrompt(
      relationshipConfig,
      {
        situation: userInput,
        goals: session.context.currentGoals,
        challenges: this.extractChallengesFromHistory(session.context.conversationHistory)
      }
    )

    // Blend the coaching prompt with relationship awareness
    if (relationshipPrompt) {
      return this.blendCoachingAndRelationshipPrompts(basePrompt, relationshipPrompt, session)
    }

    return basePrompt
  }

  /**
   * Infer relationship configuration from session context
   */
  private inferRelationshipConfig(session: CoachingSession, userInput: string): any {
    const relationshipTypeMap = {
      'upward_coaching': 'upward',
      'peer_coaching': 'peer', 
      'downward_coaching': 'downward',
      'external_coaching': 'external',
      'self_coaching': 'self',
      'client_coaching': 'external',
      'community_coaching': 'external'
    }

    // Infer organization level from user profile or context
    let organizationLevel = 'individual_contributor'
    if (session.context.userProfile?.title) {
      const title = session.context.userProfile.title.toLowerCase()
      if (title.includes('director') || title.includes('vp')) {
        organizationLevel = 'director'
      } else if (title.includes('manager') || title.includes('lead')) {
        organizationLevel = 'manager'
      } else if (title.includes('ceo') || title.includes('cto') || title.includes('cfo')) {
        organizationLevel = 'c_level'
      }
    }

    // Infer company size and culture from context
    let companySize = 'medium'
    let culturalContext = 'collaborative'
    
    if (session.context.companyContext) {
      const context = session.context.companyContext.toLowerCase()
      if (context.includes('startup') || context.includes('early stage')) {
        companySize = 'startup'
        culturalContext = 'informal'
      } else if (context.includes('enterprise') || context.includes('corporation')) {
        companySize = 'enterprise'
        culturalContext = 'formal'
      }
    }

    return {
      relationshipType: relationshipTypeMap[session.relationshipType as keyof typeof relationshipTypeMap] || 'peer',
      organizationLevel,
      industryContext: this.extractIndustryFromContext(session),
      companySize,
      culturalContext
    }
  }

  /**
   * Extract industry context from session data
   */
  private extractIndustryFromContext(session: CoachingSession): string {
    const context = session.context.companyContext?.toLowerCase() || ''
    
    if (context.includes('tech') || context.includes('software')) return 'technology'
    if (context.includes('finance') || context.includes('bank')) return 'financial'
    if (context.includes('health') || context.includes('medical')) return 'healthcare'
    if (context.includes('retail') || context.includes('ecommerce')) return 'retail'
    if (context.includes('consulting')) return 'consulting'
    
    return 'technology' // Default
  }

  /**
   * Extract challenges from conversation history
   */
  private extractChallengesFromHistory(history: Message[]): string[] {
    const challenges: string[] = []
    const challengeKeywords = ['difficult', 'challenge', 'problem', 'struggle', 'stuck', 'conflict', 'issue']
    
    history.filter(m => m.isUser).forEach(message => {
      const text = message.text.toLowerCase()
      if (challengeKeywords.some(keyword => text.includes(keyword))) {
        challenges.push(message.text)
      }
    })
    
    return challenges.slice(-3) // Last 3 challenges mentioned
  }

  /**
   * Blend coaching expertise with relationship dynamics
   */
  private async blendCoachingAndRelationshipPrompts(
    basePrompt: any,
    relationshipPrompt: any,
    session: CoachingSession
  ): Promise<any> {
    const blendingPrompt = `
    Blend these two coaching approaches into a unified, coherent prompt:

    COACHING EXPERTISE:
    ${basePrompt.content}

    RELATIONSHIP DYNAMICS:
    ${relationshipPrompt.content}

    CONTEXT:
    - Relationship Type: ${session.relationshipType}
    - User Goals: ${session.context.currentGoals?.join(', ') || 'Professional development'}
    - Company Context: ${session.context.companyContext || 'Professional environment'}

    Create a unified coaching prompt that:
    1. Maintains the coaching expertise and techniques from the first prompt
    2. Integrates the relationship awareness and dynamics from the second prompt
    3. Provides specific guidance appropriate for the relationship context
    4. Maintains a natural, coherent coaching voice
    5. Preserves all variable placeholders ({{variableName}})

    Return only the blended prompt content that effectively combines both approaches.
    `

    const { text: blendedContent } = await generateText({
      model: openai('gpt-4'),
      prompt: blendingPrompt,
      temperature: 0.3
    })

    return {
      content: blendedContent,
      sources: [
        { promptId: basePrompt.sources?.[0]?.promptId || 'base', weight: 0.6, relevance: 1.0 },
        { promptId: relationshipPrompt.id || 'relationship', weight: 0.4, relevance: 1.0 }
      ],
      variables: {
        ...basePrompt.variables,
        ...relationshipPrompt.variables,
        relationshipType: session.relationshipType,
        companyContext: session.context.companyContext
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const multiAgentCoachingEngine = new MultiAgentCoachingEngine()