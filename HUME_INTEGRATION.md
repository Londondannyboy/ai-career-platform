# Hume EVI + Quest CLM Integration Guide

## Overview
This guide shows how to configure Hume's Empathic Voice Interface (EVI) to use Quest's Custom Language Model (CLM) endpoint for personalized, context-aware conversations.

## CLM Endpoint
- **URL**: `https://ai-career-platform.vercel.app/api/hume-clm`
- **Format**: OpenAI-compatible chat completions with Server-Sent Events
- **Features**: Real user context, conversation history, emotional awareness

## Configuration Steps

### 1. Hume Dashboard Configuration
In your Hume AI dashboard:

```json
{
  "custom_llm": {
    "endpoint": "https://ai-career-platform.vercel.app/api/hume-clm",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "format": "openai_compatible"
  }
}
```

### 2. Request Format
Hume EVI will send requests in this format:

```json
{
  "messages": [
    {"role": "system", "content": "You are Quest, an AI career coach."},
    {"role": "user", "content": "Hello, what do you know about me?"}
  ],
  "user_id": "user_2cNjk7xDvHPeCKhDLxH0GBMqVzI",
  "custom_session_id": "hume_session_12345",
  "emotional_context": {
    "engagement": 0.8,
    "stress": 0.2,
    "confidence": 0.7
  },
  "metadata": {
    "platform": "hume_evi",
    "version": "1.0"
  }
}
```

### 3. Response Format
The CLM endpoint returns OpenAI-compatible streaming responses:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" Dan"}}]}
data: {"choices":[{"delta":{"content":"!"}}]}
data: [DONE]
```

### 4. User Context Integration
The CLM automatically provides:
- **User Profile**: Name, company, role, experience level
- **Professional Context**: Skills, goals, industry background
- **Conversation History**: Previous interactions and topics
- **Company Data**: Colleagues, organizational context
- **Emotional Context**: Voice-derived emotional state from Hume

## Testing

### Direct CLM Test
```bash
curl -X POST https://ai-career-platform.vercel.app/api/hume-clm \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are Quest"},
      {"role": "user", "content": "What is my name and company?"}
    ],
    "user_id": "user_2cNjk7xDvHPeCKhDLxH0GBMqVzI"
  }'
```

### Expected Response
```
0:"Hello"
0:" Dan"
0:"!"
0:" You"
0:"'re"
0:" Dan"
0:" Keegan"
0:" and"
0:" you"
0:" work"
0:" for"
0:" CKDelta"
```

## User Profile Setup

### 1. Authentication
Users must be authenticated with Clerk to access their profile.

### 2. Profile Creation
Use the profile creation endpoint:
```bash
curl -X POST https://ai-career-platform.vercel.app/api/init-db-simple \
  -H "Content-Type: application/json" \
  -d '{
    "force_user_id": "your_clerk_user_id",
    "user_data": {
      "email": "your.email@company.com",
      "name": "Your Name",
      "company": "Your Company",
      "current_role": "Your Role"
    }
  }'
```

### 3. Profile Verification
Check profile exists:
```bash
curl https://ai-career-platform.vercel.app/api/debug-users
```

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Hume EVI  │───▶│  Quest CLM  │───▶│ PostgreSQL  │
│   (Voice)   │    │  Endpoint   │    │  (Context)  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │   OpenAI    │            │
       └────────────│   GPT-4     │◀───────────┘
                    └─────────────┘
```

## Features Enabled

### ✅ Personalization
- Knows user's name, company, and role
- Adapts responses to experience level
- References past conversations

### ✅ Professional Context
- Company-specific advice
- Industry-relevant guidance
- Career progression insights

### ✅ Emotional Intelligence
- Voice-derived emotional state
- Tone adaptation
- Empathetic responses

### ✅ Conversation Memory
- Maintains context across sessions
- Builds on previous discussions
- Tracks goals and progress

## Troubleshooting

### Common Issues

1. **Generic Responses**
   - Check user profile exists in database
   - Verify user_id is being passed correctly
   - Test CLM endpoint directly

2. **Authentication Errors**
   - Ensure Clerk user is logged in
   - Verify user profile mapping
   - Check API endpoint permissions

3. **Streaming Issues**
   - Verify OpenAI API key is configured
   - Check network connectivity
   - Test with curl directly

### Debug Endpoints

- **User Status**: `/api/debug-users`
- **Profile Creation**: `/api/init-db-simple`
- **User Mapping**: `/api/map-user`

## Next Steps

1. Configure Hume dashboard with CLM endpoint
2. Test voice conversation with user context
3. Add conversation history persistence
4. Implement goal tracking and progress monitoring
5. Integrate with calendar and task management

## Support

For issues with this integration, check:
1. CLM endpoint logs in Vercel
2. Database connectivity to Neon.tech
3. User profile completeness
4. Hume EVI configuration