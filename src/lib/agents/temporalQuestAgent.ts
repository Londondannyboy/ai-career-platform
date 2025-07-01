/**
 * Temporal Quest Agent with Graphiti Integration
 * Extends the base Quest Agent with temporal knowledge and episodic memory
 */

import { openai } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'
import { QuestAgent, SearchStrategy, SearchResults } from './questAgent'
import { graphitiService } from '../temporal/graphiti'
import { randomUUID } from 'crypto'

export interface TemporalSearchResults extends SearchResults {
  temporalFacts: any[]
  relatedEntities: any[]
  episodeId: string
  confidence: number
}

export interface TemporalContext {
  userId: string
  query: string
  timestamp: Date
  previousEpisodes?: any[]
  entityHistory?: any[]
}

export class TemporalQuestAgent extends QuestAgent {
  /**
   * Process query with temporal awareness and episode tracking
   */
  async processTemporalQuery(
    query: string, 
    userId: string = 'anonymous'
  ): Promise<AsyncGenerator<string>> {
    const timestamp = new Date()
    const episodeId = randomUUID()
    
    // Build temporal context
    const context: TemporalContext = {
      userId,
      query,
      timestamp
    }
    
    try {
      // 1. Extract entities from query
      const entities = await this.extractQueryEntities(query)
      
      // 2. Get current temporal facts for entities
      const temporalFacts = []
      for (const entityList of Object.values(entities)) {
        for (const entity of entityList as string[]) {
          const facts = await graphitiService.getCurrentFacts(entity, timestamp)
          temporalFacts.push(...facts)
        }
      }
      
      // 3. Get related entities through temporal connections
      const relatedEntities = []
      for (const entityList of Object.values(entities)) {
        for (const entity of entityList as string[]) {
          const related = await graphitiService.findRelatedEntities(entity)
          relatedEntities.push(...related)
        }
      }
      
      // 4. Determine strategy with temporal context
      const strategy = await this.determineTemporalStrategy(query, temporalFacts)
      
      // 5. Execute search with temporal enrichment
      const searchResults = await this.executeSearch(query, strategy)
      
      // 6. Create temporal search results
      const temporalResults: TemporalSearchResults = {
        ...searchResults,
        temporalFacts,
        relatedEntities,
        episodeId,
        confidence: this.calculateConfidence(searchResults, temporalFacts)
      }
      
      // 7. Store facts discovered during search
      const discoveredFacts = await this.extractFactsFromResults(temporalResults, episodeId)
      
      // 8. Create episode for this search
      await graphitiService.createEpisode({
        userId,
        query,
        timestamp,
        context: {
          strategy,
          entities,
          temporalFactsCount: temporalFacts.length,
          relatedEntitiesCount: relatedEntities.length
        },
        facts: discoveredFacts
      })
      
      // 9. Generate temporally-aware response
      return this.streamTemporalResponse(temporalResults, context)
      
    } catch (error) {
      console.error('Temporal query processing error:', error)
      // Fallback to standard processing
      return this.processQuery(query)
    }
  }
  
  /**
   * Determine search strategy with temporal context
   */
  private async determineTemporalStrategy(
    query: string, 
    temporalFacts: any[]
  ): Promise<SearchStrategy> {
    const { text } = await generateText({
      model: openai('gpt-4'),
      prompt: `Analyze this query with temporal context and determine the best search strategy:
      
Query: "${query}"

Temporal Facts Available: ${temporalFacts.length} facts
Recent Facts: ${temporalFacts.slice(0, 3).map(f => `${f.subject} ${f.predicate} ${f.object} (confidence: ${f.confidence})`).join(', ')}

Consider:
- If the query asks about current state, use temporal facts heavily
- If asking about relationships, use graph strategy
- If asking about similarities, use vector strategy
- If asking about changes over time, use hybrid with temporal emphasis

Options:
1. vector - Use for semantic similarity, finding similar content
2. graph - Use for relationships, connections, organizational structure
3. hybrid - Use when query needs both similarity AND relationships
4. temporal - Use when query specifically asks about time, changes, or current state

Respond with only one word: vector, graph, hybrid, or temporal`,
      temperature: 0.3,
    })
    
    const strategy = text.trim().toLowerCase() as SearchStrategy
    
    // If temporal strategy chosen, use hybrid with temporal weighting
    if (strategy === 'temporal' as any) {
      return 'hybrid'
    }
    
    return ['vector', 'graph', 'hybrid'].includes(strategy) ? strategy : 'hybrid'
  }
  
  /**
   * Calculate confidence score based on search results and temporal facts
   */
  private calculateConfidence(
    searchResults: SearchResults, 
    temporalFacts: any[]
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Boost confidence if we have recent temporal facts
    const recentFacts = temporalFacts.filter(f => 
      new Date(f.validFrom) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
    )
    confidence += Math.min(recentFacts.length * 0.1, 0.3)
    
    // Boost confidence based on fact confidence scores
    if (temporalFacts.length > 0) {
      const avgFactConfidence = temporalFacts.reduce((sum, f) => sum + f.confidence, 0) / temporalFacts.length
      confidence += avgFactConfidence * 0.2
    }
    
    // Boost confidence if we have search results
    confidence += Math.min(searchResults.metadata.resultCount * 0.05, 0.2)
    
    return Math.min(confidence, 1.0)
  }
  
  /**
   * Extract facts from search results to store in temporal graph
   */
  private async extractFactsFromResults(
    results: TemporalSearchResults, 
    episodeId: string
  ): Promise<string[]> {
    const factIds: string[] = []
    
    try {
      // Extract facts from vector search results
      if (results.vectorResults) {
        for (const result of results.vectorResults) {
          // Store fact about document relevance
          const factId = await graphitiService.storeFact({
            subject: 'user-query',
            predicate: 'found_relevant',
            object: result.id,
            confidence: result.similarity || 0.5,
            validFrom: new Date(),
            source: 'vector-search',
            episodeId
          })
          factIds.push(factId)
        }
      }
      
      // Store facts about entity relationships from graph results
      if (results.graphResults) {
        for (const result of results.graphResults) {
          if (result.relationship) {
            const factId = await graphitiService.storeFact({
              subject: result.source || 'unknown',
              predicate: result.relationship.type || 'related_to',
              object: result.target || 'unknown',
              confidence: 0.8,
              validFrom: new Date(),
              source: 'graph-search',
              episodeId
            })
            factIds.push(factId)
          }
        }
      }
    } catch (error) {
      console.error('Error extracting facts:', error)
    }
    
    return factIds
  }
  
  /**
   * Generate streaming response with temporal context
   */
  private async *streamTemporalResponse(
    results: TemporalSearchResults,
    context: TemporalContext
  ): AsyncGenerator<string> {
    const systemPrompt = `You are Quest AI with temporal knowledge capabilities. You have access to:

1. Current search results from vector and graph databases
2. Temporal facts that track how entities change over time
3. Related entities discovered through temporal connections
4. Confidence scores for facts and relationships

When answering:
- Reference temporal context when relevant ("As of [date]...", "Recently...", "Previously...")
- Mention confidence levels for uncertain information
- Highlight when information has changed over time
- Use related entities to provide broader context`

    const temporalContext = this.buildTemporalContext(results)
    
    const response = await streamText({
      model: openai('gpt-4'),
      system: systemPrompt,
      prompt: `User Query: "${context.query}"

${temporalContext}

Based on this temporal knowledge and search results, provide a comprehensive answer that:
1. Directly answers the user's question
2. Includes relevant temporal context
3. Mentions confidence levels where appropriate
4. Suggests related entities or follow-up questions

Be conversational but precise. Highlight time-sensitive information.`,
      temperature: 0.7,
    })
    
    for await (const chunk of response.textStream) {
      yield chunk
    }
  }
  
  /**
   * Build temporal context string for LLM prompt
   */
  private buildTemporalContext(results: TemporalSearchResults): string {
    const parts: string[] = []
    
    // Add search results context
    const standardContext = this.prepareContext(results)
    if (standardContext) {
      parts.push(standardContext)
    }
    
    // Add temporal facts
    if (results.temporalFacts.length > 0) {
      parts.push('\n=== Temporal Facts ===')
      results.temporalFacts.slice(0, 10).forEach((fact, idx) => {
        const validUntil = fact.validTo ? ` (valid until ${fact.validTo.toISOString().split('T')[0]})` : ' (current)'
        parts.push(`\n[${idx + 1}] ${fact.subject} ${fact.predicate} ${fact.object}
    Since: ${fact.validFrom.toISOString().split('T')[0]}${validUntil}
    Confidence: ${(fact.confidence * 100).toFixed(1)}%
    Source: ${fact.source}`)
      })
    }
    
    // Add related entities
    if (results.relatedEntities.length > 0) {
      parts.push('\n=== Related Entities ===')
      results.relatedEntities.slice(0, 5).forEach((entity, idx) => {
        parts.push(`\n[${idx + 1}] ${entity.entity.id || 'Unknown'}
    Connections: ${entity.connections}
    Avg Confidence: ${(entity.avgConfidence * 100).toFixed(1)}%`)
      })
    }
    
    // Add metadata
    parts.push(`\n=== Search Metadata ===
Strategy: ${results.strategy}
Overall Confidence: ${(results.confidence * 100).toFixed(1)}%
Processing Time: ${results.metadata.processingTime}ms
Episode ID: ${results.episodeId}`)
    
    return parts.join('\n')
  }
}

export const temporalQuestAgent = new TemporalQuestAgent()