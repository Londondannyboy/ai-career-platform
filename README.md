# AI Career Platform

A comprehensive AI-powered career platform combining job search, professional networking, and AI career coaching through voice interactions. Users authenticate via LinkedIn, can network with other professionals, and build rich career profiles through conversational AI.

## 🚀 Features

### Core Features
- **LinkedIn OAuth Authentication** - Secure login with LinkedIn integration
- **Career Repository (Repo)** - Voice-based career conversations with AI analysis
- **Professional Networking** - LinkedIn-style connections and networking
- **AI Career Coaching** - Collaborative coaching with privacy controls
- **Voice-Powered Job Search** - Natural language job discovery

### Privacy & Security
- **Granular Privacy Controls** - Control who sees what career information
- **Row Level Security** - Database-level privacy protection with Supabase RLS
- **Encrypted Audio Storage** - Secure storage of voice recordings
- **Access Request System** - Professional request workflow for repo sharing

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **AI**: OpenAI Whisper API for transcription, GPT-4 for analysis
- **Authentication**: Supabase Auth with LinkedIn OAuth
- **Deployment**: Vercel (recommended)

## 📋 Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase account
- A LinkedIn Developer App
- An OpenAI API key

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from the project settings
3. In the Supabase SQL editor, run the schema from `supabase/schema.sql`
4. Enable LinkedIn OAuth in Authentication > Providers
   - Add your LinkedIn Client ID and Secret
   - Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 3. LinkedIn OAuth Setup

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app and request access to "Sign In with LinkedIn using OpenID Connect"
3. Add these redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)
4. Copy your Client ID and Client Secret

### 4. Environment Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # LinkedIn OAuth (configured in Supabase)
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   ```

### 5. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

**Note**: The build requires valid Supabase credentials. For development, just run `npm run dev` which works with the placeholder credentials. For production builds, ensure your environment variables are properly set.

## 🏗 Project Structure

```
ai-career-platform/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages
│   │   ├── login/             # Login page
│   │   └── page.tsx           # Dashboard
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   └── Navigation.tsx     # Main navigation
│   ├── lib/                   # Utilities and configurations
│   │   ├── supabase/          # Supabase client configurations
│   │   └── auth.ts            # Authentication utilities
│   └── types/                 # TypeScript type definitions
├── supabase/
│   └── schema.sql             # Database schema
├── middleware.ts              # Next.js middleware for auth
└── package.json
```

## 🎯 Core Concepts

### Repo System
The "Repo" is the heart of the platform - a private career conversation vault where users:
- Record voice conversations about their career journey
- Get AI analysis of their experiences, skills, and goals
- Can selectively share with trusted connections for coaching
- Build a rich, searchable career timeline

### Privacy-First Networking
- All career conversations are private by default
- Users explicitly grant access to specific people
- Granular permissions (view-only, coaching, full access)
- Professional access request workflow

### AI-Powered Features
- Voice-to-text transcription with Whisper API
- Career pattern analysis and insights
- Job matching based on deep career understanding
- Coaching recommendations and guidance

## 🔄 Next Steps

The foundation is complete! Here's what to do:

### Immediate Setup (5 minutes)
1. **Add your Supabase credentials** to `.env.local`
2. **Run the SQL schema** in your Supabase dashboard
3. **Configure LinkedIn OAuth** in Supabase Auth settings
4. **Test the authentication flow**

### Then Build These Features
1. **Repo Recording Interface** - Voice recording with Web Audio API
2. **OpenAI Integration** - Whisper transcription and GPT-4 analysis
3. **User Search & Connections** - Professional networking features
4. **Job Search Integration** - Voice-powered job discovery
5. **Coaching Tools** - Collaborative career development features

## 🚨 Important Notes

- **All authentication is ready** - just needs your credentials
- **Database schema is complete** - ready to run in Supabase
- **UI is fully functional** - professional and responsive
- **TypeScript is configured** - type-safe development

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Update Supabase redirect URLs to include your Vercel domain
4. Deploy!

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ using Next.js, Supabase, and OpenAI