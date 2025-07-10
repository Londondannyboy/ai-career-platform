# Quest Trinity System - Claude Code Integration Guide

## 🤖 For Future Claude Sessions

This streamlined guide helps new Claude sessions understand the Quest Trinity System and continue development efficiently. Additional documentation is organized by topic - load only what you need for your specific task.

## How to Use This Documentation

1. **Start here** (CLAUDE.md) for project context and current state
2. **⚠️ ALWAYS CHECK PITFALLS FIRST** → `QUEST_COMMON_PITFALLS.md` before debugging
3. **Load relevant documentation** based on your task:
   - Trinity work → `QUEST_TRINITY_IMPLEMENTATION_COMPLETE.md`
   - Deep Repo → `QUEST_DEEP_REPO_PRIVACY.md`
   - Debugging → `QUEST_COMMON_PITFALLS.md` (CHECK THIS FIRST!)
   - Voice AI → `QUEST_HUME_EVI_SUCCESS_DOCUMENTATION.md`
4. **Session summaries** contain detailed implementation examples

## Essential Documentation Index

### 🏛️ Core System Documentation
- **`QUEST_MISSION.md`** 🆕 - "LinkedIn shows who you were. Quest shows who you're becoming."
- **`QUEST_TRINITY_PHILOSOPHY.md`** - Trinity system design & three eternal questions
- **`QUEST_DEEP_REPO_PRIVACY.md`** - Four-layer privacy architecture (Surface/Working/Personal/Deep)
- **`QUEST_TRINITY_IMPLEMENTATION_COMPLETE.md`** - Current implementation status & working features
- **`QUEST_DEVELOPMENT_PRINCIPLES.md`** - Code quality standards and guidelines

### 📅 Recent Session Summaries
- **`QUEST_SESSION_SUMMARY_3D_VISUALIZATION_DEEP_REPO.md`** - Latest 3D visualization work
- **`QUEST_SESSION_SENTRY_INTEGRATION.md`** - Recent integration attempts (failed)
- **`QUEST_SESSION_SUMMARY_VOICE_FIRST_COACHING_COMPLETE.md`** - Voice AI implementation

### 🛠️ Technical Guides
- **`QUEST_COMMON_PITFALLS.md`** ⚠️ **CRITICAL** - Common errors and solutions
- **`QUEST_IMPLEMENTATION_HISTORY.md`** - Detailed milestone history
- **`QUEST_HUME_EVI_SUCCESS_DOCUMENTATION.md`** - Voice AI integration guide
- **`QUEST_COLE_MEDIN_COMPLETE_IMPLEMENTATION.md`** - Advanced AI architecture

### 📋 Implementation Modules
- **`QUEST_SPRINT_REPO_UI.md`** 🆕 - Current sprint: 6 chunks of repo UI features
- **`QUEST_FUTURE_ROADMAP.md`** 🆕 - AI intelligence & advanced visualization phases
- **`QUEST_3D_GRAPH_VISUALIZATION_MODULE.md`** - 3D visualization specifications
- **`QUEST_JOB_DISCOVERY_MODULE.md`** - Job matching system (standalone)
- **`QUEST_WEB_INTELLIGENCE_IMPLEMENTATION.md`** - Web search integration

## Project Overview

**Quest Trinity System**: Revolutionary professional networking platform built around three eternal questions that define professional identity, powered by voice AI and advanced visualization.

### The Three Eternal Questions
1. **Quest** - "What drives you?" (Your mission, purpose)
2. **Service** - "How do you serve?" (Your contribution, skills)  
3. **Pledge** - "What do you commit to?" (Your values, accountability)

### Current Status (December 10, 2025)
- ✅ **Trinity System**: Complete and working in production
- ✅ **Voice AI**: Hume EVI integration with personalized coaching
- ✅ **3D Visualization**: Trinity and Surface Repo working with react-force-graph-3d
- ✅ **Deep Repo**: Four-layer privacy architecture implemented
- 🚧 **Current Sprint**: Personal Repo UI - 6 micro-deliveries (see `QUEST_SPRINT_REPO_UI.md`)
- 🔮 **Next Phase**: AI Intelligence Layer for skill clustering & relationships

## Technical Stack

### Core Technologies
- **Next.js 15** - Full-stack React framework (App Router)
- **TypeScript** - Type-safe development
- **PostgreSQL** - Neon.tech with JSONB for flexible schemas
- **Clerk** - Authentication and user management

### AI & Voice
- **Hume AI EVI** - Empathic voice interface
- **OpenAI GPT-4** - Language model for coaching
- **Custom CLM Endpoint** - Server-sent events integration

### Visualization
- **react-force-graph-3d** - 3D graph visualization
- **Three.js/WebGL** - 3D rendering engine
- **Dynamic imports** - Performance optimization

### Advanced Architecture
- **Cole Medin Agentic RAG** - Multi-strategy AI search
- **Neo4j** - Graph database for relationships
- **Linkup.so** - 91% SOTA web intelligence
- **Temporal Knowledge Graph** - Time-aware data

## Key URLs & Endpoints

### User Interfaces
- `/visualization` - Dashboard for all 3D visualizations
- `/visualization/3d/my-trinity` - User's Trinity in 3D
- `/visualization/3d/surface-repo` - LinkedIn-style profile in 3D
- `/repo/edit` - Edit all repo layers (JSON)
- `/repo/surface/edit` - User-friendly Surface Repo editor
- `/trinity/create` - Trinity creation ritual
- `/quest/enhanced` - Voice AI coaching interface

### API Endpoints
- `/api/deep-repo/[layer]` - CRUD for repo layers
- `/api/deep-repo/user` - Authenticated user's Trinity
- `/api/hume-clm-sse/chat/completions` - Voice AI endpoint
- `/api/trinity/create-deep-repo` - Create Trinity in Deep Repo

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...  # Neon PostgreSQL
NEO4J_URI=neo4j+s://...       # Graph database

# Authentication  
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Services
NEXT_PUBLIC_HUME_API_KEY=...
HUME_API_SECRET=...
NEXT_PUBLIC_HUME_CONFIG_ID=...
OPENAI_API_KEY=...

# Web Intelligence
LINKUP_API_KEY=...
SERPER_API_KEY=...
```

See `.env.local` for complete list with working values.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production (MUST PASS)
npm run lint         # Run linter
git push             # Auto-deploy to Vercel
```

## Current Priorities

### Active Sprint: Personal Repo UI (6 Chunks)
1. **Chunk 1**: Surface Repo Work Experience UI with future aspirations
2. **Chunk 2**: Skills & Languages editor components  
3. **Chunk 3**: Education & Certification management
4. **Chunk 4**: Personal Repo OKR management system
5. **Chunk 5**: Goals & Task management
6. **Chunk 6**: Data relationships & navigation

### Key Innovation: Future Experience
- Revolutionary feature: Users can define future career aspirations
- Lives in Personal Repo (private by default) 
- Links to OKRs and Trinity identity
- "Quest shows who you're becoming"

### Known Issues
- Sentry integration not capturing errors (attempted Dec 9)
- Trinity Dashboard auth middleware conflict
- Some TypeScript errors in older components

### Technical Debt
- Consolidate duplicate Trinity data sources
- Improve error handling in voice AI
- Optimize 3D performance for mobile
- Complete TypeScript strict mode migration

## Quick Start for New Sessions

### For Trinity Development
1. Load `QUEST_TRINITY_IMPLEMENTATION_COMPLETE.md`
2. Check `/api/debug/trinity-status` for database health
3. Test at `/trinity/create`

### For Deep Repo Work
1. Load `QUEST_DEEP_REPO_PRIVACY.md`
2. Use `/repo/edit` to modify repo layers
3. View changes at `/visualization/3d/*`

### For Voice AI
1. Load `QUEST_HUME_EVI_SUCCESS_DOCUMENTATION.md`
2. Test at `/quest/enhanced`
3. Debug at `/quest-hume-debug`

### For Debugging
1. **ALWAYS** load `QUEST_COMMON_PITFALLS.md`
2. Check middleware.ts for route access
3. Run `npm run build` to catch TypeScript errors

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  User Interface                  │
│  (Next.js Pages, React Components, Voice UI)    │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│                  API Layer                       │
│    (Next.js API Routes, Server Actions)         │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│               Service Layer                      │
│  (DeepRepoService, TrinityService, AIAgents)   │
└─────────────────────────────────────────────────┘
                         │
┌─────────────────────────────────────────────────┐
│              Data Layer                          │
│   PostgreSQL    Neo4j    Temporal    Vector     │
│    (JSONB)    (Graph)   (Graphiti)  (pgvector) │
└─────────────────────────────────────────────────┘
```

## Repository Structure

```
/src
  /app              # Next.js 15 app router pages
    /api            # API endpoints
    /visualization  # 3D visualization pages
    /trinity        # Trinity system pages
    /quest          # Voice AI coaching
    /admin          # Admin interfaces
  /components       # Reusable React components
  /lib             # Core business logic
    /profile       # Deep Repo services
    /visualization # 3D graph services
    /agents        # AI agent orchestration
  /hooks           # Custom React hooks
/public            # Static assets
```

## Critical Success Factors

1. **Always Check Pitfalls** - Load `QUEST_COMMON_PITFALLS.md` when debugging
2. **Test Builds Locally** - Run `npm run build` before pushing
3. **Add Routes to Middleware** - New routes need public access configuration
4. **Use Correct Database** - PostgreSQL (Neon), not Supabase
5. **Follow Type Safety** - TypeScript errors block deployment

## ⏱️ Common Time-Wasters (Learn from Dec 10, 2025)

### 1. **Over-Engineering Simple Fixes**
- **Problem**: User needed Surface Repo save to work
- **Wrong approach**: Built entire company profile system with 14 new files
- **Right approach**: Fix the specific endpoints causing issues
- **Lesson**: Always solve the immediate problem first

### 2. **Authentication Middleware Issues**
- **Problem**: "Clerk can't detect usage of clerkMiddleware()"
- **Wrong approach**: Multiple attempts to fix middleware syntax
- **Right approach**: Create endpoints that gracefully handle auth failures
- **Better approach**: Check QUEST_COMMON_PITFALLS.md FIRST (it's literally pitfall #1!)

### 3. **Database Confusion**
- **Problem**: Using wrong database patterns
- **Symptoms**: "column domain does not exist"
- **Root cause**: Using Supabase patterns when we use Neon PostgreSQL
- **Fix**: Use `canonical_identifier` not `domain`, use `sql` template literals

### 4. **Not Testing Incrementally**
- **Problem**: Building complex features before basic functionality works
- **Solution**: Create simple test pages first (like `/create-company-test`)
- **Verify**: Each piece works before adding complexity

---

*This streamlined guide provides essential context for Quest Trinity System development. Load additional documentation as needed for specific tasks. All project files use QUEST_ prefix except this file for optimal Claude integration.*

**Last Updated**: December 10, 2025  
**Current Phase**: Deep Repo deployed, building OKR & Career visualizations  
**Documentation**: 49 QUEST_*.md files available - load only what you need