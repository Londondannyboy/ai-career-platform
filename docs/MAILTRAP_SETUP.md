# Mailtrap Setup Guide for Quest

## Required Configuration

To use the email system, you'll need to provide these environment variables:

### 1. Mailtrap API Token
- Sign up for free at https://mailtrap.io
- Go to **Email API** → **API Tokens**
- Create a new token with **Send** permissions
- Add to `.env.local`:
```env
MAILTRAP_API_TOKEN=your_api_token_here
```

### 2. From Email Configuration
```env
MAILTRAP_FROM_EMAIL=notifications@quest.ai
MAILTRAP_FROM_NAME=Quest AI
MAILTRAP_REPLY_TO=support@quest.ai
```

### 3. Optional: Testing Configuration
For development/testing:
```env
MAILTRAP_INBOX_ID=your_testing_inbox_id
MAILTRAP_ACCOUNT_ID=your_account_id
```

## Setup Steps

### Step 1: Create Mailtrap Account
1. Go to https://mailtrap.io
2. Sign up for free account
3. Verify your email address

### Step 2: Get API Token
1. Navigate to **Email API** section
2. Click **API Tokens**
3. Create new token with these permissions:
   - ✅ Send emails
   - ✅ View sending statistics
4. Copy the token

### Step 3: Configure Environment
Create/update your `.env.local` file:
```env
# Add this to your .env.local file
MAILTRAP_API_TOKEN=ecbb013b26ab505f43e9c5e0b2abc899
MAILTRAP_FROM_EMAIL=notifications@quest.ai
MAILTRAP_FROM_NAME=Quest AI
MAILTRAP_REPLY_TO=support@quest.ai
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Verify Domain (Production)
For production emails:
1. Go to **Email API** → **Domains**
2. Add your domain (e.g., `quest.ai`)
3. Follow DNS verification steps
4. Wait for verification (can take up to 48 hours)

### Step 5: Test Email Sending
Use the API endpoint to test:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send_external_invite",
    "senderName": "Test User",
    "senderCompany": "Test Company",
    "recipientEmail": "test@example.com",
    "recipientName": "Test Recipient"
  }'
```

## Free Tier Limits

Mailtrap free tier includes:
- **1,000 emails/month**
- **5 emails/second** rate limit
- Email analytics and tracking
- Inbox testing

## Email Templates Included

The system includes these notification types:
1. **Connection Requests** - Coach/peer/colleague invitations
2. **Connection Accepted** - "Jon has said yes to be your coach"
3. **Coaching Feedback** - Post-session insights and action items
4. **Job Opportunities** - "We found a job for you"
5. **Goal Milestones** - Achievement notifications
6. **Company Verification** - Email verification codes
7. **External Invites** - Invite friends to join Quest

## Conversational Email Examples

The AI can send emails naturally:

```
User: "Invite Steve Jones as my coach"
AI: "I'll send Steve a coaching invitation. Any message to include?"
User: "I'd love to learn about scaling engineering teams"
AI: "Perfect! I've sent the invitation with your message."
```

```
User: "Jon accepted my coaching request"
AI: "Congratulations! I'll send you both a connection confirmation email with next steps."
```

## Production Considerations

### Domain Setup
- Use your own domain for `FROM` email
- Verify domain ownership with Mailtrap
- Set up SPF, DKIM, and DMARC records

### Rate Limiting
- Free tier: 5 emails/second
- Paid tiers: Higher limits available
- Automatic queuing for bulk sends

### Monitoring
- Check Mailtrap dashboard for delivery rates
- Monitor bounce and complaint rates
- Use webhook endpoints for real-time notifications

## Troubleshooting

### Common Issues

**Emails not sending:**
- Verify API token is correct
- Check environment variables are loaded
- Ensure domain is verified (for production)

**Rate limit errors:**
- Reduce sending frequency
- Implement proper queuing
- Consider upgrading to paid tier

**Template errors:**
- Check all required variables are provided
- Verify template syntax
- Test with simple templates first

### Debug Endpoints

**Test configuration:**
```bash
GET /api/email/test
```

**View recent emails:**
```bash
GET /api/email/logs
```

**Email analytics:**
```bash
GET /api/email/analytics?days=7
```

## Next Steps

1. **Set up your Mailtrap account** with the steps above
2. **Add environment variables** to your `.env.local`
3. **Test email sending** with the API endpoints
4. **Integrate notifications** into your Quest workflows

The email system is ready to use - just add your Mailtrap credentials!