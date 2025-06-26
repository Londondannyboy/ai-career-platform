# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free)
- A LinkedIn Developer account (free)
- An OpenAI API key

## Step 1: Supabase Setup (3 minutes)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (choose any name/region)

### 1.2 Run Database Schema
1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the entire contents of `supabase/schema.sql`
3. Click "Run" to create all tables and policies

### 1.3 Get Your Credentials
1. Go to Settings → API
2. Copy your "Project URL" 
3. Copy your "anon/public" key

## Step 2: Environment Variables (1 minute)

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 3: LinkedIn OAuth Setup (2 minutes)

### 3.1 Create LinkedIn App
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Request "Sign In with LinkedIn using OpenID Connect" permission
4. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 3.2 Configure in Supabase
1. Go to Authentication → Providers in Supabase
2. Enable "LinkedIn (OIDC)"
3. Add your LinkedIn Client ID and Secret
4. Save configuration

## Step 4: Test Your Setup (1 minute)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000`
4. Click "Continue with LinkedIn" to test authentication

## 🎉 You're Ready!

Your AI Career Platform is now fully functional with:
- ✅ LinkedIn authentication
- ✅ User profiles and database
- ✅ Professional UI and navigation
- ✅ Privacy controls ready
- ✅ TypeScript and build system

## Next: Add AI Features

Now you can add the exciting features:
1. Voice recording with Web Audio API
2. OpenAI Whisper integration
3. Career conversation analysis
4. Job search and networking features

## Troubleshooting

### "Invalid URL" errors
- Make sure your Supabase URL starts with `https://` and ends with `.supabase.co`
- Check that your environment variables are correctly set

### LinkedIn login not working
- Verify the redirect URL matches exactly in both LinkedIn app and Supabase
- Make sure the LinkedIn app has "Sign In with LinkedIn using OpenID Connect" permission

### Database errors
- Ensure you ran the complete SQL schema from `supabase/schema.sql`
- Check that RLS policies are enabled in Supabase

Need help? Check the main README.md for detailed documentation.