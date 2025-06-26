# Claude AI Assistant - Project Context

## 🤖 For Future Claude Sessions

This file helps new Claude sessions understand the project state and continue development effectively.

### Project Summary
- **AI Career Platform** - Voice-based career coaching with LinkedIn integration
- **Status**: Fully functional MVP deployed on Vercel
- **Tech Stack**: Next.js 14, TypeScript, Supabase, OpenAI, shadcn/ui

### What's Working Now
✅ LinkedIn OAuth authentication  
✅ Real-time voice coaching with speech recognition  
✅ AI-powered career conversations using GPT-4  
✅ Manual profile enhancement (overcomes LinkedIn API limitations)  
✅ Traditional voice recording → transcription → analysis  
✅ Complete database schema with privacy controls  
✅ Professional UI/UX across all pages  

### Key Files to Understand
- `PROJECT_STATUS.md` - Comprehensive project overview
- `src/app/coach/page.tsx` - Real-time voice coaching
- `src/app/profile/edit/page.tsx` - Manual career data entry
- `supabase/schema.sql` - Complete database schema
- `src/app/auth/callback/route.ts` - LinkedIn OAuth handling

### Development Commands
```bash
npm run dev    # Local development
npm run build  # Test production build
git push       # Auto-deploy to Vercel
```

### Important Context for AI Coaching
- Uses user's LinkedIn data + manually entered career info
- Speech recognition via Web Speech API
- AI responses via OpenAI GPT-4 with conversation context
- All conversations saved to private user repo

### Environment Variables (Vercel)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key  
- `OPENAI_API_KEY` - For voice transcription and AI responses

### User Feedback Integration
The platform was designed based on inspiration from Jack & Jill AI's real-time voice interface approach, focusing on immediate, conversational AI interaction rather than batch processing.

### LinkedIn API Limitations Solved
LinkedIn's API only provides basic profile data (name, email, photo). We solved this by creating a manual profile enhancement system where users can add detailed career information for better AI coaching context.

## 🎯 Ready for Next Features
The foundation is complete. Ready to implement:
- Enhanced networking features
- Voice-powered job search  
- Collaborative coaching tools
- Advanced analytics

## 🚨 Remember
- Always test builds locally before pushing
- Voice features require HTTPS (works on Vercel)
- Check browser console for speech recognition debugging
- All users data is private by default (RLS enabled)

---
*This ensures continuity between Claude sessions and faster development iteration.*