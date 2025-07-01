# Neon.tech Setup Guide for Quest

## 1. Create Neon.tech Account

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for a free account (includes 3GB storage, perfect for MVP)
3. Create a new project named "quest-ai" or similar

## 2. Get Your Connection String

After creating your project:
1. Go to your Neon dashboard
2. Click on your project
3. Find the "Connection Details" section
4. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

## 3. Enable pgvector Extension

In the Neon dashboard:
1. Go to the "SQL Editor" tab
2. Run this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## 4. Update Environment Variables

Add to your `.env.local` file:
```env
# Neon.tech PostgreSQL with pgvector
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

Also add to Vercel environment variables for production.

## 5. Install Required Dependencies

The `pg` package is already installed. If you need to install it:
```bash
npm install pg @types/pg
```

## 6. Initialize Database

Run the initialization script:
```bash
npm run db:init
```

Or manually via the API:
```bash
curl -X POST http://localhost:3000/api/agent/init
```

## Database Schema Created

The initialization will create:

### Documents Table
- General document storage with vector embeddings
- Full-text search capabilities
- Metadata JSON storage

### Company Profiles Table
- Company-specific fields
- LinkedIn URL as unique identifier
- Industry and employee count tracking

### Person Profiles Table  
- Person-specific fields
- Username as unique identifier
- Skills array storage

All tables include:
- Vector embeddings (1536 dimensions for OpenAI)
- Timestamps for created/updated tracking
- Optimized indexes for fast similarity search

## Cost Considerations

- **Free Tier**: 3GB storage, perfect for MVP
- **Embeddings**: ~4KB per document with embedding
- **Estimate**: Can store ~750,000 documents in free tier
- **API Costs**: Only pay for OpenAI embedding generation

## Next Steps

After setup:
1. Test vector search functionality
2. Start ingesting company/person data
3. Generate embeddings for existing Neo4j data
4. Enable hybrid search capabilities