/**
 * Quest Web Intelligence Agent
 * Unified agent that intelligently routes between Serper, Linkup, and Tavily
 */

export type SearchProvider = 'serper' | 'linkup' | 'tavily' | 'hybrid'

export interface QuestSearchRequest {
  query: string
  userId?: string
  urgency?: 'fast' | 'balanced' | 'comprehensive'
}

export interface QuestSearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  score: number
  provider: SearchProvider
  publishedDate?: string
}

export interface QuestSearchResponse {
  query: string
  provider: SearchProvider
  strategy: string
  confidence: number
  answer?: string
  results: QuestSearchResult[]
  followUpQuestions?: string[]
  processingTime: number
  reasoning: string
}

export class QuestWebAgent {
  /**
   * Main search method with intelligent routing
   */
  async search(request: QuestSearchRequest): Promise<QuestSearchResponse> {
    const startTime = Date.now()
    
    // Analyze query to determine best strategy
    const strategy = this.analyzeQueryIntent(request.query, request.urgency)
    
    try {
      let response: QuestSearchResponse
      
      switch (strategy.provider) {
        case 'serper':
          response = await this.searchWithSerper(request, strategy)
          break
        case 'linkup':
          response = await this.searchWithLinkup(request, strategy)
          break
        case 'tavily':
          response = await this.searchWithTavily(request, strategy)
          break
        case 'hybrid':
          response = await this.searchHybrid(request, strategy)
          break
        default:
          response = await this.searchWithLinkup(request, strategy)
      }
      
      response.processingTime = Date.now() - startTime
      return response
      
    } catch (error) {
      console.error('Quest web search error:', error)
      
      // Fallback to Serper for reliability
      return this.searchWithSerper(request, { 
        provider: 'serper', 
        reasoning: 'Fallback due to error',
        confidence: 0.5 
      })
    }
  }

  /**
   * Analyze query intent and determine optimal search strategy
   */
  private analyzeQueryIntent(query: string, urgency?: string): { provider: SearchProvider; reasoning: string; confidence: number } {
    const lowerQuery = query.toLowerCase()
    
    // Fast urgency override
    if (urgency === 'fast') {
      return { provider: 'serper', reasoning: 'Fast urgency requested', confidence: 0.9 }
    }
    
    // Comprehensive urgency override
    if (urgency === 'comprehensive') {
      return { provider: 'hybrid', reasoning: 'Comprehensive analysis requested', confidence: 0.9 }
    }
    
    // News and real-time content
    if (this.isNewsQuery(lowerQuery)) {
      return { provider: 'tavily', reasoning: 'Real-time news and events query', confidence: 0.85 }
    }
    
    // Research and analysis queries
    if (this.isResearchQuery(lowerQuery)) {
      return { provider: 'linkup', reasoning: 'Deep research and analysis needed', confidence: 0.9 }
    }
    
    // Comparison queries benefit from multiple sources
    if (this.isComparisonQuery(lowerQuery)) {
      return { provider: 'linkup', reasoning: 'Comparison analysis requires deep AI synthesis', confidence: 0.85 }
    }
    
    // Quick factual queries
    if (this.isQuickFactQuery(lowerQuery)) {
      return { provider: 'serper', reasoning: 'Quick factual lookup', confidence: 0.8 }
    }
    
    // Complex questions default to Linkup for AI analysis
    if (query.length > 50 || this.hasComplexWords(lowerQuery)) {
      return { provider: 'linkup', reasoning: 'Complex query requires AI synthesis', confidence: 0.8 }
    }
    
    // Default to Serper for speed
    return { provider: 'serper', reasoning: 'Default fast search', confidence: 0.7 }
  }

  private isNewsQuery(query: string): boolean {
    const newsKeywords = ['news', 'latest', 'recent', 'today', 'breaking', 'announcement', 'update', '2024', '2025']
    return newsKeywords.some(keyword => query.includes(keyword))
  }

  private isResearchQuery(query: string): boolean {
    const researchKeywords = ['analysis', 'research', 'study', 'report', 'strategy', 'business model', 'financial', 'market', 'trends']
    return researchKeywords.some(keyword => query.includes(keyword))
  }

  private isComparisonQuery(query: string): boolean {
    const comparisonKeywords = ['vs', 'versus', 'compare', 'comparison', 'difference', 'better', 'best']
    return comparisonKeywords.some(keyword => query.includes(keyword))
  }

  private isQuickFactQuery(query: string): boolean {
    const quickKeywords = ['what is', 'who is', 'when', 'where', 'how much', 'how many', 'price', 'cost']
    return quickKeywords.some(keyword => query.includes(keyword))
  }

  private hasComplexWords(query: string): boolean {
    const complexKeywords = ['explain', 'analyze', 'evaluate', 'assess', 'determine', 'investigate', 'comprehensive']
    return complexKeywords.some(keyword => query.includes(keyword))
  }

  /**
   * Search using Serper (fast)
   */
  private async searchWithSerper(request: QuestSearchRequest, strategy: any): Promise<QuestSearchResponse> {
    const response = await fetch('/api/serper-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: request.query,
        type: 'search'
      })
    })

    const data = await response.json()
    
    return {
      query: request.query,
      provider: 'serper',
      strategy: strategy.reasoning,
      confidence: strategy.confidence,
      answer: data.answerBox?.answer || data.knowledgeGraph?.description,
      results: data.results || [],
      processingTime: data.processingTime || 0,
      reasoning: strategy.reasoning
    }
  }

  /**
   * Search using Linkup (deep AI)
   */
  private async searchWithLinkup(request: QuestSearchRequest, strategy: any): Promise<QuestSearchResponse> {
    const response = await fetch('/api/linkup-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: request.query,
        depth: request.urgency === 'comprehensive' ? 'deep' : 'standard'
      })
    })

    const data = await response.json()
    
    return {
      query: request.query,
      provider: 'linkup',
      strategy: strategy.reasoning,
      confidence: strategy.confidence,
      answer: data.answer,
      results: data.results || [],
      processingTime: 0,
      reasoning: strategy.reasoning
    }
  }

  /**
   * Search using Tavily (research)
   */
  private async searchWithTavily(request: QuestSearchRequest, strategy: any): Promise<QuestSearchResponse> {
    const response = await fetch('/api/tavily-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: request.query,
        search_depth: request.urgency === 'comprehensive' ? 'advanced' : 'basic'
      })
    })

    const data = await response.json()
    
    return {
      query: request.query,
      provider: 'tavily',
      strategy: strategy.reasoning,
      confidence: strategy.confidence,
      answer: data.answer,
      results: data.results || [],
      followUpQuestions: data.followUpQuestions,
      processingTime: 0,
      reasoning: strategy.reasoning
    }
  }

  /**
   * Hybrid search combining multiple providers
   */
  private async searchHybrid(request: QuestSearchRequest, strategy: any): Promise<QuestSearchResponse> {
    // For hybrid, use Linkup as primary with Tavily for supplementary real-time data
    const [linkupResult, tavilyResult] = await Promise.allSettled([
      this.searchWithLinkup(request, { ...strategy, provider: 'linkup' }),
      this.searchWithTavily(request, { ...strategy, provider: 'tavily' })
    ])

    const linkupData = linkupResult.status === 'fulfilled' ? linkupResult.value : null
    const tavilyData = tavilyResult.status === 'fulfilled' ? tavilyResult.value : null

    // Combine results, prioritizing Linkup
    const combinedResults: QuestSearchResult[] = []
    const seenUrls = new Set<string>()

    // Add Linkup results first
    if (linkupData?.results) {
      linkupData.results.forEach(result => {
        if (!seenUrls.has(result.url)) {
          combinedResults.push(result)
          seenUrls.add(result.url)
        }
      })
    }

    // Add Tavily results for additional coverage
    if (tavilyData?.results) {
      tavilyData.results.forEach(result => {
        if (!seenUrls.has(result.url) && combinedResults.length < 12) {
          combinedResults.push(result)
          seenUrls.add(result.url)
        }
      })
    }

    return {
      query: request.query,
      provider: 'hybrid',
      strategy: strategy.reasoning,
      confidence: 0.95, // Hybrid typically more comprehensive
      answer: linkupData?.answer || tavilyData?.answer,
      results: combinedResults,
      followUpQuestions: tavilyData?.followUpQuestions,
      processingTime: Math.max(linkupData?.processingTime || 0, tavilyData?.processingTime || 0),
      reasoning: `${strategy.reasoning} - Combined Linkup AI analysis with Tavily real-time data`
    }
  }
}

export const questWebAgent = new QuestWebAgent()