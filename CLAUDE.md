# Claude AI Assistant - AI Business Partner Platform

## 🤖 For Future Claude Sessions

This file helps new Claude sessions understand the enhanced project state and continue development with the advanced architecture.

## Project Overview: AI Business Partner Platform

**Vision:** Comprehensive AI-powered business intelligence platform that provides deep company insights, professional network analysis, and career development through advanced knowledge graphs and empathic voice AI.

**Current Status:** MVP with Hume AI voice coaching, ready for Phase 0 enhancements and hybrid database architecture

## Enhanced Technology Stack (Updated 2024)

### Core Architecture: Hybrid Database Strategy
```typescript
// Three-tier database approach for optimal risk/innovation balance
Supabase (Primary) → Core app data, auth, real-time features
Neon PostgreSQL (Vector) → Semantic search, AI analytics, pgvector
Neo4j + Graphiti (Graph) → Temporal relationships, career networks
RushDB (Interface) → Simplified graph operations, 3D visualization
```

### Frontend & AI Integration (Enhanced)
- **Next.js 15** - Full-stack framework with App Router
- **Vercel AI SDK** - Native streaming AI interactions (CRITICAL: fixes current coaching issues)
- **Hume AI EVI** - Empathic voice interface with enhanced SDKs:
  - **Hume React SDK** - Simplified voice components (replaces manual WebSocket)
  - **Hume TypeScript SDK** - Type-safe API interactions
  - **Hume MCP Server** - Enhanced Claude Code development integration
- **Clerk** - Authentication and user management
- **Tailwind CSS** - Styling and design system

### Data Visualization (Major Competitive Advantage)
- **react-force-graph** - Custom 3D interactive career network visualization
- **RushDB Dashboard** - Built-in 3D graph visualization for sales demos
- **D3.js** - Custom business intelligence dashboards
- **Three.js/WebGL** - Advanced 3D rendering and VR/AR capabilities

### Data Intelligence Pipeline
- **Repository Analysis** - GitHub integration for codebase insights and technical debt
- **Human Data Ingestion** - Google Drive, document upload, manual forms, Slack/Teams
- **Market Intelligence** - Real-time industry trends and salary data
- **Relationship Mapping** - Automatic detection of professional connections

## Development Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Test production build (MUST PASS before deployment)
npm run lint         # Run ESLint (must be clean)
npm run start        # Start production server
git push             # Auto-deploy to Vercel
```

## Current Project Structure

### Key Files & Components
- **`src/app/quest/page.tsx`** - Main voice coaching interface (Hume AI integration)
- **`src/hooks/useHumeEVI.ts`** - Hume AI voice interface hook (NEEDS SDK MIGRATION)
- **`src/app/layout.tsx`** - Root layout with Clerk authentication
- **`AI_BUSINESS_PARTNER_PLATFORM_PRD.md`** - Complete product requirements document (40+ pages)

### Current Database Schema (Supabase - Primary)
```sql
-- Core application tables (working)
users (id, email, created_at, subscription_tier, preferences)
user_profiles (user_id, linkedin_data, manual_profile_data, privacy_settings)
conversations (id, user_id, transcript, ai_responses, session_metadata)
coaching_sessions (id, user_id, duration, insights, follow_up_actions)
repositories (id, user_id, github_url, analysis_status, last_analyzed)
```

### Future Database Extensions
```sql
-- Neon PostgreSQL (Vector Intelligence)
user_embeddings (user_id, profile_vector, skills_vector, goals_vector)
company_embeddings (company_id, description_vector, culture_vector)
repository_analysis (repo_id, code_vectors, technical_debt_scores)

-- Neo4j + Graphiti (Relationship Intelligence)
(User)-[:WORKS_AT {from, to, role, performance}]->(Company)
(User)-[:COLLABORATED_WITH {project, commits, impact}]->(User)
(User)-[:SKILLED_IN {proficiency, years_experience}]->(Technology)
```

## ✅ Phase 0 Complete - Voice Integration Working! (MILESTONE ACHIEVED)

### Issues Successfully Resolved
1. **✅ Hume AI Integration Fixed** - Coaching feature now working with official @humeai/voice-react SDK
2. **✅ Streaming Support Added** - Vercel AI SDK properly handles real-time AI interactions
3. **✅ Official SDK Implementation** - Replaced manual WebSocket with native Hume React SDK

### Implementation Completed
1. **✅ Hume React SDK Integrated** - Official @humeai/voice-react SDK replacing manual WebSocket
2. **✅ Vercel AI SDK Configured** - Streaming and real-time interactions working
3. **✅ TypeScript Integration** - Type-safe voice interactions with proper error handling
4. **✅ End-to-end Testing** - Voice coaching fully operational and tested
5. **✅ Implementation Documented** - See `VOICE_INTEGRATION_MODULE.md` for reusable patterns

### Success Criteria Achieved
- ✅ Coaching feature fully operational with reliable voice interaction (Version 4.0.0)
- ✅ Vercel AI SDK streaming working for real-time conversations
- ✅ Error-free voice sessions with proper audio handling
- ✅ Modular implementation ready for reuse across applications
- ✅ Complete documentation of working patterns

**📖 Implementation Details**: See `VOICE_INTEGRATION_MODULE.md` for the complete reusable pattern documentation.

## ✅ Phase 1 Complete - 3D Graph Visualization Module! (NEW MILESTONE)

### 3D Graph Database Visualization System
**Status**: ✅ Production Ready & Modular (December 2024)
**Live Demo**: https://ai-career-platform.vercel.app/graph-test

### Breakthrough Achievement
- **✅ Neo4j + RushDB Integration** - Hybrid graph database architecture working flawlessly
- **✅ Interactive 3D Visualization** - react-force-graph-3d with organizational network mapping
- **✅ Error-Free Data Handling** - Resolved "o.map is not a function" RushDB SDK issues
- **✅ Graceful Fallback System** - Works with single database or fallback test data
- **✅ Production Deployment** - Hardcoded credentials for testing, environment-ready for production

### Technical Implementation
```typescript
// Core Architecture - Hybrid Database Strategy (WORKING)
Neo4j (Primary) → Relationship mapping, Cypher queries, ACID transactions
RushDB (Interface) → 3D visualization, simplified graph operations, built-in UI
Fallback System → Embedded test data when databases unavailable
```

### Key Components (Reusable Module)
- **`src/lib/graph/`** - Complete graph database service layer
  - `neo4j.ts` - Neo4j AuraDB integration with connection management
  - `rushdb.ts` - RushDB SDK integration with error handling
  - `index.ts` - Unified service coordinating both databases
- **`src/components/Graph3D.tsx`** - 3D visualization component (react-force-graph-3d)
- **`src/app/graph-test/`** - Testing interface with real-time activity logging
- **`src/app/api/graph/`** - RESTful API endpoints for graph operations

### Features Delivered
1. **✅ Interactive 3D Network** - Click, drag, zoom organizational relationships
2. **✅ Multi-Source Data** - Neo4j, RushDB, and Hybrid modes
3. **✅ Real-time Logging** - Activity monitoring and error tracking
4. **✅ Department Color Coding** - Engineering (Blue), Product (Green), Sales (Yellow), Marketing (Red)
5. **✅ Relationship Visualization** - Reporting (Red lines), Collaboration (Green lines)
6. **✅ Node Information Panel** - Click nodes for detailed employee information
7. **✅ Responsive Design** - Works on desktop and mobile devices

### Database Credentials & Limits
**Neo4j AuraDB**:
- Project ID: `20b2ddda.databases.neo4j.io`
- Free tier: 50,000 nodes, 200,000 relationships, 50MB storage
- No daily access limits for development use
- 60-second query timeout

**RushDB**:
- API Token: `52af6990442d68cb2c1994af0fb1b633...` (truncated)
- Free tier: 2 projects free forever with RushDB Cloud
- No published API limits found - appears generous for development
- Recommended for visualization interface layer

### Reusable Module Installation
```bash
# Required Dependencies
npm install neo4j-driver @rushdb/javascript-sdk react-force-graph-3d three

# Copy Module Files
cp -r src/lib/graph/ [target-project]/src/lib/
cp -r src/components/Graph3D.tsx [target-project]/src/components/
cp -r src/app/api/graph/ [target-project]/src/app/api/

# Environment Setup (Optional - can use hardcoded for testing)
NEO4J_URI=neo4j+s://[your-project].databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=[your-password]
RUSHDB_API_TOKEN=[your-token]
```

### Usage Example
```typescript
// Basic Implementation
import graphService from '@/lib/graph'
import Graph3D from '@/components/Graph3D'

// Initialize databases
await graphService.initializeAll({
  neo4j: { uri, username, password },
  rushdb: { apiToken }
})

// Create test data
await graphService.setupTechFlowTestData()

// Get visualization data
const data = await graphService.getVisualizationData('hybrid')

// Render 3D graph
<Graph3D data={data} width={800} height={600} />
```

### Success Metrics Achieved
- **12 Employees** across 4 departments in test company
- **Multiple relationship types** (reporting, collaboration)
- **Zero crashes** with comprehensive error handling
- **3 data source modes** working reliably
- **Real-time interactivity** with smooth 3D navigation

### Critical Lessons Learned
1. **RushDB SDK Issue**: Returns `DBRecordsArrayInstance` not regular arrays
   - **Solution**: Cast as `any` to access `.map()` methods
2. **Hybrid Fallback**: Essential for production reliability
3. **Error Boundaries**: Prevent React crashes during data loading
4. **useCallback Pattern**: Prevent infinite re-renders in complex state

**📖 Module Documentation**: Complete implementation guide in `GRAPH_VISUALIZATION_MODULE.md`

## Environment Variables

### Required (Current - Working)
```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZGFybGluZy1pbnNlY3QtNDMuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_QUTuQDGZGYSdDRqDgJkAthBc2ZshZrynBMeEoZVYVu

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services (Hume AI - Working Credentials)
NEXT_PUBLIC_HUME_API_KEY=cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V
HUME_API_SECRET=fHlJ1vY69ly0dqt3iqZ9XX8PjGyM9OjMkMlBNxXwSaKFgMKG1Sy7hbXqJd0W65i6
NEXT_PUBLIC_HUME_CONFIG_ID=8f16326f-a45d-4433-9a12-890120244ec3

# Other AI
OPENAI_API_KEY=your_openai_api_key
```

### Future Extensions (Phase 1+)
```bash
# Vector Database
NEON_DATABASE_URL=your_neon_postgresql_url

# Graph Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Simplified Graph Interface
RUSHDB_API_KEY=your_rushdb_api_key
RUSHDB_PROJECT_ID=your_rushdb_project_id
```

## Architecture Principles & Decisions

### Database Strategy: Hybrid Approach (Low Risk + High Innovation)
- **Supabase Foundation** - Keep proven core for authentication, real-time, file storage
- **Neon Enhancement** - Add vector intelligence for semantic search and AI analytics
- **Neo4j + Graphiti** - Temporal relationship modeling for career networks
- **RushDB Layer** - Simplified graph interface with built-in 3D visualization

### AI Integration Strategy: Native SDK First
- **Replace Manual Implementation** - Use Hume React SDK instead of custom WebSocket
- **Vercel AI SDK Integration** - Native Next.js streaming and real-time capabilities
- **Type Safety** - Full TypeScript integration across all AI services
- **MCP Development** - Enhanced Claude Code workflow with Hume MCP Server

### Visualization Strategy: 3D Competitive Advantage
- **3D Career Networks** - Interactive exploration of professional relationships (unique in market)
- **Sales Demo Ready** - Professional RushDB dashboard for enterprise presentations
- **Mobile Optimized** - Touch-friendly 3D interactions
- **VR/AR Ready** - Future immersive career exploration capabilities

## Key Implementation Patterns

### Voice AI Integration (UPDATED - Critical for Phase 0)
```typescript
// OLD: Manual WebSocket (current - broken)
const wsUrl = `wss://api.hume.ai/v0/evi/chat?config_id=${configId}&api_key=${apiKey}`

// NEW: Use Hume React SDK + Vercel AI SDK
import { useHume } from '@hume-ai/react'
import { useChat } from '@vercel/ai/react'
import { HumeClient } from '@hume-ai/typescript'
```

### Multi-Database Query Routing (Future)
```typescript
const routeQuery = async (queryType: string, userContext: UserProfile) => {
  switch (queryType) {
    case 'user_profile_data':
      return await supabaseQuery(query, userContext)
    case 'semantic_search':
      return await neonVectorSearch(query, userContext)
    case 'relationship_analysis':
      return await rushDBGraphTraversal(query, userContext)
    case 'complex_intelligence':
      return await hybridSearch(query, userContext)
  }
}
```

### 3D Career Visualization (Phase 1)
```typescript
import ForceGraph3D from 'react-force-graph-3d'

const CareerNetworkVisualization = () => (
  <ForceGraph3D
    graphData={rushDBData}
    nodeThreeObject={createPersonNode}
    linkThreeObject={createRelationshipLink}
    onNodeClick={showCareerInsights}
    enableNodeDrag={true}
    enablePanInteraction={true}
  />
)
```

## Business Model & Value Proposition

### Target Markets & Pricing
- **Individual Users** ($29/month) - AI career coaching with 3D network visualization
- **Team Level** ($199/month per 5 users) - Team optimization and skill gap analysis  
- **Enterprise** ($10K+/month) - Full business intelligence and strategic consulting

### Competitive Advantages
1. **Only 3D Career Platform** - No competitor offers immersive network exploration
2. **Hybrid Intelligence** - Combines relational stability with graph insights and vector search
3. **Voice-First Coaching** - Empathic AI that understands emotional context
4. **Repository Intelligence** - Deep technical insights from actual codebase analysis
5. **Business Partner Evolution** - Platform grows from individual coaching to enterprise consulting

## Critical Issues & Solutions

### Current Problems (Phase 0)
- **❌ Coaching Feature Broken** - Manual WebSocket implementation has issues
- **❌ No Real-time Streaming** - Current setup doesn't handle live AI interactions properly
- **❌ Missing Type Safety** - Not using Hume TypeScript SDK
- **❌ Development Friction** - Could be enhanced with MCP Server integration

### Solutions (Immediate)
- **✅ Hume React SDK** - Replace manual implementation with native components
- **✅ Vercel AI SDK** - Add proper streaming and real-time capabilities
- **✅ Hume TypeScript SDK** - Implement type-safe interactions
- **✅ Hume MCP Server** - Enhance Claude Code development workflow

## Implementation Phases

### Phase 0: Critical Fixes (Weeks 1-4) - CURRENT FOCUS
- Fix Hume AI integration with native SDKs
- Implement Vercel AI SDK for streaming
- Set up enhanced development workflow
- Document GitHub issue resolution

### Phase 1: Foundation + Visualization (Months 1-3)
- Add repository analysis service
- Implement hybrid database architecture
- Build basic 3D career visualization
- Set up sales demo environment

### Phase 2: Network Intelligence (Months 4-6)
- Team coaching features
- Professional network mapping
- Advanced 3D visualization
- Business intelligence dashboards

### Phase 3: Business Partner Platform (Months 7-12)
- Enterprise features and consulting
- VR/AR career exploration
- AI-guided graph navigation
- Custom branded dashboards

## Important Development Notes

### Critical Reminders
- **ALWAYS test npm run build** before pushing (deployment will fail otherwise)
- **Voice features require HTTPS** (works on Vercel, not localhost)
- **Hume AI needs proper SDK integration** (current manual implementation is broken)
- **Check Vercel environment variables** - ensure all keys are properly set
- **All user data is private** by default (RLS enabled in Supabase)

### Architecture Testing (Future)
```bash
# Testing tools for hybrid database architecture
npm test                    # Unit tests for React components
npm run test:integration    # Integration tests for database layer
npm run test:e2e           # End-to-end tests with Playwright
npm run test:graph         # Neo4j + RushDB relationship tests
npm run test:vector        # Neon pgvector semantic search tests
```

### Files to Reference
- **`AI_BUSINESS_PARTNER_PLATFORM_PRD.md`** - Complete 40+ page product specification
- **`src/hooks/useHumeEVI.ts`** - Current Hume AI implementation (needs migration)
- **`src/app/quest/page.tsx`** - Voice coaching interface (needs SDK update)

---

*This document provides complete context for the enhanced AI Business Partner Platform with hybrid architecture, 3D visualization, and native AI SDK integration. The immediate focus is Phase 0 critical fixes to get the coaching feature working properly.*