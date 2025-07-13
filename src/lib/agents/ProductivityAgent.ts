/**
 * Productivity Agent
 * Specialized agent for task management, todo lists, and productivity optimization
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for productivity analysis
const productivityAnalysisSchema = z.object({
  intent: z.enum(['create_todos', 'organize_tasks', 'set_deadlines', 'prioritize', 'productivity_advice', 'workflow_design']),
  todos: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    deadline: z.string().optional(),
    category: z.string().optional(),
    estimatedTime: z.string().optional()
  })).optional(),
  prioritization: z.object({
    method: z.enum(['eisenhower', 'moscow', 'time-based', 'impact-effort']),
    reasoning: z.string()
  }).optional(),
  productivityTips: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()),
  shouldHandBack: z.boolean(),
  handBackReason: z.string().optional()
});

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: string;
  category?: string;
  estimatedTime?: string;
  completed: boolean;
  createdAt: Date;
  userId: string;
}

export interface ProductivitySession {
  userId: string;
  sessionId: string;
  todos: Todo[];
  productivityAdvice: string[];
  startedAt: Date;
  completedAt?: Date;
}

export class ProductivityAgent {
  private activeSessions: Map<string, ProductivitySession> = new Map();

  /**
   * Start a productivity session for a user
   */
  async startSession(userId: string, initialMessage: string): Promise<ProductivitySession> {
    const sessionId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ProductivitySession = {
      userId,
      sessionId,
      todos: [],
      productivityAdvice: [],
      startedAt: new Date()
    };

    this.activeSessions.set(userId, session);
    
    // Analyze initial message for productivity intent
    await this.processMessage(userId, initialMessage);
    
    return session;
  }

  /**
   * Process a message during productivity session
   */
  async processMessage(userId: string, message: string): Promise<{
    response: string;
    todos?: Todo[];
    shouldHandBack?: boolean;
    handBackReason?: string;
  }> {
    try {
      const session = this.activeSessions.get(userId);
      if (!session) {
        throw new Error('No active productivity session');
      }

      const analysis = await this.analyzeProductivityMessage(message, session);
      
      let response = '';
      let newTodos: Todo[] = [];

      switch (analysis.intent) {
        case 'create_todos':
          newTodos = await this.createTodos(userId, analysis.todos || []);
          response = this.generateTodoResponse(newTodos);
          break;
          
        case 'organize_tasks':
          response = await this.generateOrganizationAdvice(session.todos);
          break;
          
        case 'set_deadlines':
          response = this.generateDeadlineAdvice();
          break;
          
        case 'prioritize':
          response = this.generatePrioritizationAdvice(analysis.prioritization);
          break;
          
        case 'productivity_advice':
          response = this.generateProductivityAdvice(analysis.productivityTips || []);
          break;
          
        case 'workflow_design':
          response = await this.generateWorkflowAdvice(message);
          break;
          
        default:
          response = "I'm here to help with your productivity and task management. What would you like to organize?";
      }

      // Add next steps if provided
      if (analysis.nextSteps.length > 0) {
        response += '\n\n**Next Steps:**\n' + analysis.nextSteps.map(step => `• ${step}`).join('\n');
      }

      return {
        response,
        todos: newTodos.length > 0 ? newTodos : undefined,
        shouldHandBack: analysis.shouldHandBack,
        handBackReason: analysis.handBackReason
      };

    } catch (error) {
      console.error('Error processing productivity message:', error);
      return {
        response: "I'm having trouble processing that. Could you tell me more specifically what you'd like to organize or accomplish?"
      };
    }
  }

  /**
   * Use AI to analyze productivity-related messages
   */
  private async analyzeProductivityMessage(message: string, session: ProductivitySession) {
    const systemPrompt = `You are a specialized Productivity AI Agent focused on task management and productivity optimization.

CAPABILITIES:
- Create and organize todo lists
- Set priorities and deadlines  
- Provide productivity advice
- Design workflows and systems
- Time management guidance

CURRENT SESSION:
- Existing todos: ${session.todos.length}
- Session started: ${session.startedAt.toISOString()}

ANALYSIS GUIDELINES:
1. Identify the user's productivity intent
2. Extract actionable todos if mentioned
3. Determine priority levels based on urgency/importance
4. Suggest realistic deadlines when timeframes mentioned
5. Provide relevant productivity tips
6. Decide if task is complete (should hand back to Quest)

HANDBACK CRITERIA:
- User explicitly says they're done with tasks
- Conversation shifts away from productivity topics
- User asks for non-productivity help (career advice, etc.)

TODO EXTRACTION:
- Look for action items, tasks, or things to accomplish
- Convert vague goals into specific actionable items
- Infer priority from context (urgent words, deadlines, etc.)
- Estimate time when possible

PRIORITIZATION METHODS:
- eisenhower: Important/Urgent matrix
- moscow: Must/Should/Could/Won't have
- time-based: Deadline-driven prioritization
- impact-effort: High impact, low effort first`;

    const result = await generateObject({
      model: openai('gpt-4'),
      schema: productivityAnalysisSchema,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this productivity request: "${message}"` }
      ]
    });

    return result.object;
  }

  /**
   * Create todos from analysis
   */
  private async createTodos(userId: string, todoData: any[]): Promise<Todo[]> {
    const session = this.activeSessions.get(userId);
    if (!session) return [];

    const newTodos: Todo[] = todoData.map(todo => ({
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      deadline: todo.deadline,
      category: todo.category,
      estimatedTime: todo.estimatedTime,
      completed: false,
      createdAt: new Date(),
      userId
    }));

    // Add to session
    session.todos.push(...newTodos);

    return newTodos;
  }

  /**
   * Generate response for created todos
   */
  private generateTodoResponse(todos: Todo[]): string {
    if (todos.length === 0) {
      return "I didn't detect any specific tasks. Could you tell me what you'd like to accomplish?";
    }

    let response = `Great! I've created ${todos.length} task${todos.length > 1 ? 's' : ''} for you:\n\n`;
    
    todos.forEach((todo, index) => {
      response += `${index + 1}. **${todo.title}**\n`;
      if (todo.description) response += `   ${todo.description}\n`;
      response += `   Priority: ${todo.priority}`;
      if (todo.deadline) response += ` | Deadline: ${todo.deadline}`;
      if (todo.estimatedTime) response += ` | Time: ${todo.estimatedTime}`;
      response += '\n\n';
    });

    response += "Would you like me to help prioritize these or add more tasks?";
    return response;
  }

  /**
   * Generate organization advice
   */
  private async generateOrganizationAdvice(todos: Todo[]): Promise<string> {
    if (todos.length === 0) {
      return "You don't have any tasks yet. Let's start by identifying what you need to accomplish!";
    }

    const highPriority = todos.filter(t => t.priority === 'high' || t.priority === 'urgent');
    const withDeadlines = todos.filter(t => t.deadline);
    
    let advice = "Here's how I recommend organizing your tasks:\n\n";
    
    if (highPriority.length > 0) {
      advice += `**Start with high priority items:** ${highPriority.map(t => t.title).join(', ')}\n\n`;
    }
    
    if (withDeadlines.length > 0) {
      advice += `**Time-sensitive tasks:** ${withDeadlines.map(t => `${t.title} (${t.deadline})`).join(', ')}\n\n`;
    }
    
    advice += "**Productivity tip:** Try the 2-minute rule - if something takes less than 2 minutes, do it now rather than adding it to your list.";
    
    return advice;
  }

  /**
   * Generate deadline advice
   */
  private generateDeadlineAdvice(): string {
    return `**Setting Effective Deadlines:**

• **Be specific:** Use exact dates and times, not "soon" or "this week"
• **Add buffer time:** Account for unexpected delays
• **Break down large tasks:** Set mini-deadlines for complex projects
• **Consider dependencies:** Some tasks must wait for others to complete

Would you like me to help set specific deadlines for any of your tasks?`;
  }

  /**
   * Generate prioritization advice
   */
  private generatePrioritizationAdvice(prioritization?: any): string {
    if (!prioritization) {
      return `**Prioritization Methods:**

• **Eisenhower Matrix:** Important vs Urgent quadrants
• **MoSCoW:** Must/Should/Could/Won't have
• **Impact-Effort:** High impact, low effort tasks first
• **Time-based:** Deadline-driven prioritization

Which method would you like to use for your tasks?`;
    }

    return `I recommend using the **${prioritization.method}** method because: ${prioritization.reasoning}`;
  }

  /**
   * Generate productivity advice
   */
  private generateProductivityAdvice(tips: string[]): string {
    const defaultTips = [
      "Use time-blocking to schedule focused work periods",
      "Batch similar tasks together to reduce context switching",
      "Take regular breaks using the Pomodoro Technique (25 min work, 5 min break)",
      "Keep your workspace organized and distraction-free",
      "Review and update your task list daily"
    ];

    const advice = tips.length > 0 ? tips : defaultTips.slice(0, 3);
    
    return `**Productivity Tips:**\n\n${advice.map(tip => `• ${tip}`).join('\n')}\n\nWould you like me to elaborate on any of these strategies?`;
  }

  /**
   * Generate workflow advice
   */
  private async generateWorkflowAdvice(message: string): Promise<string> {
    return `**Workflow Design Principles:**

• **Start small:** Begin with simple, repeatable processes
• **Automate routine tasks:** Use tools and templates where possible
• **Regular reviews:** Weekly check-ins to adjust and improve
• **Clear handoffs:** Define what moves a task from one stage to the next

What specific workflow challenge would you like help designing?`;
  }

  /**
   * Get session data
   */
  getSession(userId: string): ProductivitySession | undefined {
    return this.activeSessions.get(userId);
  }

  /**
   * End productivity session
   */
  endSession(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.completedAt = new Date();
      this.activeSessions.delete(userId);
    }
  }

  /**
   * Get session summary for handback
   */
  getSessionSummary(userId: string): string {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return "No productivity session found.";
    }

    const completedTodos = session.todos.filter(t => t.completed).length;
    const totalTodos = session.todos.length;
    
    return `**Productivity Session Summary:**
• Created ${totalTodos} tasks
• Completed ${completedTodos} tasks
• ${session.productivityAdvice.length} productivity tips shared
• Session duration: ${Math.round((Date.now() - session.startedAt.getTime()) / 60000)} minutes

Your tasks are organized and ready to tackle! 🎯`;
  }
}

export const productivityAgent = new ProductivityAgent();