/**
 * Mailtrap MCP Integration
 * Enables conversational AI to send emails through natural language
 */

import { emailService } from './service'
import { ConnectionType } from './types'

export interface MCPEmailRequest {
  action: 'send_invite' | 'send_verification' | 'send_external_invite'
  parameters: Record<string, any>
}

export interface MCPEmailResponse {
  success: boolean
  message: string
  details?: any
}

/**
 * Process natural language email requests from AI conversation
 */
export async function processMCPEmailRequest(
  request: string,
  context: {
    userId: string
    userName: string
    userEmail: string
    userCompany?: string
  }
): Promise<MCPEmailResponse> {
  try {
    // Parse the natural language request
    const parsedRequest = await parseEmailRequest(request, context)
    
    // Execute the appropriate action
    switch (parsedRequest.action) {
      case 'send_invite':
        return await handleConnectionInvite(parsedRequest.parameters, context)
      
      case 'send_verification':
        return await handleVerificationRequest(parsedRequest.parameters, context)
      
      case 'send_external_invite':
        return await handleExternalInvite(parsedRequest.parameters, context)
      
      default:
        return {
          success: false,
          message: 'Unknown email action requested'
        }
    }
  } catch (error) {
    console.error('MCP email processing error:', error)
    return {
      success: false,
      message: 'Failed to process email request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Parse natural language into structured email request
 */
async function parseEmailRequest(
  request: string,
  context: any
): Promise<MCPEmailRequest> {
  const lowerRequest = request.toLowerCase()
  
  // Connection invite patterns
  if (lowerRequest.includes('invite') && (lowerRequest.includes('coach') || lowerRequest.includes('peer'))) {
    const emailMatch = request.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]
    const nameMatch = request.match(/(?:invite|send to|email)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[1]
    
    const connectionType: ConnectionType = lowerRequest.includes('coach') ? 'coach' : 
                                          lowerRequest.includes('peer') ? 'peer' : 
                                          lowerRequest.includes('mentor') ? 'mentor' : 'colleague'
    
    // Extract personalized message if present
    const messageMatch = request.match(/["'](.+?)["']/)?.[1]
    
    return {
      action: 'send_invite',
      parameters: {
        recipientEmail: emailMatch,
        recipientName: nameMatch,
        connectionType,
        personalizedMessage: messageMatch
      }
    }
  }
  
  // Verification request patterns
  if (lowerRequest.includes('verify') && lowerRequest.includes('company')) {
    const emailMatch = request.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]
    
    return {
      action: 'send_verification',
      parameters: {
        companyEmail: emailMatch || `${context.userName.toLowerCase().replace(/\s+/g, '.')}@${context.userCompany?.toLowerCase().replace(/\s+/g, '')}.com`
      }
    }
  }
  
  // External invite patterns
  if (lowerRequest.includes('invite') && !lowerRequest.includes('coach') && !lowerRequest.includes('peer')) {
    const emailMatch = request.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1]
    const nameMatch = request.match(/(?:invite|send to|email)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)?.[1]
    const messageMatch = request.match(/["'](.+?)["']/)?.[1]
    
    return {
      action: 'send_external_invite',
      parameters: {
        recipientEmail: emailMatch,
        recipientName: nameMatch,
        personalizedMessage: messageMatch
      }
    }
  }
  
  throw new Error('Could not parse email request')
}

/**
 * Handle connection invite
 */
async function handleConnectionInvite(
  params: any,
  context: any
): Promise<MCPEmailResponse> {
  if (!params.recipientEmail) {
    return {
      success: false,
      message: 'I need the recipient\'s email address to send the invitation.'
    }
  }
  
  const result = await emailService.sendConnectionInvite({
    senderId: context.userId,
    senderName: context.userName,
    senderCompany: context.userCompany,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    connectionType: params.connectionType || 'colleague',
    personalizedMessage: params.personalizedMessage || ''
  })
  
  if (result.success) {
    return {
      success: true,
      message: `I've sent a ${params.connectionType} invitation to ${params.recipientName || params.recipientEmail}. They'll receive an email shortly with your invitation.`,
      details: { messageId: result.messageId }
    }
  } else {
    return {
      success: false,
      message: `I couldn't send the invitation. ${result.error || 'Please try again later.'}`,
      details: result.error
    }
  }
}

/**
 * Handle verification request
 */
async function handleVerificationRequest(
  params: any,
  context: any
): Promise<MCPEmailResponse> {
  if (!params.companyEmail) {
    return {
      success: false,
      message: 'I need your company email address to send the verification code.'
    }
  }
  
  const result = await emailService.sendVerificationEmail(
    context.userId,
    context.userName,
    context.userCompany || 'your company',
    params.companyEmail
  )
  
  if (result.success) {
    return {
      success: true,
      message: `I've sent a verification code to ${params.companyEmail}. Check your email and enter the 6-digit code when you receive it.`,
      details: { messageId: result.messageId }
    }
  } else {
    return {
      success: false,
      message: `I couldn't send the verification email. ${result.error || 'Please check the email address and try again.'}`,
      details: result.error
    }
  }
}

/**
 * Handle external invite
 */
async function handleExternalInvite(
  params: any,
  context: any
): Promise<MCPEmailResponse> {
  if (!params.recipientEmail) {
    return {
      success: false,
      message: 'I need the person\'s email address to send the invitation.'
    }
  }
  
  const result = await emailService.sendExternalInvite(
    context.userName,
    context.userCompany || 'Quest',
    params.recipientEmail,
    params.recipientName,
    params.personalizedMessage
  )
  
  if (result.success) {
    return {
      success: true,
      message: `I've sent an invitation to ${params.recipientName || params.recipientEmail} to join Quest. They'll receive an email with instructions on how to sign up and connect with you.`,
      details: { messageId: result.messageId }
    }
  } else {
    return {
      success: false,
      message: `I couldn't send the invitation. ${result.error || 'Please try again later.'}`,
      details: result.error
    }
  }
}

/**
 * Generate natural language response for email status
 */
export function generateEmailStatusResponse(
  status: 'sending' | 'sent' | 'failed',
  details?: any
): string {
  switch (status) {
    case 'sending':
      return 'I\'m preparing and sending the email now...'
    
    case 'sent':
      return details?.recipientName 
        ? `Perfect! I've sent the email to ${details.recipientName}. They should receive it shortly.`
        : 'The email has been sent successfully!'
    
    case 'failed':
      return details?.error
        ? `I encountered an issue sending the email: ${details.error}. Would you like me to try again?`
        : 'I couldn\'t send the email right now. Please try again in a moment.'
    
    default:
      return 'I\'m processing your email request...'
  }
}