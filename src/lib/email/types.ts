/**
 * Email System Types
 * Defines all types for the Quest email management system
 */

export type EmailProvider = 'mailtrap' | 'sendgrid' | 'smtp'

export type EmailTemplateType = 
  | 'join_quest'         // External user invitation
  | 'coach_request'      // Coach connection request
  | 'peer_request'       // Peer connection request
  | 'colleague_connect'  // Colleague connection
  | 'verification'       // Company verification
  | 'welcome'           // Post-registration welcome
  | 'connection_accepted' // Connection request accepted
  | 'coaching_feedback'  // Coaching session feedback
  | 'job_opportunity'    // Job opportunity notification
  | 'session_reminder'   // Upcoming coaching session
  | 'goal_milestone'     // Goal achievement notification
  | 'weekly_progress'    // Weekly progress summary

export type ConnectionType = 'coach' | 'peer' | 'colleague' | 'mentor'

export type InvitationStatus = 'sent' | 'opened' | 'accepted' | 'expired' | 'declined'

export type VerificationStatus = 'unverified' | 'pending' | 'verified'

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  template: EmailTemplateType
  variables: Record<string, any>
  replyTo?: string
  category?: string
  tags?: string[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider: EmailProvider
}

export interface EmailTemplate {
  id: EmailTemplateType
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

export interface ConnectionInvite {
  id: string
  senderId: string
  senderName: string
  senderCompany?: string
  recipientEmail: string
  recipientName?: string
  connectionType: ConnectionType
  personalizedMessage: string
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
}

export interface CompanyVerification {
  userId: string
  companyName: string
  companyEmail: string
  verificationCode: string
  status: VerificationStatus
  createdAt: Date
  expiresAt: Date
  verifiedAt?: Date
}

export interface EmailLog {
  id: string
  recipient: string
  subject: string
  template: EmailTemplateType
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  provider: EmailProvider
  messageId?: string
  openedAt?: Date
  clickedAt?: Date
  error?: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface MailtrapConfig {
  apiToken: string
  inboxId?: string
  accountId?: string
  testing?: boolean
}

export interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}