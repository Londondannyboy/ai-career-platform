/**
 * Multi-Agent Orchestration System
 * Manages handovers between specialized AI agents during conversation
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for agent handover decision
const handoverAnalysisSchema = z.object({
  shouldHandover: z.boolean(),
  targetAgent: z.enum(['productivity', 'calendar', 'goal', 'learning', 'quest']).optional(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  triggerKeywords: z.array(z.string()),
  urgency: z.enum(['low', 'medium', 'high']),
  suggestedHandoverMessage: z.string()
});

// Schema for agent capability
const agentCapabilitySchema = z.object({
  agentId: z.string(),
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  triggerKeywords: z.array(z.string()),
  confidenceThreshold: z.number().min(0).max(1)
});

export interface AgentCapability {
  agentId: string;
  name: string;
  description: string;
  capabilities: string[];
  triggerKeywords: string[];
  confidenceThreshold: number;
}

export interface HandoverDecision {
  shouldHandover: boolean;
  targetAgent?: string;
  confidence: number;
  reason: string;
  triggerKeywords: string[];
  urgency: 'low' | 'medium' | 'high';
  suggestedHandoverMessage: string;
}

export interface ConversationContext {
  userId: string;
  currentAgent: string;
  messageHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    agentId?: string;
  }>;
  userProfile?: any;
  sessionContext?: any;
}

export class AgentOrchestrator {
  private registeredAgents: Map<string, AgentCapability> = new Map();
  private activeHandovers: Map<string, string> = new Map(); // userId -> currentAgentId

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Initialize default agent capabilities
   */
  private initializeDefaultAgents() {
    const defaultAgents: AgentCapability[] = [
      {
        agentId: 'quest',
        name: 'Quest Career Coach',
        description: 'Primary career coaching and professional development agent',
        capabilities: [
          'career coaching',
          'skill development', 
          'professional guidance',
          'interview preparation',
          'networking advice'
        ],
        triggerKeywords: [
          'career', 'job', 'interview', 'resume', 'cv', 'networking',
          'promotion', 'salary', 'skills', 'development', 'coaching'
        ],
        confidenceThreshold: 0.7
      },
      {
        agentId: 'productivity',
        name: 'Productivity Assistant',
        description: 'Task management, todo lists, and productivity optimization',
        capabilities: [
          'task management',
          'todo lists',
          'deadline tracking',
          'priority setting',
          'productivity optimization',
          'workflow design'
        ],
        triggerKeywords: [
          'todo', 'task', 'deadline', 'priority', 'organize', 'schedule',
          'productivity', 'efficiency', 'workflow', 'checklist', 'reminder'
        ],
        confidenceThreshold: 0.8
      },
      {
        agentId: 'goal',
        name: 'Goal Setting Agent',
        description: 'OKR management, milestone tracking, and goal achievement',
        capabilities: [
          'goal setting',
          'OKR creation',
          'milestone tracking',
          'progress monitoring',
          'achievement planning',
          'SMART goals'
        ],
        triggerKeywords: [
          'goal', 'objective', 'target', 'milestone', 'okr', 'achievement',
          'plan', 'roadmap', 'vision', 'aim', 'aspiration', 'ambition'
        ],
        confidenceThreshold: 0.8
      },
      {
        agentId: 'calendar',
        name: 'Calendar & Scheduling Agent',
        description: 'Meeting scheduling, time management, and calendar optimization',
        capabilities: [
          'meeting scheduling',
          'time blocking',
          'calendar management',
          'availability coordination',
          'time optimization',
          'event planning'
        ],
        triggerKeywords: [
          'meeting', 'schedule', 'calendar', 'appointment', 'time', 'available',
          'book', 'reschedule', 'conflict', 'busy', 'free', 'when'
        ],
        confidenceThreshold: 0.8
      },
      {
        agentId: 'learning',
        name: 'Learning & Development Agent', 
        description: 'Skill learning paths, course recommendations, and knowledge acquisition',
        capabilities: [
          'learning path creation',
          'course recommendations',
          'skill gap analysis',
          'study planning',
          'knowledge assessment',
          'certification guidance'
        ],
        triggerKeywords: [
          'learn', 'course', 'training', 'education', 'study', 'certification',
          'improve', 'master', 'practice', 'tutorial', 'workshop', 'bootcamp'
        ],
        confidenceThreshold: 0.8
      }
    ];

    defaultAgents.forEach(agent => {
      this.registeredAgents.set(agent.agentId, agent);
    });
  }

  /**
   * Register a new specialized agent
   */
  registerAgent(agent: AgentCapability): void {
    this.registeredAgents.set(agent.agentId, agent);
  }

  /**
   * Analyze conversation and determine if handover is needed
   */
  async analyzeForHandover(context: ConversationContext): Promise<HandoverDecision | null> {
    try {
      // Get recent messages for analysis
      const recentMessages = context.messageHistory.slice(-3);
      const currentMessage = recentMessages[recentMessages.length - 1]?.content || '';
      
      // Get available agents (excluding current agent)
      const availableAgents = Array.from(this.registeredAgents.values())
        .filter(agent => agent.agentId !== context.currentAgent);

      if (availableAgents.length === 0) {
        return null;
      }

      const agentDescriptions = availableAgents.map(agent => 
        `${agent.agentId}: ${agent.description} (triggers: ${agent.triggerKeywords.slice(0, 5).join(', ')})`
      ).join('\n');

      const conversationHistory = recentMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const systemPrompt = `You are an AI agent orchestrator that determines when conversations should be handed over to specialized agents.

Current Agent: ${context.currentAgent}
Available Specialized Agents:
${agentDescriptions}

HANDOVER CRITERIA:
1. User explicitly mentions agent capabilities (high confidence)
2. Conversation naturally shifts to specialized domain (medium confidence)  
3. Current agent limitations evident (medium confidence)
4. User frustration or repeated requests (high urgency)

ANALYSIS RULES:
- Only suggest handover if specialized agent clearly better suited
- Consider conversation flow and user intent
- Avoid frequent unnecessary handovers
- Prioritize user experience over technical capabilities

CONFIDENCE THRESHOLDS:
- 0.9+: Explicit request for specialized capability
- 0.8+: Clear domain shift requiring expertise
- 0.7+: Beneficial but not essential handover
- <0.7: Stay with current agent

USER PROFILE: ${JSON.stringify(context.userProfile || {})}`;

      const result = await generateObject({
        model: openai('gpt-4'),
        schema: handoverAnalysisSchema,
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Analyze this conversation for potential agent handover:\n\n${conversationHistory}\n\nLatest message: "${currentMessage}"` 
          }
        ]
      });

      const decision = result.object;
      
      // Only return handover decision if confidence meets threshold
      if (decision.shouldHandover && decision.confidence >= 0.7) {
        return decision;
      }

      return null;
    } catch (error) {
      console.error('Error analyzing for handover:', error);
      return null;
    }
  }

  /**
   * Execute agent handover
   */
  async executeHandover(
    userId: string, 
    targetAgentId: string, 
    context: ConversationContext
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const targetAgent = this.registeredAgents.get(targetAgentId);
      if (!targetAgent) {
        throw new Error(`Target agent ${targetAgentId} not found`);
      }

      // Update active handover tracking
      this.activeHandovers.set(userId, targetAgentId);

      // Create handover context for target agent
      const handoverContext = {
        fromAgent: context.currentAgent,
        toAgent: targetAgentId,
        conversationHistory: context.messageHistory,
        userProfile: context.userProfile,
        handoverReason: 'User requested specialized assistance',
        timestamp: new Date()
      };

      // Log handover for analytics
      console.log(`🔄 Agent handover: ${context.currentAgent} → ${targetAgentId} for user ${userId}`);

      return {
        success: true,
        message: `Handover completed to ${targetAgent.name}`
      };
    } catch (error) {
      console.error('Error executing handover:', error);
      return {
        success: false,
        message: 'Failed to execute agent handover'
      };
    }
  }

  /**
   * Get current active agent for user
   */
  getCurrentAgent(userId: string): string {
    return this.activeHandovers.get(userId) || 'quest';
  }

  /**
   * Hand back to primary Quest agent
   */
  async handBackToQuest(userId: string, reason?: string): Promise<void> {
    const currentAgent = this.getCurrentAgent(userId);
    
    if (currentAgent !== 'quest') {
      this.activeHandovers.set(userId, 'quest');
      console.log(`🔄 Handing back to Quest: ${currentAgent} → quest for user ${userId}. Reason: ${reason || 'Task completed'}`);
    }
  }

  /**
   * Get available agents and their capabilities
   */
  getAvailableAgents(): AgentCapability[] {
    return Array.from(this.registeredAgents.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentCapability | undefined {
    return this.registeredAgents.get(agentId);
  }

  /**
   * Simple keyword-based handover detection (fallback)
   */
  detectHandoverKeywords(message: string): { agentId: string; confidence: number } | null {
    const messageLower = message.toLowerCase();
    
    for (const [agentId, agent] of this.registeredAgents) {
      if (agentId === 'quest') continue; // Skip primary agent
      
      const matchedKeywords = agent.triggerKeywords.filter(keyword => 
        messageLower.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        const confidence = Math.min(0.9, matchedKeywords.length * 0.3);
        if (confidence >= agent.confidenceThreshold) {
          return { agentId, confidence };
        }
      }
    }
    
    return null;
  }
}

export const agentOrchestrator = new AgentOrchestrator();