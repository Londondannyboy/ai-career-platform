# Cole Medin Architecture Integration - Quest Platform

## Overview

This document outlines how Quest integrates Cole Medin's cutting-edge Agentic RAG + Knowledge Graph architecture (from [ottomator-agents](https://github.com/coleam00/ottomator-agents/tree/main/agentic-rag-knowledge-graph)) into our TypeScript/Next.js stack.

## Core Architecture Pattern

### Hybrid Search Intelligence
Cole's architecture brilliantly combines two complementary search approaches:

1. **Vector Search (Semantic)**: Find similar content using embeddings
2. **Knowledge Graph (Relationships)**: Traverse entity connections and temporal facts

Our Quest implementation adapts this to business intelligence:
- Vector search for company documents, profiles, and insights
- Knowledge graph for organizational relationships and network effects

## Technology Stack Mapping

### Cole's Stack → Quest's Stack

| Cole's Component | Purpose | Quest Implementation |
|-----------------|---------|---------------------|
| PostgreSQL + pgvector | Vector embeddings | Neon.tech PostgreSQL |
| Neo4j + Graphiti | Temporal knowledge graph | Neo4j + Graphiti |
| Pydantic AI Agent | Intelligent search orchestration | Vercel AI SDK + Custom Agent |
| FastAPI | API server | Next.js App Router |
| Python ingestion | Document processing | TypeScript services |

## Architectural Components

### 1. Intelligent Agent System
```typescript
// Core agent that decides search strategy
interface QuestAgent {
  // Analyzes query and chooses optimal search method
  determineSearchStrategy(query: string): SearchStrategy
  
  // Executes hybrid search across both databases
  executeSearch(query: string, strategy: SearchStrategy): SearchResults
  
  // Streams responses with source citations
  streamResponse(results: SearchResults): AsyncGenerator<string>
}
```

### 2. Dual Database Architecture

#### Neon.tech (Vector Database)
- **Purpose**: Semantic search across all content
- **Content**: 
  - Company descriptions and documents
  - LinkedIn profiles and summaries
  - Industry insights and market data
- **Key Feature**: pgvector for similarity search

#### Neo4j + Graphiti (Knowledge Graph)
- **Purpose**: Relationship and temporal tracking
- **Content**:
  - Person → Company relationships
  - Person → Person connections (recommendations, colleagues)
  - Company → Company relationships (competitors, partners)
  - Temporal facts (job changes, company growth)
- **Key Feature**: Time-aware relationship queries

### 3. Search Strategies

#### Vector Search (When to Use)
- Finding people with specific skills
- Locating companies in an industry
- Semantic document search
- "Find me profiles similar to..."

#### Graph Search (When to Use)  
- Mapping organizational hierarchies
- Finding connection paths between people
- Tracking career progressions
- "How is X connected to Y?"

#### Hybrid Search (Best of Both)
- Complex queries needing both similarity and relationships
- "Find decision makers at AI companies connected to our network"

## Implementation Patterns

### 1. Document Ingestion Flow
```typescript
// Adapted from Cole's ingestion pipeline
async function ingestDocument(document: Document) {
  // 1. Parse and chunk semantically
  const chunks = await semanticChunker.chunk(document)
  
  // 2. Generate embeddings
  const embeddings = await generateEmbeddings(chunks)
  
  // 3. Extract entities and relationships
  const entities = await extractEntities(document)
  const relationships = await inferRelationships(entities)
  
  // 4. Store in both databases
  await Promise.all([
    neonClient.storeEmbeddings(chunks, embeddings),
    graphitiClient.storeEntities(entities, relationships)
  ])
}
```

### 2. Intelligent Query Processing
```typescript
// Adapted from Cole's agent.py
async function processQuery(query: string): Promise<Response> {
  // 1. Analyze query intent
  const intent = await analyzeQueryIntent(query)
  
  // 2. Determine optimal search strategy
  let strategy: SearchStrategy
  if (intent.needsRelationships && intent.needsSemantic) {
    strategy = 'hybrid'
  } else if (intent.needsRelationships) {
    strategy = 'graph'
  } else {
    strategy = 'vector'
  }
  
  // 3. Execute search
  const results = await executeSearch(query, strategy)
  
  // 4. Generate response with citations
  return generateResponse(results)
}
```

### 3. Prompt Engineering

Following Cole's pattern, we define specialized prompts:

```typescript
const COMPANY_INTELLIGENCE_PROMPT = `
You are an AI assistant specialized in business intelligence and organizational mapping.

When searching for information:
1. Use vector search for: company descriptions, industry analysis, profile matching
2. Use graph search for: organizational structure, professional networks, career paths
3. Use hybrid search for: complex queries involving both similarity and relationships

Always cite your sources and indicate confidence levels.
`
```

## Key Differentiators from Traditional RAG

1. **Temporal Awareness**: Track how relationships and facts change over time
2. **Relationship Intelligence**: Understand not just what, but how entities connect
3. **Intelligent Search Selection**: AI chooses the optimal search method
4. **Source Attribution**: Every fact is traceable to its origin

## Implementation Phases

### Phase 1: Core Infrastructure
- Set up Neon.tech with pgvector
- Configure Graphiti with Neo4j
- Create base agent architecture

### Phase 2: Ingestion Pipeline  
- LinkedIn profile processor
- Company document processor
- Relationship extractor

### Phase 3: Search Implementation
- Vector search service
- Graph traversal queries
- Hybrid search orchestration

### Phase 4: Intelligence Layer
- Decision maker identification
- Sales intelligence scoring
- Network effect analysis

## Benefits for Quest

1. **Cutting-Edge Architecture**: Implements state-of-the-art RAG patterns
2. **Flexible Search**: Automatically uses the best search method
3. **Rich Context**: Combines semantic understanding with relationship intelligence
4. **Scalable**: Both databases scale independently
5. **Cost-Effective**: Pay-per-use embeddings, efficient caching

## Example Use Cases

### 1. Find Decision Makers
```
Query: "Find CTOs at AI companies in our network"
Strategy: Hybrid (semantic for "AI companies", graph for "in our network")
```

### 2. Company Intelligence
```
Query: "What do we know about CK Delta's growth?"
Strategy: Hybrid (vector for documents, graph for employee changes)
```

### 3. Warm Introductions
```
Query: "Who can introduce me to Philip at CK Delta?"
Strategy: Graph (pure relationship traversal)
```

## References

- [Cole Medin's Original Architecture](https://github.com/coleam00/ottomator-agents/tree/main/agentic-rag-knowledge-graph)
- [Graphiti Documentation](https://github.com/getzep/graphiti)
- [Neon.tech pgvector Guide](https://neon.tech/docs/extensions/pgvector)

---

This architecture positions Quest at the forefront of business intelligence platforms by combining the best of semantic search and knowledge graphs, all while maintaining our TypeScript/Next.js foundation.