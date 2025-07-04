# Quest Email Management System

## Overview

The Quest email system provides both transactional email capabilities (via Mailtrap SMTP) and conversational email generation (via Mailtrap MCP). This dual approach enables automated system emails and natural language email creation through the AI coaching interface.

## Architecture

### 1. Email Service Core (`/src/lib/email/`)
- **service.ts** - Main email service handling all email operations
- **mailtrap-service.ts** - Mailtrap API integration
- **mcp-integration.ts** - Natural language email processing
- **templates.ts** - Email templates with personalization
- **types.ts** - TypeScript type definitions

### 2. Database Schema
- **connection_invites** - Tracks all connection invitations
- **company_verifications** - Manages company email verification
- **email_logs** - Comprehensive email analytics
- **user_connections** - Established connections between users

### 3. API Endpoints
- `/api/email/send` - Direct email sending
- `/api/email/mcp` - Conversational email requests

## Features

### Self-Declaration Company System
- Users declare company affiliation during registration
- No verification required for basic features
- Tagged as `unverified` in company graph
- Immediate access to Quest coaching

### Optional Verification Flow
```typescript
// Conversational trigger
Agent: "To connect with verified colleagues at CK Delta, would you like to verify your company email?"
User: "Yes"
Agent: "What's your work email?"
User: "phil@ckdelta.com"
Agent: "Sending verification code now..."
```

### Connection Types
1. **Coach** - Formal coaching relationship
2. **Peer** - Mutual support and accountability
3. **Colleague** - General workplace connection
4. **Mentor** - Senior guidance relationship

### Email Templates
- **join_quest** - External user invitation
- **coach_request** - Coaching connection request
- **peer_request** - Peer connection invitation
- **colleague_connect** - Colleague connection notification
- **verification** - Company email verification
- **welcome** - New user onboarding

## Usage Examples

### 1. Conversational Email Sending
```javascript
// In AI conversation
User: "Invite Steve Jones as my coach"
Agent: [Processes via MCP] "I'll send Steve a coaching invitation. Any message to include?"
User: "I'd love to learn about scaling engineering teams"
Agent: "Perfect! I've sent the invitation with your message."
```

### 2. Direct API Usage
```javascript
// Send connection invite
const result = await emailService.sendConnectionInvite({
  senderId: userId,
  senderName: "Phil Smith",
  senderCompany: "CK Delta",
  recipientEmail: "steve@ckdelta.com",
  recipientName: "Steve Jones",
  connectionType: "coach",
  personalizedMessage: "I'd love to learn about scaling teams"
})
```

### 3. Company Verification
```javascript
// Send verification email
await emailService.sendVerificationEmail(
  userId,
  userName,
  "CK Delta",
  "phil@ckdelta.com"
)

// Verify code
const result = await emailService.verifyCompanyEmail(userId, "123456")
```

## Configuration

### Environment Variables
```env
# Mailtrap Configuration
MAILTRAP_API_TOKEN=your_api_token
MAILTRAP_FROM_EMAIL=notifications@quest.ai
MAILTRAP_FROM_NAME=Quest AI
MAILTRAP_REPLY_TO=support@quest.ai
MAILTRAP_INBOX_ID=your_inbox_id
MAILTRAP_ACCOUNT_ID=your_account_id
```

### Database Setup
Run the schema SQL in Supabase:
```sql
-- See /src/lib/email/schema.sql
```

## Natural Language Patterns

The MCP integration recognizes these patterns:

### Connection Invites
- "Send Steve Jones a coach invitation"
- "Invite sarah@example.com as my peer"
- "Connect with Mike as a colleague"

### Verification
- "Verify my company email"
- "Send verification to my work address"
- "Confirm my CK Delta connection"

### External Invites
- "Invite john@external.com to Quest"
- "Send an invitation to my friend Sarah"

## Analytics & Tracking

### Email Metrics
- Sent, delivered, opened, clicked rates
- Template performance analysis
- Failed delivery tracking

### Connection Metrics
- Invitation acceptance rates
- Time to first connection
- Connection type distribution

## Security & Privacy

### Data Protection
- Personal emails remain primary login
- Company emails used only for verification
- All connections require mutual consent
- Users can decline/block invitations

### Rate Limiting
- 5 emails/second for free tier
- Bulk sending queued appropriately
- Verification codes expire in 1 hour

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic email infrastructure
- ✅ Template system
- ✅ MCP integration
- 🚧 Company self-declaration
- 🚧 Connection management

### Phase 2
- [ ] Advanced analytics dashboard
- [ ] A/B testing for templates
- [ ] Smart invitation timing
- [ ] Connection recommendations

### Phase 3
- [ ] Enterprise SSO integration
- [ ] Bulk invitation management
- [ ] Custom email domains
- [ ] Advanced security features

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Mailtrap API token
   - Verify environment variables
   - Check email logs for errors

2. **Verification codes not working**
   - Ensure code hasn't expired (1 hour)
   - Check user has pending verification
   - Verify correct email address

3. **MCP parsing errors**
   - Ensure clear email addresses in request
   - Use supported action keywords
   - Check conversation context

### Debug Endpoints
- `/api/email/test` - Test email configuration
- `/api/email/logs` - View recent email activity
- `/api/email/analytics` - Email performance metrics