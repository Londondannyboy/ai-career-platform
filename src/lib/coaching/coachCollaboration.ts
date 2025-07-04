/**
 * Synthetic Coach Collaboration System
 * Handles sophisticated multi-coach interactions, handoffs, and collaborative coaching
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { CoachAgent, CoachingSession, Message } from './multiAgentEngine'

export interface CoachCollaboration {
  sessionId: string
  activeCoaches: CoachAgent[]
  collaborationMode: 'sequential' | 'parallel' | 'intervention' | 'consultation'
  handoffHistory: CoachHandoff[]
  currentSpeaker: string | null
  conversationFlow: ConversationFlow
}

export interface CoachHandoff {
  id: string
  fromCoach: string
  toCoach: string
  reason: string
  context: string
  timestamp: Date
  handoffType: 'voluntary' | 'system_triggered' | 'user_requested'
  success: boolean
}

export interface ConversationFlow {
  phase: 'introduction' | 'exploration' | 'action_planning' | 'collaboration' | 'wrap_up'
  nextActions: string[]
  expectedOutcomes: string[]
}

export interface CoachIntervention {
  triggerType: 'pattern_detected' | 'expertise_needed' | 'user_frustrated' | 'progress_stalled'
  confidence: number
  suggestedCoach: string
  reasoning: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export class SyntheticCoachCollaborator {
  private collaborations: Map<string, CoachCollaboration> = new Map()

  /**
   * Initialize collaboration for a coaching session
   */
  async initializeCollaboration(
    session: CoachingSession,
    activeCoaches: CoachAgent[]
  ): Promise<CoachCollaboration> {
    const collaboration: CoachCollaboration = {
      sessionId: session.id,
      activeCoaches,
      collaborationMode: this.determineCollaborationMode(activeCoaches),
      handoffHistory: [],
      currentSpeaker: this.selectPrimarySpeaker(activeCoaches),
      conversationFlow: {
        phase: 'introduction',
        nextActions: ['establish_rapport', 'understand_goals'],
        expectedOutcomes: ['clear_objectives', 'user_engagement']
      }
    }

    this.collaborations.set(session.id, collaboration)
    return collaboration
  }

  /**
   * Generate a natural coach introduction when multiple coaches are present
   */
  async generateCoachIntroduction(
    activeCoaches: CoachAgent[],
    userContext: any
  ): Promise<string> {
    const primaryCoach = activeCoaches.find(c => c.weight === Math.max(...activeCoaches.map(c => c.weight)))
    const supportingCoaches = activeCoaches.filter(c => c !== primaryCoach)

    const introductionPrompt = `
    Generate a natural, conversational introduction for a multi-coach session.

    Primary Coach: ${primaryCoach?.name} (${primaryCoach?.type})
    Supporting Coaches: ${supportingCoaches.map(c => `${c.name} (${c.type})`).join(', ')}
    
    User Context:
    - Goals: ${userContext.currentGoals?.join(', ') || 'Not specified'}
    - Background: ${userContext.userProfile?.name || 'Professional'}
    
    Create a warm, professional introduction that:
    1. Introduces the primary coach first
    2. Explains the collaborative approach
    3. Sets expectations for how the coaches will work together
    4. Makes the user feel confident about the multi-coach experience
    
    Keep it conversational and under 100 words for voice delivery.
    `

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: introductionPrompt,
      temperature: 0.7
    })

    return text
  }

  /**
   * Handle coach handoffs during conversation
   */
  async executeCoachHandoff(
    sessionId: string,
    fromCoach: string,
    toCoach: string,
    reason: string,
    userInput: string
  ): Promise<{ success: boolean; handoffMessage: string; newSpeaker: string }> {
    const collaboration = this.collaborations.get(sessionId)
    if (!collaboration) {
      throw new Error('No collaboration found for session')
    }

    const fromCoachAgent = collaboration.activeCoaches.find(c => c.type === fromCoach)
    const toCoachAgent = collaboration.activeCoaches.find(c => c.type === toCoach)

    if (!fromCoachAgent || !toCoachAgent) {
      return {
        success: false,
        handoffMessage: 'Could not find specified coaches',
        newSpeaker: fromCoach
      }
    }

    // Generate natural handoff message
    const handoffMessage = await this.generateHandoffMessage(
      fromCoachAgent,
      toCoachAgent,
      reason,
      userInput
    )

    // Record the handoff
    const handoff: CoachHandoff = {
      id: `handoff_${Date.now()}`,
      fromCoach,
      toCoach,
      reason,
      context: userInput,
      timestamp: new Date(),
      handoffType: 'voluntary',
      success: true
    }

    collaboration.handoffHistory.push(handoff)
    collaboration.currentSpeaker = toCoach

    return {
      success: true,
      handoffMessage,
      newSpeaker: toCoach
    }
  }

  /**
   * Generate natural handoff messages between coaches
   */
  private async generateHandoffMessage(
    fromCoach: CoachAgent,
    toCoach: CoachAgent,
    reason: string,
    userInput: string
  ): Promise<string> {
    const handoffPrompts = {
      'expertise_needed': `Let me bring in ${toCoach.name}, our ${toCoach.type.replace('_', ' ')} specialist. They have deep expertise in this area and can provide more targeted guidance.`,
      
      'different_perspective': `I think ${toCoach.name} would have a valuable perspective on this. ${toCoach.name}, what's your take on this situation?`,
      
      'skill_focus': `This is exactly the kind of challenge ${toCoach.name} excels at helping with. ${toCoach.name}, would you like to dive into this?`,
      
      'collaborative_approach': `${toCoach.name} and I often work together on challenges like this. Let me hand this over to ${toCoach.name} to explore the ${toCoach.expertise[0]} angle.`,
      
      'intervention': `I notice we might benefit from a different approach here. ${toCoach.name}, I think your expertise in ${toCoach.expertise[0]} could really help us move forward.`
    }

    // Use a default or generate custom message
    const templateMessage = handoffPrompts[reason as keyof typeof handoffPrompts] || 
      `Let me bring in ${toCoach.name} to help with this. ${toCoach.name}, take it away.`

    // Personalize based on context
    if (userInput.toLowerCase().includes('stress') || userInput.toLowerCase().includes('overwhelm')) {
      return `I can hear that this is causing some stress. Let me bring in ${toCoach.name}, who specializes in helping people navigate these kinds of pressures effectively.`
    }

    if (userInput.toLowerCase().includes('procrastination') || userInput.toLowerCase().includes('delay')) {
      return `This sounds like a perfect opportunity for ${toCoach.name} to share some strategies. They're excellent at helping people move from planning to action.`
    }

    return templateMessage
  }

  /**
   * Detect when coach intervention is needed
   */
  async detectInterventionNeeds(
    sessionId: string,
    conversationHistory: Message[],
    currentCoach: string
  ): Promise<CoachIntervention | null> {
    const recentMessages = conversationHistory.slice(-6) // Last 6 messages
    const userMessages = recentMessages.filter(m => m.isUser).map(m => m.text)
    
    if (userMessages.length < 2) return null

    const interventionPrompt = `
    Analyze this conversation to determine if a different coach should intervene:

    Current Coach: ${currentCoach}
    Recent User Messages:
    ${userMessages.map((msg, i) => `${i + 1}. "${msg}"`).join('\n')}

    Look for patterns that suggest:
    1. User frustration or confusion
    2. Topic shift requiring different expertise
    3. Stalled progress or circular conversations
    4. Emotional distress needing specialized support
    5. Request for different type of help

    Respond with JSON:
    {
      "interventionNeeded": boolean,
      "triggerType": "pattern_detected|expertise_needed|user_frustrated|progress_stalled",
      "confidence": 0-100,
      "suggestedCoach": "coach_type",
      "reasoning": "explanation",
      "urgency": "low|medium|high|critical"
    }
    `

    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: interventionPrompt,
      temperature: 0.3
    })

    try {
      const analysis = JSON.parse(text)
      
      if (analysis.interventionNeeded && analysis.confidence > 70) {
        return {
          triggerType: analysis.triggerType,
          confidence: analysis.confidence,
          suggestedCoach: analysis.suggestedCoach,
          reasoning: analysis.reasoning,
          urgency: analysis.urgency
        }
      }
    } catch (error) {
      console.error('Failed to parse intervention analysis:', error)
    }

    return null
  }

  /**
   * Generate collaborative responses when multiple coaches work together
   */
  async generateCollaborativeResponse(
    sessionId: string,
    userInput: string,
    activeCoaches: CoachAgent[]
  ): Promise<{ content: string; speakingCoach: string; collaborationType: string }> {
    const collaboration = this.collaborations.get(sessionId)
    if (!collaboration) {
      throw new Error('No collaboration found')
    }

    // Determine collaboration approach
    const collaborationType = this.determineCollaborationType(userInput, activeCoaches)
    
    switch (collaborationType) {
      case 'sequential_expertise':
        return this.generateSequentialResponse(userInput, activeCoaches)
      
      case 'parallel_perspectives':
        return this.generateParallelResponse(userInput, activeCoaches)
      
      case 'building_on_previous':
        return this.generateBuildingResponse(userInput, activeCoaches, collaboration.handoffHistory)
      
      default:
        return this.generateStandardResponse(userInput, activeCoaches)
    }
  }

  /**
   * Generate sequential coaching response (one coach builds on another)
   */
  private async generateSequentialResponse(
    userInput: string,
    coaches: CoachAgent[]
  ): Promise<{ content: string; speakingCoach: string; collaborationType: string }> {
    const primaryCoach = coaches.find(c => c.weight === Math.max(...coaches.map(c => c.weight)))
    const supportingCoach = coaches.find(c => c !== primaryCoach)

    if (!primaryCoach || !supportingCoach) {
      return this.generateStandardResponse(userInput, coaches)
    }

    const responsePrompt = `
    Generate a collaborative coaching response where ${primaryCoach.name} provides the main guidance,
    then naturally introduces ${supportingCoach.name} for additional expertise.

    User Input: "${userInput}"
    
    ${primaryCoach.name} (${primaryCoach.type}): Primary response focusing on ${primaryCoach.expertise[0]}
    ${supportingCoach.name} (${supportingCoach.type}): Supporting insight on ${supportingCoach.expertise[0]}
    
    Create a natural flow where the primary coach responds first, then says something like:
    "And I'd love to have ${supportingCoach.name} add their perspective on..."
    
    Keep the total response under 150 words for voice delivery.
    `

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: responsePrompt,
      temperature: 0.7
    })

    return {
      content: text,
      speakingCoach: primaryCoach.type,
      collaborationType: 'sequential_expertise'
    }
  }

  /**
   * Generate parallel coaching response (coaches complement each other)
   */
  private async generateParallelResponse(
    userInput: string,
    coaches: CoachAgent[]
  ): Promise<{ content: string; speakingCoach: string; collaborationType: string }> {
    const speaker = coaches[0] // First coach speaks for the team
    
    const responsePrompt = `
    Generate a response where ${speaker.name} speaks on behalf of the coaching team.
    
    Team: ${coaches.map(c => `${c.name} (${c.type})`).join(', ')}
    User Input: "${userInput}"
    
    ${speaker.name} should acknowledge the different perspectives available:
    "From our team's perspective..." or "Drawing on our combined expertise in [areas]..."
    
    Integrate insights from all coaching specialties naturally.
    Keep under 150 words for voice delivery.
    `

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: responsePrompt,
      temperature: 0.7
    })

    return {
      content: text,
      speakingCoach: speaker.type,
      collaborationType: 'parallel_perspectives'
    }
  }

  /**
   * Generate building response (coach builds on previous coach's advice)
   */
  private async generateBuildingResponse(
    userInput: string,
    coaches: CoachAgent[],
    handoffHistory: CoachHandoff[]
  ): Promise<{ content: string; speakingCoach: string; collaborationType: string }> {
    const currentSpeaker = coaches[0]
    const lastHandoff = handoffHistory[handoffHistory.length - 1]
    
    const responsePrompt = `
    Generate a response where ${currentSpeaker.name} builds on previous coaching advice.
    
    Previous context: ${lastHandoff?.context || 'Earlier conversation'}
    User Input: "${userInput}"
    
    ${currentSpeaker.name} should acknowledge what was discussed before:
    "Building on what we talked about earlier..." or "Adding to that previous point..."
    
    Create continuity while bringing ${currentSpeaker.type} expertise.
    Keep under 150 words for voice delivery.
    `

    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: responsePrompt,
      temperature: 0.7
    })

    return {
      content: text,
      speakingCoach: currentSpeaker.type,
      collaborationType: 'building_on_previous'
    }
  }

  /**
   * Generate standard response when no special collaboration is needed
   */
  private async generateStandardResponse(
    userInput: string,
    coaches: CoachAgent[]
  ): Promise<{ content: string; speakingCoach: string; collaborationType: string }> {
    const speaker = coaches.find(c => c.weight === Math.max(...coaches.map(c => c.weight))) || coaches[0]
    
    return {
      content: `As your ${speaker.type.replace('_', ' ')}, I'd suggest...`, // Placeholder
      speakingCoach: speaker.type,
      collaborationType: 'standard'
    }
  }

  /**
   * Determine appropriate collaboration mode
   */
  private determineCollaborationMode(coaches: CoachAgent[]): 'sequential' | 'parallel' | 'intervention' | 'consultation' {
    if (coaches.length === 1) return 'sequential'
    
    const weightDifference = Math.max(...coaches.map(c => c.weight)) - Math.min(...coaches.map(c => c.weight))
    
    if (weightDifference > 50) return 'sequential' // One dominant coach
    if (weightDifference < 20) return 'parallel'   // Equal coaches
    
    return 'consultation' // Moderate difference
  }

  /**
   * Select primary speaker based on weights and expertise
   */
  private selectPrimarySpeaker(coaches: CoachAgent[]): string {
    const maxWeight = Math.max(...coaches.map(c => c.weight))
    const primaryCoach = coaches.find(c => c.weight === maxWeight)
    return primaryCoach?.type || coaches[0].type
  }

  /**
   * Determine collaboration type for response generation
   */
  private determineCollaborationType(userInput: string, coaches: CoachAgent[]): string {
    const input = userInput.toLowerCase()
    
    // Look for complex topics that benefit from multiple perspectives
    if (input.includes('complex') || input.includes('multiple') || input.includes('different')) {
      return 'parallel_perspectives'
    }
    
    // Look for building on previous advice
    if (input.includes('also') || input.includes('additionally') || input.includes('furthermore')) {
      return 'building_on_previous'
    }
    
    // Look for expertise-specific needs
    if (coaches.length > 1 && input.includes('specifically')) {
      return 'sequential_expertise'
    }
    
    return 'standard'
  }

  /**
   * Get collaboration status for UI display
   */
  getCollaborationStatus(sessionId: string): CoachCollaboration | null {
    return this.collaborations.get(sessionId) || null
  }

  /**
   * Update conversation flow phase
   */
  updateConversationFlow(sessionId: string, phase: ConversationFlow['phase'], nextActions: string[]) {
    const collaboration = this.collaborations.get(sessionId)
    if (collaboration) {
      collaboration.conversationFlow.phase = phase
      collaboration.conversationFlow.nextActions = nextActions
    }
  }

  /**
   * Clean up collaboration when session ends
   */
  endCollaboration(sessionId: string) {
    this.collaborations.delete(sessionId)
  }
}

export const coachCollaborator = new SyntheticCoachCollaborator()