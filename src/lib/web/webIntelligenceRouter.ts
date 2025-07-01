/**
 * Quest - Web Intelligence Router
 * Smart routing between Linkup.so, Serper.dev for optimal search performance
 */

import { linkupClient, LinkupSearchRequest, LinkupResponse } from './linkupClient'
import { serperClient, SerperSearchRequest, SerperResponse } from './serperClient'

export type SearchProvider = 'linkup' | 'serper' | 'hybrid'

export interface WebSearchRequest {
  query: string
  intent?: 'job_search' | 'company_research' | 'salary_research' | 'person_lookup' | 'general' | 'news'
  urgency?: 'fast' | 'comprehensive' | 'balanced'
  location?: string
  company?: string
  maxResults?: number
}

export interface UnifiedSearchResult {
  title: string
  url: string
  content: string
  snippet: string
  source: string
  publishDate?: string
  domain: string
  score: number
  provider: SearchProvider
  confidence: number
  metadata?: Record<string, any>
}

export interface WebIntelligenceResponse {
  results: UnifiedSearchResult[]
  totalResults: number
  processingTime: number
  provider: SearchProvider
  strategy: string
  confidence: number
  query: string
  intent: string
}

export class WebIntelligenceRouter {
  /**
   * Main search entry point with intelligent routing
   */
  async search(request: WebSearchRequest): Promise<WebIntelligenceResponse> {
    const startTime = Date.now()
    
    // Determine optimal search strategy
    const strategy = this.determineSearchStrategy(request)
    
    try {
      let response: WebIntelligenceResponse
      
      switch (strategy.provider) {
        case 'linkup':
          response = await this.searchWithLinkup(request, strategy)
          break
        case 'serper':
          response = await this.searchWithSerper(request, strategy)
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
      console.error('Web intelligence search error:', error)
      
      // Fallback to Serper for speed
      if (strategy.provider !== 'serper') {
        return this.searchWithSerper(request, { provider: 'serper', reasoning: 'fallback' })
      }
      
      throw error
    }
  }

  /**
   * Determine optimal search strategy based on query intent and urgency
   */
  private determineSearchStrategy(request: WebSearchRequest): { provider: SearchProvider; reasoning: string } {
    const { intent, urgency, query } = request
    
    // Fast responses needed
    if (urgency === 'fast') {
      return { provider: 'serper', reasoning: 'Fast urgency requires Serper speed' }
    }
    
    // Intent-based routing
    switch (intent) {
      case 'job_search':
        return { provider: 'linkup', reasoning: 'Job search benefits from Linkup deep analysis' }
      
      case 'company_research':
        return { provider: 'linkup', reasoning: 'Company research needs comprehensive Linkup intelligence' }
      
      case 'salary_research':
        return { provider: 'hybrid', reasoning: 'Salary data benefits from multiple sources' }
      
      case 'person_lookup':
        return { provider: 'serper', reasoning: 'Person lookup is fast with Serper' }
      
      case 'news':
        return { provider: 'serper', reasoning: 'News search optimized with Serper' }
      
      case 'general':
        // Analyze query complexity
        if (query.length > 50 || query.includes('why') || query.includes('how') || query.includes('explain')) {
          return { provider: 'linkup', reasoning: 'Complex query needs Linkup deep search' }
        }
        return { provider: 'serper', reasoning: 'Simple query suitable for fast Serper search' }
      
      default:
        return { provider: 'linkup', reasoning: 'Default to Linkup for comprehensive results' }
    }
  }

  /**
   * Search using Linkup.so (primary intelligence engine)
   */
  private async searchWithLinkup(request: WebSearchRequest, strategy: any): Promise<WebIntelligenceResponse> {
    const linkupRequest: LinkupSearchRequest = {
      query: request.query,
      depth: request.urgency === 'comprehensive' ? 'deep' : 'standard',
      outputType: 'sourcedAnswer'
    }

    let response: LinkupResponse

    // Use specialized search methods based on intent
    switch (request.intent) {
      case 'job_search':
        response = await linkupClient.searchJobs(request.query, request.location)
        break
      case 'company_research':
        response = await linkupClient.searchCompany(request.company || request.query, 'general')
        break
      case 'salary_research':
        response = await linkupClient.searchSalary(request.query, request.company, request.location)
        break
      default:
        response = await linkupClient.search(linkupRequest)
    }

    return {
      results: response.results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        snippet: result.snippet,
        source: result.domain,
        publishDate: result.publishDate,
        domain: result.domain,
        score: result.score,
        provider: 'linkup' as SearchProvider,
        confidence: result.score,
        metadata: result.metadata
      })),
      totalResults: response.totalResults,
      processingTime: response.processingTime,
      provider: 'linkup',
      strategy: strategy.reasoning,
      confidence: response.confidence,
      query: request.query,
      intent: request.intent || 'general'
    }
  }

  /**
   * Search using Serper.dev (fast search engine)
   */
  private async searchWithSerper(request: WebSearchRequest, strategy: any): Promise<WebIntelligenceResponse> {
    const serperRequest: SerperSearchRequest = {
      query: request.query,
      type: request.intent === 'news' ? 'news' : 'search',
      num: request.maxResults || 10,
      ...(request.location && { location: request.location })
    }

    let response: SerperResponse

    // Use specialized search methods based on intent
    switch (request.intent) {
      case 'job_search':
        response = await serperClient.searchJobs(request.query, request.location)
        break
      case 'company_research':
      case 'news':
        response = await serperClient.searchCompanyNews(request.company || request.query)
        break
      case 'salary_research':
        response = await serperClient.searchSalary(request.query, request.location)
        break
      case 'person_lookup':
        response = await serperClient.searchPerson(request.query, request.company)
        break
      default:
        response = await serperClient.search(serperRequest)
    }

    return {
      results: response.organic?.map((result, index) => ({
        title: result.title,
        url: result.link,
        content: result.snippet,
        snippet: result.snippet,
        source: new URL(result.link).hostname,
        publishDate: result.date,
        domain: new URL(result.link).hostname,
        score: (response.organic.length - index) / response.organic.length, // Position-based scoring
        provider: 'serper' as SearchProvider,
        confidence: 0.8, // Serper generally reliable
        metadata: { position: result.position }
      })) || [],
      totalResults: parseInt(response.searchInformation?.totalResults || '0'),
      processingTime: response.searchInformation?.timeTaken || 0,
      provider: 'serper',
      strategy: strategy.reasoning,
      confidence: 0.8,
      query: request.query,
      intent: request.intent || 'general'
    }
  }

  /**
   * Hybrid search combining both providers
   */
  private async searchHybrid(request: WebSearchRequest, strategy: any): Promise<WebIntelligenceResponse> {
    const [linkupResults, serperResults] = await Promise.allSettled([
      this.searchWithLinkup({ ...request, maxResults: 6 }, strategy),
      this.searchWithSerper({ ...request, maxResults: 6 }, strategy)
    ])

    const linkupData = linkupResults.status === 'fulfilled' ? linkupResults.value : null
    const serperData = serperResults.status === 'fulfilled' ? serperResults.value : null

    // Combine and deduplicate results
    const combinedResults: UnifiedSearchResult[] = []
    const seenUrls = new Set<string>()

    // Add Linkup results first (higher quality)
    if (linkupData) {
      linkupData.results.forEach(result => {
        if (!seenUrls.has(result.url)) {
          combinedResults.push(result)
          seenUrls.add(result.url)
        }
      })
    }

    // Add Serper results for additional coverage
    if (serperData) {
      serperData.results.forEach(result => {
        if (!seenUrls.has(result.url) && combinedResults.length < (request.maxResults || 12)) {
          combinedResults.push(result)
          seenUrls.add(result.url)
        }
      })
    }

    // Sort by confidence/score
    combinedResults.sort((a, b) => b.score - a.score)

    return {
      results: combinedResults,
      totalResults: (linkupData?.totalResults || 0) + (serperData?.totalResults || 0),
      processingTime: Math.max(linkupData?.processingTime || 0, serperData?.processingTime || 0),
      provider: 'hybrid',
      strategy: strategy.reasoning,
      confidence: 0.9, // Hybrid typically more reliable
      query: request.query,
      intent: request.intent || 'general'
    }
  }

  /**
   * Quick job search across multiple sources
   */
  async searchJobs(query: string, location?: string, urgency: 'fast' | 'comprehensive' = 'balanced'): Promise<WebIntelligenceResponse> {
    return this.search({
      query,
      intent: 'job_search',
      urgency,
      location,
      maxResults: 15
    })
  }

  /**
   * Company intelligence gathering
   */
  async researchCompany(companyName: string, focus: 'overview' | 'news' | 'careers' = 'overview'): Promise<WebIntelligenceResponse> {
    return this.search({
      query: companyName,
      intent: focus === 'news' ? 'news' : 'company_research',
      urgency: 'comprehensive',
      company: companyName,
      maxResults: 12
    })
  }

  /**
   * Test both providers
   */
  async healthCheck(): Promise<{ linkup: boolean; serper: boolean; overall: boolean }> {
    const [linkupHealth, serperHealth] = await Promise.allSettled([
      linkupClient.testConnection(),
      serperClient.testConnection()
    ])

    const linkupOk = linkupHealth.status === 'fulfilled' && linkupHealth.value
    const serperOk = serperHealth.status === 'fulfilled' && serperHealth.value

    return {
      linkup: linkupOk,
      serper: serperOk,
      overall: linkupOk || serperOk // At least one working
    }
  }
}

export const webIntelligenceRouter = new WebIntelligenceRouter()