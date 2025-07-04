/**
 * Mailtrap Email Service
 * Handles email sending via Mailtrap API for transactional emails
 */

import { 
  EmailOptions, 
  EmailResult, 
  EmailProvider,
  MailtrapConfig 
} from './types'
import { populateTemplate, populateSubject } from './templates'

export class MailtrapService {
  private config: MailtrapConfig
  private baseUrl = 'https://send.api.mailtrap.io/api/send'

  constructor(config: MailtrapConfig) {
    this.config = config
  }

  /**
   * Send email via Mailtrap API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Prepare recipients
      const to = Array.isArray(options.to) ? options.to : [options.to]
      const cc = options.cc || []
      const bcc = options.bcc || []

      // Get populated content
      const subject = populateSubject(options.template, options.variables)
      const htmlContent = populateTemplate(options.template, options.variables, 'html')
      const textContent = populateTemplate(options.template, options.variables, 'text')

      // Build Mailtrap API payload
      const payload = {
        from: {
          email: process.env.MAILTRAP_FROM_EMAIL || 'quest@notifications.quest.ai',
          name: process.env.MAILTRAP_FROM_NAME || 'Quest AI'
        },
        to: to.map(r => ({
          email: r.email,
          name: r.name
        })),
        cc: cc.length > 0 ? cc.map(r => ({
          email: r.email,
          name: r.name
        })) : undefined,
        bcc: bcc.length > 0 ? bcc.map(r => ({
          email: r.email,
          name: r.name
        })) : undefined,
        subject,
        text: textContent,
        html: htmlContent,
        category: options.category || options.template,
        custom_variables: {
          template: options.template,
          ...options.variables
        },
        headers: {
          'Reply-To': options.replyTo || process.env.MAILTRAP_REPLY_TO || 'support@quest.ai'
        }
      }

      // Send via Mailtrap API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Mailtrap API error: ${response.status} - ${error}`)
      }

      const result = await response.json()

      return {
        success: true,
        messageId: result.message_ids?.[0] || result.message_id,
        provider: 'mailtrap' as EmailProvider
      }

    } catch (error) {
      console.error('Mailtrap send error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'mailtrap' as EmailProvider
      }
    }
  }

  /**
   * Send bulk emails (optimized for multiple recipients)
   */
  async sendBulkEmails(
    emails: EmailOptions[]
  ): Promise<EmailResult[]> {
    // Mailtrap supports bulk sending via their bulk endpoint
    // For now, we'll send individually with rate limiting
    const results: EmailResult[] = []
    
    for (const email of emails) {
      const result = await this.sendEmail(email)
      results.push(result)
      
      // Rate limit: 5 emails per second for free tier
      if (this.config.testing) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    return results
  }

  /**
   * Verify Mailtrap configuration
   */
  async verifyConfiguration(): Promise<boolean> {
    try {
      // Test with a simple API call
      const response = await fetch('https://mailtrap.io/api/v1/inboxes', {
        headers: {
          'Api-Token': this.config.apiToken,
          'Accept': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('Mailtrap verification failed:', error)
      return false
    }
  }
}

/**
 * Factory function to create Mailtrap service
 */
export function createMailtrapService(): MailtrapService {
  const apiToken = process.env.MAILTRAP_API_TOKEN

  if (!apiToken) {
    // During build time, return a dummy service that will fail gracefully
    console.warn('MAILTRAP_API_TOKEN not provided - email service will not work')
    return new MailtrapService({
      apiToken: 'dummy-token',
      testing: true
    })
  }

  const config: MailtrapConfig = {
    apiToken,
    testing: process.env.NODE_ENV !== 'production',
    inboxId: process.env.MAILTRAP_INBOX_ID,
    accountId: process.env.MAILTRAP_ACCOUNT_ID
  }

  return new MailtrapService(config)
}