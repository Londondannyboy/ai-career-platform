/**
 * Email Templates
 * Personalized email templates for Quest platform communications
 */

import { EmailTemplate, EmailTemplateType } from './types'

export const emailTemplates: Record<EmailTemplateType, EmailTemplate> = {
  join_quest: {
    id: 'join_quest',
    name: 'Join Quest Invitation',
    subject: '{{senderName}} invited you to join Quest',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Quest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: #2563eb; margin: 0;">Welcome to Quest</h1>
    <p style="color: #6b7280; margin-top: 10px;">Your AI-powered coaching platform</p>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{recipientName}},</p>
    
    <p><strong>{{senderName}}</strong> from <strong>{{senderCompany}}</strong> has invited you to join Quest, the AI-powered coaching platform that helps professionals reach their full potential.</p>
    
    {{#if personalizedMessage}}
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"{{personalizedMessage}}"</p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">- {{senderName}}</p>
    </div>
    {{/if}}
    
    <h3 style="color: #1f2937; margin-top: 30px;">What is Quest?</h3>
    <ul style="color: #4b5563;">
      <li>AI-powered coaching conversations tailored to your goals</li>
      <li>Connect with coaches and peers at your company</li>
      <li>Personalized development plans and goal tracking</li>
      <li>Voice-enabled coaching sessions for natural interaction</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{joinLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Accept Invitation & Join Quest
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      This invitation expires in 7 days. Questions? Reply to this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
    <p>© 2024 Quest. AI-powered coaching for everyone.</p>
  </div>
</body>
</html>
    `,
    textContent: `
Hi {{recipientName}},

{{senderName}} from {{senderCompany}} has invited you to join Quest, the AI-powered coaching platform.

{{#if personalizedMessage}}
Personal message from {{senderName}}:
"{{personalizedMessage}}"
{{/if}}

What is Quest?
- AI-powered coaching conversations tailored to your goals
- Connect with coaches and peers at your company  
- Personalized development plans and goal tracking
- Voice-enabled coaching sessions for natural interaction

Accept your invitation: {{joinLink}}

This invitation expires in 7 days.

© 2024 Quest. AI-powered coaching for everyone.
    `,
    variables: ['recipientName', 'senderName', 'senderCompany', 'personalizedMessage', 'joinLink']
  },

  coach_request: {
    id: 'coach_request',
    name: 'Coach Connection Request',
    subject: '{{senderName}} would like you to be their coach on Quest',
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #2563eb; margin: 0;">New Coaching Request</h2>
    <p style="color: #6b7280; margin-top: 10px;">Someone wants you as their coach on Quest</p>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{recipientName}},</p>
    
    <p><strong>{{senderName}}</strong>{{#if senderTitle}} ({{senderTitle}}){{/if}} from <strong>{{company}}</strong> would like you to be their coach on Quest.</p>
    
    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">About {{senderName}}:</h4>
      <p style="margin: 5px 0; color: #4b5563;">
        <strong>Current Focus:</strong> {{focusAreas}}<br>
        <strong>Goals:</strong> {{goals}}
      </p>
    </div>
    
    {{#if personalizedMessage}}
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"{{personalizedMessage}}"</p>
    </div>
    {{/if}}
    
    <p>As their coach, you'll:</p>
    <ul style="color: #4b5563;">
      <li>Provide guidance through AI-enhanced coaching sessions</li>
      <li>Help them achieve their professional goals</li>
      <li>Share your expertise and experience</li>
      <li>Build a meaningful mentoring relationship</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{acceptLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin-right: 10px;">
        Accept Request
      </a>
      <a href="{{viewProfileLink}}" style="background-color: #e5e7eb; color: #374151; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        View Profile
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; text-align: center;">
      This request expires in 14 days.
    </p>
  </div>
</body>
</html>
    `,
    textContent: `
Hi {{recipientName}},

{{senderName}}{{#if senderTitle}} ({{senderTitle}}){{/if}} from {{company}} would like you to be their coach on Quest.

About {{senderName}}:
- Current Focus: {{focusAreas}}
- Goals: {{goals}}

{{#if personalizedMessage}}
Personal message:
"{{personalizedMessage}}"
{{/if}}

As their coach, you'll:
- Provide guidance through AI-enhanced coaching sessions
- Help them achieve their professional goals
- Share your expertise and experience
- Build a meaningful mentoring relationship

Accept Request: {{acceptLink}}
View Profile: {{viewProfileLink}}

This request expires in 14 days.
    `,
    variables: ['recipientName', 'senderName', 'senderTitle', 'company', 'focusAreas', 'goals', 'personalizedMessage', 'acceptLink', 'viewProfileLink']
  },

  peer_request: {
    id: 'peer_request',
    name: 'Peer Connection Request',
    subject: '{{senderName}} wants to connect as peers on Quest',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #10b981; margin: 0;">Peer Connection Request</h2>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{recipientName}},</p>
    
    <p><strong>{{senderName}}</strong> from {{company}} wants to connect with you as a peer for mutual support and growth.</p>
    
    {{#if personalizedMessage}}
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"{{personalizedMessage}}"</p>
    </div>
    {{/if}}
    
    <p><strong>Common interests:</strong> {{commonInterests}}</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{acceptLink}}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Accept Connection
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Hi {{recipientName}},

{{senderName}} from {{company}} wants to connect with you as a peer for mutual support and growth.

{{#if personalizedMessage}}
"{{personalizedMessage}}"
{{/if}}

Common interests: {{commonInterests}}

Accept Connection: {{acceptLink}}
    `,
    variables: ['recipientName', 'senderName', 'company', 'personalizedMessage', 'commonInterests', 'acceptLink']
  },

  colleague_connect: {
    id: 'colleague_connect',
    name: 'Colleague Connection',
    subject: '{{senderName}} added you as a colleague on Quest',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{recipientName}},</p>
    
    <p><strong>{{senderName}}</strong> has added you as a colleague on Quest at <strong>{{company}}</strong>.</p>
    
    <p>You're now connected and can:</p>
    <ul>
      <li>Share coaching insights</li>
      <li>Collaborate on professional development</li>
      <li>Support each other's growth</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{viewConnectionLink}}" style="background-color: #6b7280; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
        View Connection
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Hi {{recipientName}},

{{senderName}} has added you as a colleague on Quest at {{company}}.

You're now connected and can:
- Share coaching insights
- Collaborate on professional development
- Support each other's growth

View Connection: {{viewConnectionLink}}
    `,
    variables: ['recipientName', 'senderName', 'company', 'viewConnectionLink']
  },

  verification: {
    id: 'verification',
    name: 'Company Verification',
    subject: 'Verify your {{company}} email for Quest',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937; text-align: center;">Verify Your Company Email</h2>
    
    <p>Hi {{userName}},</p>
    
    <p>To connect with colleagues at <strong>{{company}}</strong> and access company-specific features, please verify your email address.</p>
    
    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 25px; margin: 25px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #6b7280;">Your verification code is:</p>
      <h1 style="margin: 0; color: #2563eb; font-size: 36px; letter-spacing: 4px;">{{verificationCode}}</h1>
    </div>
    
    <p>Enter this code in Quest to verify your {{company}} connection.</p>
    
    <p style="color: #6b7280; font-size: 14px;">This code expires in 1 hour. If you didn't request this verification, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `,
    textContent: `
Verify Your Company Email

Hi {{userName}},

To connect with colleagues at {{company}} and access company-specific features, please verify your email address.

Your verification code is: {{verificationCode}}

Enter this code in Quest to verify your {{company}} connection.

This code expires in 1 hour.
    `,
    variables: ['userName', 'company', 'verificationCode']
  },

  welcome: {
    id: 'welcome',
    name: 'Welcome to Quest',
    subject: 'Welcome to Quest - Your AI coaching journey begins',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: #2563eb; margin: 0;">Welcome to Quest!</h1>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{userName}},</p>
    
    <p>Welcome to Quest! We're excited to be part of your professional development journey.</p>
    
    <h3>Here's how to get started:</h3>
    
    <div style="margin: 20px 0;">
      <div style="display: flex; align-items: start; margin-bottom: 15px;">
        <div style="background-color: #2563eb; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">1</div>
        <div>
          <strong>Start your first coaching session</strong><br>
          <span style="color: #6b7280;">Have a conversation with our AI coaches about your goals</span>
        </div>
      </div>
      
      <div style="display: flex; align-items: start; margin-bottom: 15px;">
        <div style="background-color: #2563eb; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">2</div>
        <div>
          <strong>Set your coaching preferences</strong><br>
          <span style="color: #6b7280;">Choose your focus areas and coaching style</span>
        </div>
      </div>
      
      <div style="display: flex; align-items: start;">
        <div style="background-color: #2563eb; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">3</div>
        <div>
          <strong>Connect with colleagues</strong><br>
          <span style="color: #6b7280;">Find coaches and peers at {{company}}</span>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{startLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Start Your First Session
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Welcome to Quest!

Hi {{userName}},

Welcome to Quest! We're excited to be part of your professional development journey.

Here's how to get started:

1. Start your first coaching session
   Have a conversation with our AI coaches about your goals

2. Set your coaching preferences
   Choose your focus areas and coaching style

3. Connect with colleagues
   Find coaches and peers at {{company}}

Start Your First Session: {{startLink}}
    `,
    variables: ['userName', 'company', 'startLink']
  },

  connection_accepted: {
    id: 'connection_accepted',
    name: 'Connection Request Accepted',
    subject: '{{recipientName}} accepted your {{connectionType}} request',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: #10b981; margin: 0;">Connection Accepted!</h1>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{senderName}},</p>
    
    <p>Great news! <strong>{{recipientName}}</strong> has accepted your {{connectionType}} request.</p>
    
    {{#if responseMessage}}
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-style: italic;">"{{responseMessage}}"</p>
      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">- {{recipientName}}</p>
    </div>
    {{/if}}
    
    <p>You can now:</p>
    <ul style="color: #4b5563;">
      <li>Start coaching conversations</li>
      <li>Share insights and resources</li>
      <li>Collaborate on professional development</li>
      <li>Schedule coaching sessions</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{startConversationLink}}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Start Conversation
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Hi {{senderName}},

Great news! {{recipientName}} has accepted your {{connectionType}} request.

{{#if responseMessage}}
Response from {{recipientName}}:
"{{responseMessage}}"
{{/if}}

You can now:
- Start coaching conversations
- Share insights and resources
- Collaborate on professional development
- Schedule coaching sessions

Start Conversation: {{startConversationLink}}
    `,
    variables: ['senderName', 'recipientName', 'connectionType', 'responseMessage', 'startConversationLink']
  },

  coaching_feedback: {
    id: 'coaching_feedback',
    name: 'Coaching Session Feedback',
    subject: 'Your coaching session feedback - {{sessionDate}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937;">Your Coaching Session Insights</h2>
    
    <p>Hi {{userName}},</p>
    
    <p>Here's a summary of your coaching session on {{sessionDate}}:</p>
    
    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Key Insights:</h4>
      <ul style="margin: 0; color: #4b5563;">
        {{#each insights}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Action Items:</h4>
      <ul style="margin: 0; color: #4b5563;">
        {{#each actionItems}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    {{#if nextSteps}}
    <p><strong>Recommended next steps:</strong> {{nextSteps}}</p>
    {{/if}}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{continueCoachingLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Continue Coaching
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Your Coaching Session Insights

Hi {{userName}},

Here's a summary of your coaching session on {{sessionDate}}:

Key Insights:
{{#each insights}}
- {{this}}
{{/each}}

Action Items:
{{#each actionItems}}
- {{this}}
{{/each}}

{{#if nextSteps}}
Recommended next steps: {{nextSteps}}
{{/if}}

Continue Coaching: {{continueCoachingLink}}
    `,
    variables: ['userName', 'sessionDate', 'insights', 'actionItems', 'nextSteps', 'continueCoachingLink']
  },

  job_opportunity: {
    id: 'job_opportunity',
    name: 'Job Opportunity',
    subject: 'Job opportunity that matches your goals: {{jobTitle}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #fef3c7; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: #d97706; margin: 0;">New Job Opportunity</h1>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{userName}},</p>
    
    <p>I found a job opportunity that aligns with your career goals:</p>
    
    <div style="border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">{{jobTitle}}</h3>
      <p style="margin: 5px 0; color: #6b7280;"><strong>Company:</strong> {{company}}</p>
      <p style="margin: 5px 0; color: #6b7280;"><strong>Location:</strong> {{location}}</p>
      <p style="margin: 5px 0; color: #6b7280;"><strong>Salary:</strong> {{salary}}</p>
    </div>
    
    <p><strong>Why this matches your profile:</strong></p>
    <ul style="color: #4b5563;">
      {{#each matchReasons}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    
    {{#if description}}
    <p>{{description}}</p>
    {{/if}}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{applyLink}}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; margin-right: 10px;">
        View Job Details
      </a>
      <a href="{{coachingLink}}" style="background-color: #e5e7eb; color: #374151; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Discuss with Coach
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
New Job Opportunity

Hi {{userName}},

I found a job opportunity that aligns with your career goals:

{{jobTitle}} at {{company}}
Location: {{location}}
Salary: {{salary}}

Why this matches your profile:
{{#each matchReasons}}
- {{this}}
{{/each}}

{{#if description}}
{{description}}
{{/if}}

View Job Details: {{applyLink}}
Discuss with Coach: {{coachingLink}}
    `,
    variables: ['userName', 'jobTitle', 'company', 'location', 'salary', 'matchReasons', 'description', 'applyLink', 'coachingLink']
  },

  goal_milestone: {
    id: 'goal_milestone',
    name: 'Goal Milestone Achievement',
    subject: 'Congratulations! You achieved: {{milestoneTitle}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f0fdf4; border-radius: 8px; padding: 30px; margin-bottom: 20px; text-align: center;">
    <h1 style="color: #10b981; margin: 0;">🎉 Milestone Achieved!</h1>
  </div>
  
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <p>Hi {{userName}},</p>
    
    <p>Congratulations! You've achieved an important milestone:</p>
    
    <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <h3 style="margin: 0; color: #065f46;">{{milestoneTitle}}</h3>
      <p style="margin: 10px 0 0 0; color: #6b7280;">{{milestoneDescription}}</p>
    </div>
    
    <p><strong>Your progress:</strong></p>
    <ul style="color: #4b5563;">
      {{#each progressPoints}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    
    {{#if nextGoal}}
    <p><strong>Next goal:</strong> {{nextGoal}}</p>
    {{/if}}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{viewProgressLink}}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        View Full Progress
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
🎉 Milestone Achieved!

Hi {{userName}},

Congratulations! You've achieved an important milestone:

{{milestoneTitle}}
{{milestoneDescription}}

Your progress:
{{#each progressPoints}}
- {{this}}
{{/each}}

{{#if nextGoal}}
Next goal: {{nextGoal}}
{{/if}}

View Full Progress: {{viewProgressLink}}
    `,
    variables: ['userName', 'milestoneTitle', 'milestoneDescription', 'progressPoints', 'nextGoal', 'viewProgressLink']
  },

  session_reminder: {
    id: 'session_reminder',
    name: 'Session Reminder',
    subject: 'Your coaching session with {{coachName}} starts in {{timeUntil}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937;">Coaching Session Reminder</h2>
    
    <p>Hi {{userName}},</p>
    
    <p>Your coaching session with <strong>{{coachName}}</strong> starts in <strong>{{timeUntil}}</strong>.</p>
    
    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Time:</strong> {{sessionTime}}</p>
      <p style="margin: 5px 0;"><strong>Topic:</strong> {{sessionTopic}}</p>
      <p style="margin: 5px 0;"><strong>Duration:</strong> {{duration}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{joinSessionLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Join Session
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Coaching Session Reminder

Hi {{userName}},

Your coaching session with {{coachName}} starts in {{timeUntil}}.

Time: {{sessionTime}}
Topic: {{sessionTopic}}
Duration: {{duration}}

Join Session: {{joinSessionLink}}
    `,
    variables: ['userName', 'coachName', 'timeUntil', 'sessionTime', 'sessionTopic', 'duration', 'joinSessionLink']
  },

  weekly_progress: {
    id: 'weekly_progress',
    name: 'Weekly Progress Summary',
    subject: 'Your weekly coaching progress - {{weekEnding}}',
    htmlContent: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937;">Your Weekly Progress</h2>
    
    <p>Hi {{userName}},</p>
    
    <p>Here's your coaching progress for the week ending {{weekEnding}}:</p>
    
    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">This Week's Achievements:</h4>
      <ul style="margin: 0; color: #4b5563;">
        {{#each achievements}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    <div style="background-color: #eff6ff; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Sessions Completed:</h4>
      <p style="margin: 0; color: #4b5563;">{{sessionsCount}} coaching conversations</p>
    </div>
    
    <div style="background-color: #f0fdf4; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Next Week's Focus:</h4>
      <ul style="margin: 0; color: #4b5563;">
        {{#each nextWeekGoals}}
        <li>{{this}}</li>
        {{/each}}
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{continueJourneyLink}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
        Continue Your Journey
      </a>
    </div>
  </div>
</body>
</html>
    `,
    textContent: `
Your Weekly Progress

Hi {{userName}},

Here's your coaching progress for the week ending {{weekEnding}}:

This Week's Achievements:
{{#each achievements}}
- {{this}}
{{/each}}

Sessions Completed: {{sessionsCount}} coaching conversations

Next Week's Focus:
{{#each nextWeekGoals}}
- {{this}}
{{/each}}

Continue Your Journey: {{continueJourneyLink}}
    `,
    variables: ['userName', 'weekEnding', 'achievements', 'sessionsCount', 'nextWeekGoals', 'continueJourneyLink']
  }
}

/**
 * Get a populated email template
 */
export function populateTemplate(
  templateType: EmailTemplateType,
  variables: Record<string, any>,
  format: 'html' | 'text' = 'html'
): string {
  const template = emailTemplates[templateType]
  if (!template) {
    throw new Error(`Template ${templateType} not found`)
  }

  let content = format === 'html' ? template.htmlContent : template.textContent

  // Simple variable replacement
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    content = content.replace(regex, value || '')
  })

  // Handle conditional blocks (simple implementation)
  content = content.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, block) => {
    return variables[varName] ? block : ''
  })

  return content
}

/**
 * Get template subject with variables replaced
 */
export function populateSubject(
  templateType: EmailTemplateType,
  variables: Record<string, any>
): string {
  const template = emailTemplates[templateType]
  if (!template) {
    throw new Error(`Template ${templateType} not found`)
  }

  let subject = template.subject
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(regex, value || '')
  })

  return subject
}