/**
 * Unified Email Service
 * Manages all email communications for Quest platform
 */

import { createClient } from '@/lib/supabase/client'
import { 
  EmailOptions, 
  EmailResult, 
  EmailLog,
  ConnectionInvite,
  CompanyVerification,
  InvitationStatus,
  VerificationStatus,
  ConnectionType
} from './types'
import { MailtrapService, createMailtrapService } from './mailtrap-service'

export class EmailService {
  private mailtrap: MailtrapService
  private supabase = createClient()

  constructor() {
    this.mailtrap = createMailtrapService()
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    // Send via Mailtrap
    const result = await this.mailtrap.sendEmail(options)

    // Log the email
    await this.logEmail({
      recipient: Array.isArray(options.to) ? options.to[0].email : options.to.email,
      subject: options.subject,
      template: options.template,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      metadata: options.variables,
      createdAt: new Date()
    } as EmailLog)

    return result
  }

  /**
   * Send connection invitation
   */
  async sendConnectionInvite(
    invite: Omit<ConnectionInvite, 'id' | 'status' | 'createdAt' | 'expiresAt'>
  ): Promise<EmailResult> {
    // Generate invitation record
    const fullInvite: ConnectionInvite = {
      ...invite,
      id: this.generateId(),
      status: 'sent',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    }

    // Save invitation to database
    const { error } = await this.supabase
      .from('connection_invites')
      .insert(fullInvite)

    if (error) {
      console.error('Failed to save invitation:', error)
    }

    // Determine template based on connection type
    const templateMap: Record<ConnectionType, any> = {
      coach: 'coach_request',
      peer: 'peer_request',
      colleague: 'colleague_connect',
      mentor: 'coach_request'
    }

    // Send email
    const emailOptions: EmailOptions = {
      to: { email: invite.recipientEmail, name: invite.recipientName },
      template: templateMap[invite.connectionType],
      variables: {
        recipientName: invite.recipientName || 'there',
        senderName: invite.senderName,
        company: invite.senderCompany || 'your company',
        personalizedMessage: invite.personalizedMessage,
        acceptLink: `${process.env.NEXT_PUBLIC_APP_URL}/invites/${fullInvite.id}/accept`,
        viewProfileLink: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${invite.senderId}`,
        // Additional variables for coach requests
        senderTitle: '', // TODO: Fetch from user profile
        focusAreas: 'Professional development', // TODO: Fetch from user goals
        goals: 'Career growth and skill development', // TODO: Fetch from user goals
        // For peer requests
        commonInterests: 'Professional development' // TODO: Calculate from profiles
      },
      category: 'connection_invite',
      tags: [invite.connectionType, 'invitation']
    }

    return this.sendEmail(emailOptions)
  }

  /**
   * Send company verification email
   */
  async sendVerificationEmail(
    userId: string,
    userName: string,
    companyName: string,
    companyEmail: string
  ): Promise<EmailResult> {
    // Generate verification code
    const verificationCode = this.generateVerificationCode()

    // Save verification record
    const verification: CompanyVerification = {
      userId,
      companyName,
      companyEmail,
      verificationCode,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }

    const { error } = await this.supabase
      .from('company_verifications')
      .insert(verification)

    if (error) {
      console.error('Failed to save verification:', error)
    }

    // Send email
    return this.sendEmail({
      to: { email: companyEmail, name: userName },
      template: 'verification',
      variables: {
        userName,
        company: companyName,
        verificationCode
      },
      category: 'verification'
    })
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    company?: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: { email, name: userName },
      template: 'welcome',
      variables: {
        userName,
        company: company || 'Quest',
        startLink: `${process.env.NEXT_PUBLIC_APP_URL}/quest`
      },
      category: 'onboarding'
    })
  }

  /**
   * Send external user invitation
   */
  async sendExternalInvite(
    senderName: string,
    senderCompany: string,
    recipientEmail: string,
    recipientName?: string,
    personalizedMessage?: string
  ): Promise<EmailResult> {
    // Generate join link with invitation tracking
    const inviteId = this.generateId()
    const joinLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?invite=${inviteId}`

    return this.sendEmail({
      to: { email: recipientEmail, name: recipientName },
      template: 'join_quest',
      variables: {
        recipientName: recipientName || 'there',
        senderName,
        senderCompany,
        personalizedMessage,
        joinLink
      },
      category: 'external_invite'
    })
  }

  /**
   * Update invitation status
   */
  async updateInvitationStatus(
    inviteId: string,
    status: InvitationStatus
  ): Promise<void> {
    const { error } = await this.supabase
      .from('connection_invites')
      .update({ status })
      .eq('id', inviteId)

    if (error) {
      console.error('Failed to update invitation status:', error)
    }
  }

  /**
   * Verify company email code
   */
  async verifyCompanyEmail(
    userId: string,
    code: string
  ): Promise<{ success: boolean; error?: string }> {
    // Find verification record
    const { data, error } = await this.supabase
      .from('company_verifications')
      .select('*')
      .eq('userId', userId)
      .eq('verificationCode', code)
      .eq('status', 'pending')
      .gte('expiresAt', new Date().toISOString())
      .single()

    if (error || !data) {
      return { success: false, error: 'Invalid or expired code' }
    }

    // Update verification status
    await this.supabase
      .from('company_verifications')
      .update({ 
        status: 'verified' as VerificationStatus,
        verifiedAt: new Date()
      })
      .eq('id', data.id)

    // Update user profile
    await this.supabase
      .from('users')
      .update({
        company_verified: true,
        company_email: data.companyEmail,
        company_name: data.companyName
      })
      .eq('id', userId)

    return { success: true }
  }

  /**
   * Log email activity
   */
  private async logEmail(log: EmailLog): Promise<void> {
    const { error } = await this.supabase
      .from('email_logs')
      .insert({
        ...log,
        id: this.generateId()
      })

    if (error) {
      console.error('Failed to log email:', error)
    }
  }

  /**
   * Track email events (opens, clicks)
   */
  async trackEmailEvent(
    messageId: string,
    event: 'opened' | 'clicked'
  ): Promise<void> {
    const updateData = event === 'opened' 
      ? { status: 'opened', openedAt: new Date() }
      : { status: 'clicked', clickedAt: new Date() }

    const { error } = await this.supabase
      .from('email_logs')
      .update(updateData)
      .eq('messageId', messageId)

    if (error) {
      console.error('Failed to track email event:', error)
    }
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    sent: number
    delivered: number
    opened: number
    clicked: number
    failed: number
    byTemplate: Record<string, number>
  }> {
    const { data, error } = await this.supabase
      .from('email_logs')
      .select('status, template')
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())

    if (error || !data) {
      console.error('Failed to get email analytics:', error)
      return {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        failed: 0,
        byTemplate: {}
      }
    }

    const analytics = {
      sent: data.length,
      delivered: data.filter(e => e.status === 'delivered').length,
      opened: data.filter(e => e.status === 'opened' || e.status === 'clicked').length,
      clicked: data.filter(e => e.status === 'clicked').length,
      failed: data.filter(e => e.status === 'failed').length,
      byTemplate: {} as Record<string, number>
    }

    // Count by template
    data.forEach(email => {
      analytics.byTemplate[email.template] = (analytics.byTemplate[email.template] || 0) + 1
    })

    return analytics
  }

  /**
   * Helper: Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Helper: Generate verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
}

// Export singleton instance
export const emailService = new EmailService()