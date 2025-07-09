# Quest Vercel Integrations Guide

## 🎯 Sentry Integration Status

### What We've Done:
1. ✅ Added Sentry integration via Vercel Marketplace
2. ✅ Environment variables automatically configured:
   - `NEXT_PUBLIC_SENTRY_DSN`
   - `SENTRY_ORG`
   - `SENTRY_PROJECT`
   - `SENTRY_AUTH_TOKEN`
3. ✅ Installed @sentry/nextjs package
4. ✅ Created configuration files:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
   - `instrumentation.ts` (in root directory)
5. ✅ Updated `next.config.ts` with Sentry wrapper

### Test URLs (After Deployment):
- `https://ai-career-platform.vercel.app/sentry-test.html` - Auto-triggers error after 2 seconds
- `https://ai-career-platform.vercel.app/sentry-example-page` - Interactive error buttons
- `https://ai-career-platform.vercel.app/api/sentry-force-error` - API route that explicitly captures error

### Where to Check Errors:

1. **Sentry Dashboard**:
   - Go to [sentry.io](https://sentry.io)
   - Navigate to the `quest` project
   - Check Issues tab for captured errors

2. **Vercel Dashboard**:
   - Since Sentry is integrated with Vercel, errors should also appear in:
   - Vercel Project → Functions tab → Runtime Logs
   - Vercel Project → Monitoring → Error tracking

3. **GitHub Integration**:
   - Sentry can create GitHub issues for errors
   - Check if this is enabled in Sentry project settings

## 🚀 Other Vercel Marketplace Integrations to Consider

Based on our session, these would be valuable additions:

### 1. **PostHog** - Product Analytics
- User behavior tracking
- Feature flags
- A/B testing
- Session recordings
- Perfect for tracking Trinity creation flow

### 2. **LangSmith** - LLM Monitoring
- Track AI agent performance
- Monitor token usage
- Debug prompt chains
- Essential for our multi-agent coaching system

### 3. **Checkly** - Synthetic Monitoring
- API endpoint monitoring
- Browser checks for critical user flows
- Would catch issues like our Trinity dashboard 404s

### 4. **Axiom** - Log Management
- Structured logging
- Real-time log search
- Better than console.log debugging

### 5. **Neon** - Already Using!
- Our PostgreSQL database
- Could integrate deeper with Vercel

## 📋 Integration Strategy

### Phase 1: Error Tracking (Current)
- ✅ Sentry for error capture
- 🔄 Verify it's working in production

### Phase 2: Analytics (Next)
- PostHog for user behavior
- Understand Trinity creation patterns
- Track feature adoption

### Phase 3: AI Monitoring
- LangSmith for LLM observability
- Critical for voice AI and multi-agent systems

### Phase 4: Synthetic Monitoring
- Checkly for uptime monitoring
- Ensure critical endpoints stay healthy

## 🔍 Debugging Sentry

If Sentry isn't capturing errors:

1. **Check Browser Console**:
   ```javascript
   // Should see Sentry object
   console.log(window.Sentry)
   ```

2. **Check Network Tab**:
   - Look for requests to `ingest.sentry.io`
   - Should see error payloads being sent

3. **Verify DSN**:
   - Ensure `NEXT_PUBLIC_SENTRY_DSN` matches your Sentry project

4. **Test Manually**:
   ```javascript
   // In browser console
   Sentry.captureMessage('Test from browser console')
   ```

## 💡 Key Learnings

1. **Use Vercel Marketplace First** - Native integrations save hours of setup
2. **Environment Variables** - Automatically configured with marketplace integrations
3. **Production First** - Some integrations work better in production (HTTPS required)
4. **Check Multiple Places** - Errors might appear in Sentry, Vercel, or both

---

*Last Updated: December 10, 2025*