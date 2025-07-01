/**
 * Quest Agent - Intelligent Search Orchestration
 * Adapted from Cole Medin's agentic RAG architecture
 */

import { openai } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'
import { neonClient } from '../vector/neonClient'
import { embeddingsService } from '../vector/embeddings'
import { datamagnetGraph } from '../neo4j/datamagnet-graph'
import { 
  QUEST_SYSTEM_PROMPT, 
  detectQueryIntent, 
  selectPrompt 
} from './prompts'

export type SearchStrategy = 'vector' | 'graph' | 'hybrid'

export interface SearchResults {
  strategy: SearchStrategy
  vectorResults?: any[]
  graphResults?: any[]
  metadata: {
    queryIntent: string
    processingTime: number
    resultCount: number
  }
}

export interface AgentResponse {
  answer: string
  sources: string[]
  confidence: number
  searchStrategy: SearchStrategy
}

export class QuestAgent {
  /**
   * Determine the optimal search strategy based on query analysis
   */
  async determineSearchStrategy(query: string): Promise<SearchStrategy> {
    const queryIntent = detectQueryIntent(query)
    
    // Use AI to analyze query complexity
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `Analyze this query and determine the best search strategy:
      
Query: "${query}"

Options:
1. vector - Use for semantic similarity, finding similar content, skills, descriptions
2. graph - Use for relationships, connections, organizational structure, career paths
3. hybrid - Use when query needs both similarity AND relationships

Consider the query intent: ${queryIntent}

Respond with only one word: vector, graph, or hybrid`,
      temperature: 0.3,
    })
    
    const strategy = text.trim().toLowerCase() as SearchStrategy
    
    // Fallback to intent-based selection if AI response is invalid
    if (!['vector', 'graph', 'hybrid'].includes(strategy)) {
      // Default strategies based on intent
      const intentStrategyMap: Record<string, SearchStrategy> = {
        'decision_maker': 'hybrid',
        'introduction': 'graph',
        'sales': 'hybrid',
        'company': 'hybrid',
        'temporal': 'graph',
        'relationship': 'graph',
        'general': 'vector'
      }
      return intentStrategyMap[queryIntent] || 'vector'
    }
    
    return strategy
  }
  
  /**
   * Execute search based on the chosen strategy
   */
  async executeSearch(
    query: string, 
    strategy: SearchStrategy
  ): Promise<SearchResults> {
    const startTime = Date.now()
    const queryIntent = detectQueryIntent(query)
    
    let vectorResults: any[] = []
    let graphResults: any[] = []
    
    switch (strategy) {
      case 'vector':
        vectorResults = await this.executeVectorSearch(query)
        break
        
      case 'graph':
        graphResults = await this.executeGraphSearch(query, queryIntent)
        break
        
      case 'hybrid':
        // Execute both searches in parallel
        const [vResults, gResults] = await Promise.all([
          this.executeVectorSearch(query),
          this.executeGraphSearch(query, queryIntent)
        ])
        vectorResults = vResults
        graphResults = gResults
        break
    }
    
    const processingTime = Date.now() - startTime
    const resultCount = vectorResults.length + graphResults.length
    
    return {
      strategy,
      vectorResults,
      graphResults,
      metadata: {
        queryIntent,
        processingTime,
        resultCount
      }
    }
  }
  
  /**
   * Execute vector search using Neon.tech
   */
  private async executeVectorSearch(query: string): Promise<any[]> {
    try {
      // Generate query embedding
      const queryEmbedding = await embeddingsService.generateQueryEmbedding(query)
      
      // Search across all document types
      const results = await neonClient.hybridSearch(
        query,
        queryEmbedding,
        20, // Get more results for better context
        0.7 // 70% vector weight, 30% keyword weight
      )
      
      return results
    } catch (error) {
      console.error('Vector search error:', error)
      return []
    }
  }
  
  /**
   * Execute graph search using Neo4j
   */
  private async executeGraphSearch(
    query: string, 
    queryIntent: string
  ): Promise<any[]> {
    try {
      // Extract entities from query
      const entities = await this.extractQueryEntities(query)
      
      // Different graph queries based on intent
      switch (queryIntent) {
        case 'introduction':
          return await this.findConnectionPaths(entities)
          
        case 'decision_maker':
          return await this.findDecisionMakers(entities)
          
        case 'temporal':
          return await this.getTemporalData(entities)
          
        case 'relationship':
          return await this.getRelationships(entities)
          
        default:
          return await this.generalGraphSearch(entities)
      }
    } catch (error) {
      console.error('Graph search error:', error)
      return []
    }
  }
  
  /**
   * Generate a streaming response based on search results
   */
  async *streamResponse(results: SearchResults): AsyncGenerator<string> {
    const systemPrompt = QUEST_SYSTEM_PROMPT
    const intentPrompt = selectPrompt(results.metadata.queryIntent)
    
    // Prepare context from search results
    const context = this.prepareContext(results)
    
    const response = await streamText({
      model: openai('gpt-4'),
      system: systemPrompt,
      prompt: `${intentPrompt}
      
Search Results Context:
${context}

Based on these search results, provide a comprehensive answer. Include specific details and cite sources where relevant.`,
      temperature: 0.7,
    })
    
    for await (const chunk of response.textStream) {
      yield chunk
    }
  }
  
  /**
   * Extract entities from query for graph search
   */
  private async extractQueryEntities(query: string): Promise<any> {
    const { text } = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: `Extract entities from this query:
"${query}"

Return JSON with:
{
  "companies": ["company names"],
  "people": ["person names"],
  "skills": ["skills or technologies"],
  "timeframe": "time period if mentioned",
  "relationshipType": "type of relationship queried"
}`,
      temperature: 0.3,
    })
    
    try {
      return JSON.parse(text)
    } catch {
      return {
        companies: [],
        people: [],
        skills: [],
        timeframe: null,
        relationshipType: null
      }
    }
  }
  
  /**
   * Find connection paths between people
   */
  private async findConnectionPaths(entities: any): Promise<any[]> {
    // This would call Neo4j to find shortest paths
    // For now, returning placeholder
    return []
  }
  
  /**
   * Find decision makers at companies
   */
  private async findDecisionMakers(entities: any): Promise<any[]> {
    if (entities.companies.length === 0) return []
    
    // Would query Neo4j for employees with decision-making titles
    // For now, returning placeholder
    return []
  }
  
  /**
   * Get temporal data for entities
   */
  private async getTemporalData(entities: any): Promise<any[]> {
    // Would use Graphiti's temporal features
    // For now, returning placeholder
    return []
  }
  
  /**
   * Get relationships for entities
   */
  private async getRelationships(entities: any): Promise<any[]> {
    // Would query Neo4j for relationships
    // For now, returning placeholder
    return []
  }
  
  /**
   * General graph search
   */
  private async generalGraphSearch(entities: any): Promise<any[]> {
    // Would perform broad graph search
    // For now, returning placeholder
    return []
  }
  
  /**
   * Prepare context from search results for LLM
   */
  private prepareContext(results: SearchResults): string {
    const contextParts: string[] = []
    
    if (results.vectorResults && results.vectorResults.length > 0) {
      contextParts.push('=== Semantic Search Results ===')
      results.vectorResults.forEach((result, idx) => {
        contextParts.push(`
[${idx + 1}] Content: ${result.content}
    Similarity: ${(result.similarity * 100).toFixed(1)}%
    Source: ${result.metadata?.source || 'Unknown'}`)
      })
    }
    
    if (results.graphResults && results.graphResults.length > 0) {
      contextParts.push('\n=== Knowledge Graph Results ===')
      results.graphResults.forEach((result, idx) => {
        contextParts.push(`
[${idx + 1}] ${JSON.stringify(result, null, 2)}`)
      })
    }
    
    return contextParts.join('\n')
  }
  
  /**
   * Process a query end-to-end
   */
  async processQuery(query: string): Promise<AsyncGenerator<string>> {
    // 1. Determine search strategy
    const strategy = await this.determineSearchStrategy(query)
    
    // 2. Execute search
    const results = await this.executeSearch(query, strategy)
    
    // 3. Generate streaming response
    return this.streamResponse(results)
  }
}

export const questAgent = new QuestAgent()