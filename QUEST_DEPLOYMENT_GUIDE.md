# Quest - Cole Medin Architecture - Deployment Guide

## 🚀 Quick Start (30 minutes)

This guide helps you deploy Cole Medin's agentic RAG + temporal knowledge graph architecture in any project.

### **Prerequisites**
- Next.js 15+ project
- Neo4j database (cloud or local)
- Neon.tech account (free tier works)
- OpenAI API key

### **Step 1: Database Setup** (10 minutes)

#### **Neon.tech Setup**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project (e.g., "your-project-ai")
3. Copy connection string from dashboard
4. Add to environment variables:
```bash
NEON_DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

#### **Neo4j Setup**
1. Use existing Neo4j or create at [neo4j.com/aura](https://neo4j.com/aura)
2. Add credentials to environment:
```bash
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
```

#### **OpenAI Setup**
```bash
OPENAI_API_KEY=sk-your-openai-key
```

### **Step 2: Install Dependencies** (2 minutes)

```bash
npm install pg @types/pg neo4j-driver @ai-sdk/openai ai
```

### **Step 3: Copy Core Files** (10 minutes)

Copy these files from the Quest implementation:

#### **Required Files**:
```
src/lib/vector/
├── neonClient.ts          # PostgreSQL vector operations
├── embeddings.ts          # OpenAI embeddings service

src/lib/temporal/
├── graphiti.ts           # Temporal knowledge graph

src/lib/agents/
├── questAgent.ts         # Main agent orchestration
├── temporalQuestAgent.ts # Time-aware agent
├── prompts.ts           # Business intelligence prompts

src/app/api/
├── agent/init/route.ts          # Database initialization
├── agent/search/route.ts        # Standard search
├── temporal-search/route.ts     # Temporal search
├── graphiti/init/route.ts       # Temporal setup
```

#### **Optional UI Files**:
```
src/app/
├── neon-test/page.tsx           # Database testing
├── neon-migrate/page.tsx        # Data migration
├── agent-search/page.tsx        # Search interface
├── graphiti-test/page.tsx       # Temporal testing
```

### **Step 4: Initialize System** (5 minutes)

1. **Start your Next.js app**: `npm run dev`

2. **Initialize databases**:
   - Visit `/api/agent/init` (POST) - Sets up Neon.tech
   - Visit `/api/graphiti/init` (POST) - Sets up temporal layer

3. **Add test data**:
   - Visit `/api/seed-test-data` (POST) - Adds sample companies/people

4. **Test search**:
   - Visit `/api/agent/search` - Try: "Find AI companies"
   - Visit `/api/temporal-search` - Try: "What do we know about recent changes?"

### **Step 5: Integrate Your Data** (Variable)

#### **From Neo4j**:
```typescript
// Use the migration endpoint
POST /api/migrate-to-neon
{
  "dataType": "all" // or "companies" or "people"
}
```

#### **From APIs**:
```typescript
import { neonClient } from '@/lib/vector/neonClient'
import { embeddingsService } from '@/lib/vector/embeddings'

// Store company with embedding
const embedding = await embeddingsService.generateCompanyEmbedding(companyData)
await neonClient.storeCompanyProfile(companyData, embedding)
```

## 🎯 Customization Guide

### **Adapting Search Strategies**

Edit `src/lib/agents/prompts.ts`:

```typescript
export const YOUR_DOMAIN_PROMPT = `
You are an AI assistant specialized in [YOUR DOMAIN].
Use Vector Search when: [your use cases]
Use Graph Search when: [your use cases]  
Use Hybrid Search when: [your use cases]
`
```

### **Custom Entity Types**

Extend the schema in `src/lib/vector/neonClient.ts`:

```typescript
// Add your custom table
await client.query(`
  CREATE TABLE IF NOT EXISTS your_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
  )
`)
```

### **Custom Temporal Facts**

Add domain-specific facts in `src/lib/temporal/graphiti.ts`:

```typescript
// Store domain-specific facts
await graphitiService.storeFact({
  subject: 'entity-id',
  predicate: 'your_custom_relationship',
  object: 'target-entity',
  confidence: 0.9,
  validFrom: new Date(),
  source: 'your-system'
})
```

## 🔧 Production Deployment

### **Environment Setup**

```bash
# Required for all environments
NEON_DATABASE_URL=postgresql://...
NEO4J_URI=neo4j+s://...
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
OPENAI_API_KEY=sk-...

# Optional optimizations
OPENAI_MODEL=gpt-4o-mini  # Faster/cheaper for strategy selection
EMBEDDING_BATCH_SIZE=10   # Adjust for rate limits
SEARCH_TIMEOUT=30000      # 30 second timeout
```

### **Vercel Deployment**

1. **Add environment variables** in Vercel dashboard
2. **Set runtime** to `nodejs` for database APIs:
```typescript
export const runtime = 'nodejs' // In all API routes
```

3. **Monitor build logs** for common issues:
   - Dotenv import errors → Remove dotenv imports
   - Module resolution → Check runtime settings
   - Type errors → Fix inheritance access modifiers

### **Performance Optimization**

#### **Database Indexing**:
```sql
-- Neon.tech optimizations
CREATE INDEX IF NOT EXISTS idx_embedding_cosine ON documents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_company_industry ON company_profiles(industry);
CREATE INDEX IF NOT EXISTS idx_person_skills ON person_profiles USING gin(skills);
```

#### **Neo4j Indexing**:
```cypher
// Temporal fact indexing
CREATE INDEX fact_confidence FOR (f:Fact) ON (f.confidence);
CREATE INDEX fact_valid_from FOR (f:Fact) ON (f.validFrom);
CREATE INDEX episode_user FOR (e:Episode) ON (e.userId);
```

#### **Rate Limiting**:
```typescript
// Add delays for API calls
await new Promise(resolve => setTimeout(resolve, 100))
```

## 🚨 Troubleshooting

### **Common Build Errors**

| Error | Solution |
|-------|----------|
| `Module not found: Can't resolve 'dotenv'` | Remove dotenv imports |
| `Module not found: Can't resolve 'fs'` | Set runtime to 'nodejs' |
| `'100.0' is not a valid value` | Clean metadata integers |
| `Property 'method' is private` | Change to protected |

### **Database Connection Issues**

| Issue | Check |
|-------|-------|
| `ENOTFOUND base` | Complete connection string format |
| `pgvector not found` | Enable extension in Neon SQL editor |
| `Connection timeout` | Network/firewall settings |
| `Authentication failed` | Username/password correct |

### **Search Quality Issues**

| Problem | Solution |
|---------|----------|
| No semantic results | Add diverse test data first |
| Poor strategy selection | Review prompts.ts configuration |
| Low confidence scores | Increase fact cross-referencing |
| Slow responses | Optimize database indexes |

## 📊 Monitoring & Analytics

### **Key Metrics**

```typescript
// Track in your analytics
{
  searchStrategy: 'vector|graph|hybrid',
  processingTime: 150, // milliseconds
  resultCount: 12,
  confidence: 0.85,
  userId: 'user-123',
  episodeId: 'episode-456'
}
```

### **Health Checks**

```typescript
// Add to your monitoring
const healthCheck = {
  neonConnection: await testNeonConnection(),
  neo4jConnection: await testNeo4jConnection(), 
  openaiAPI: await testOpenAIAPI(),
  embeddingGeneration: await testEmbedding(),
  temporalFacts: await testTemporalQuery()
}
```

## 🎁 Integration Examples

### **React Search Component**

```typescript
const useTemporalSearch = (query: string) => {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  
  const search = async () => {
    setLoading(true)
    const response = await fetch('/api/temporal-search', {
      method: 'POST',
      body: JSON.stringify({ query, userId: 'current-user' })
    })
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setResult(prev => prev + decoder.decode(value))
    }
    setLoading(false)
  }
  
  return { result, loading, search }
}
```

### **Batch Data Import**

```typescript
const importCompanies = async (companies: Company[]) => {
  for (const company of companies) {
    try {
      const embedding = await embeddingsService.generateCompanyEmbedding(company)
      await neonClient.storeCompanyProfile(company, embedding)
      
      // Add temporal facts
      await graphitiService.storeFact({
        subject: company.id,
        predicate: 'industry',
        object: company.industry,
        confidence: 1.0,
        validFrom: new Date(),
        source: 'import'
      })
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`Failed to import ${company.name}:`, error)
    }
  }
}
```

---

## 📈 Success Checklist

- [ ] **Database connections working** (Neon.tech + Neo4j)
- [ ] **Embeddings generating** (OpenAI API functional)
- [ ] **Vector search returning results** (semantic similarity working)
- [ ] **Agent strategy selection** (choosing vector/graph/hybrid correctly)
- [ ] **Temporal facts storing** (Graphiti layer functional)
- [ ] **Episodic memory building** (search history tracked)
- [ ] **Production deployment** (all APIs working in prod)
- [ ] **Data integration complete** (your real data imported)

This architecture provides a solid foundation for intelligent, time-aware search that improves with usage. The temporal knowledge graph component sets it apart from standard RAG implementations by providing memory and context evolution.