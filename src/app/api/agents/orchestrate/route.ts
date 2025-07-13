import { NextRequest, NextResponse } from 'next/server';
import { agentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { productivityAgent } from '@/lib/agents/ProductivityAgent';

export async function POST(request: NextRequest) {
  try {
    const { action, userId, message, currentAgent = 'quest', messageHistory = [] } = await request.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing userId or message' }, { status: 400 });
    }

    switch (action) {
      case 'analyze_handover':
        return await handleHandoverAnalysis(userId, message, currentAgent, messageHistory);
      
      case 'execute_handover':
        return await handleHandoverExecution(userId, message, request);
      
      case 'agent_response':
        return await handleAgentResponse(userId, message, currentAgent, request);
        
      case 'hand_back':
        return await handleHandBack(userId, request);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in agent orchestration:', error);
    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 });
  }
}

async function handleHandoverAnalysis(
  userId: string, 
  message: string, 
  currentAgent: string, 
  messageHistory: any[]
) {
  const context = {
    userId,
    currentAgent,
    messageHistory: messageHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp || Date.now())
    }))
  };

  // Analyze if handover is needed
  const handoverDecision = await agentOrchestrator.analyzeForHandover(context);
  
  if (handoverDecision && handoverDecision.shouldHandover) {
    return NextResponse.json({
      shouldHandover: true,
      targetAgent: handoverDecision.targetAgent,
      confidence: handoverDecision.confidence,
      reason: handoverDecision.reason,
      suggestedMessage: handoverDecision.suggestedHandoverMessage,
      urgency: handoverDecision.urgency
    });
  }

  // Fallback: Check simple keyword detection
  const keywordDetection = agentOrchestrator.detectHandoverKeywords(message);
  if (keywordDetection && keywordDetection.confidence > 0.7) {
    const agent = agentOrchestrator.getAgent(keywordDetection.agentId);
    return NextResponse.json({
      shouldHandover: true,
      targetAgent: keywordDetection.agentId,
      confidence: keywordDetection.confidence,
      reason: `Detected ${agent?.name} keywords in conversation`,
      suggestedMessage: `I noticed you mentioned ${agent?.name.toLowerCase()} topics. Would you like me to connect you with our specialized ${agent?.name}?`,
      urgency: 'medium'
    });
  }

  return NextResponse.json({ shouldHandover: false });
}

async function handleHandoverExecution(
  userId: string, 
  message: string, 
  request: NextRequest
) {
  const { targetAgent, context } = await request.json();
  
  const handoverResult = await agentOrchestrator.executeHandover(userId, targetAgent, context);
  
  if (handoverResult.success) {
    // Initialize specialized agent session
    let agentResponse = '';
    
    if (targetAgent === 'productivity') {
      const session = await productivityAgent.startSession(userId, message);
      const response = await productivityAgent.processMessage(userId, message);
      agentResponse = `**🎯 Productivity Assistant activated!**\n\n${response.response}`;
      
      return NextResponse.json({
        success: true,
        agentResponse,
        currentAgent: targetAgent,
        sessionData: session,
        todos: response.todos
      });
    }
    
    // Add other specialized agents here
    return NextResponse.json({
      success: true,
      agentResponse: `Handover to ${targetAgent} completed successfully.`,
      currentAgent: targetAgent
    });
  }

  return NextResponse.json({
    success: false,
    error: handoverResult.message
  }, { status: 500 });
}

async function handleAgentResponse(
  userId: string, 
  message: string, 
  currentAgent: string, 
  request: NextRequest
) {
  let response = '';
  let shouldHandBack = false;
  let handBackReason = '';
  let additionalData: any = {};

  switch (currentAgent) {
    case 'productivity':
      const productivityResponse = await productivityAgent.processMessage(userId, message);
      response = productivityResponse.response;
      shouldHandBack = productivityResponse.shouldHandBack || false;
      handBackReason = productivityResponse.handBackReason || '';
      
      if (productivityResponse.todos) {
        additionalData.todos = productivityResponse.todos;
      }
      break;
      
    case 'quest':
    default:
      response = "I'm Quest, your career coaching agent. How can I help you with your professional development today?";
      break;
  }

  // Handle automatic handback
  if (shouldHandBack) {
    await agentOrchestrator.handBackToQuest(userId, handBackReason);
    const sessionSummary = currentAgent === 'productivity' 
      ? productivityAgent.getSessionSummary(userId)
      : 'Session completed.';
    
    productivityAgent.endSession(userId);
    
    response += `\n\n---\n\n**🔄 Handing back to Quest Career Coach**\n\n${sessionSummary}\n\nHow else can I assist with your career development?`;
    
    return NextResponse.json({
      response,
      currentAgent: 'quest',
      handedBack: true,
      sessionSummary,
      ...additionalData
    });
  }

  return NextResponse.json({
    response,
    currentAgent,
    ...additionalData
  });
}

async function handleHandBack(userId: string, request: NextRequest) {
  const { currentAgent, reason } = await request.json();
  
  await agentOrchestrator.handBackToQuest(userId, reason);
  
  // End any active specialized sessions
  if (currentAgent === 'productivity') {
    const sessionSummary = productivityAgent.getSessionSummary(userId);
    productivityAgent.endSession(userId);
    
    return NextResponse.json({
      success: true,
      message: `**🔄 Returned to Quest Career Coach**\n\n${sessionSummary}\n\nI'm back to help with your career development. What would you like to focus on next?`,
      currentAgent: 'quest',
      sessionSummary
    });
  }
  
  return NextResponse.json({
    success: true,
    message: "I'm back to help with your career development. What would you like to focus on next?",
    currentAgent: 'quest'
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const userId = url.searchParams.get('userId');

    if (action === 'agents') {
      const agents = agentOrchestrator.getAvailableAgents();
      return NextResponse.json({ agents });
    }

    if (action === 'current_agent' && userId) {
      const currentAgent = agentOrchestrator.getCurrentAgent(userId);
      return NextResponse.json({ currentAgent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in agent orchestration GET:', error);
    return NextResponse.json({ error: 'Failed to get agent data' }, { status: 500 });
  }
}