/**
 * Quest - Linkup.so Web Intelligence Client
 * Primary web search engine with 91% SOTA performance on SimpleQA benchmarks
 */

export interface LinkupSearchRequest {
  query: string
  depth?: 'standard' | 'deep'
  outputType?: 'sourcedAnswer' | 'searchResults'
}

export interface LinkupSource {
  name: string
  url: string
  snippet: string
}

export interface LinkupSearchResult {
  title: string
  url: string
  content: string
  snippet: string
  domain: string
  score: number
}

export interface LinkupResponse {
  answer?: string
  sources?: LinkupSource[]
  results?: LinkupSearchResult[]
  query: string
  searchDepth: string
  processingTime: number
}

export class LinkupClient {
  private apiKey: string
  private baseUrl = 'https://api.linkup.so/v1'

  constructor(apiKey?: string) {
    // Use provided test key for now, fallback to env
    this.apiKey = apiKey || '55ae9876-ffe4-4ee3-92b0-cb3c43ba280f' || process.env.LINKUP_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('Linkup API key is required. Set LINKUP_API_KEY environment variable.')
    }
  }

  /**
   * Standard search for general queries
   */
  async search(request: LinkupSearchRequest): Promise<LinkupResponse> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          depth: request.depth || 'standard',
          output_type: request.outputType || 'sourcedAnswer'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Linkup API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime
      
      // Transform sources to results format for consistency
      const results: LinkupSearchResult[] = data.sources?.map((source: LinkupSource, index: number) => ({
        title: source.name,
        url: source.url,
        content: source.snippet,
        snippet: source.snippet,
        domain: new URL(source.url).hostname,
        score: (data.sources.length - index) / data.sources.length // Position-based scoring
      })) || []
      
      return {
        answer: data.answer,
        sources: data.sources,
        results,
        query: request.query,
        searchDepth: request.depth || 'standard',
        processingTime
      }
    } catch (error) {
      console.error('Linkup search error:', error)
      throw new Error(`Failed to search with Linkup: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Deep search for comprehensive research
   */
  async deepSearch(query: string, outputType?: 'sourcedAnswer' | 'searchResults'): Promise<LinkupResponse> {
    return this.search({
      query,
      depth: 'deep',
      outputType: outputType || 'sourcedAnswer'
    })
  }

  /**
   * Job-specific search
   */
  async searchJobs(query: string, location?: string): Promise<LinkupResponse> {
    const jobQuery = location ? `${query} jobs in ${location}` : `${query} jobs`
    
    return this.search({
      query: jobQuery,
      depth: 'deep',
      outputType: 'sourcedAnswer'
    })
  }

  /**
   * Company research with business intelligence focus
   */
  async searchCompany(companyName: string, focus?: 'general' | 'news' | 'careers' | 'financial'): Promise<LinkupResponse> {
    let query = companyName

    switch (focus) {
      case 'news':
        query = `${companyName} latest news updates 2024`
        break
      case 'careers':
        query = `${companyName} careers jobs hiring current openings`
        break
      case 'financial':
        query = `${companyName} financial results revenue funding 2024`
        break
      default:
        query = `${companyName} company overview business model`
    }

    return this.search({
      query,
      depth: 'deep',
      outputType: 'sourcedAnswer'
    })
  }

  /**
   * Salary research for specific roles/companies
   */
  async searchSalary(role: string, company?: string, location?: string): Promise<LinkupResponse> {
    let query = `${role} salary 2024`
    if (company) query += ` at ${company}`
    if (location) query += ` in ${location}`

    return this.search({
      query,
      depth: 'standard',
      outputType: 'sourcedAnswer'
    })
  }

  /**
   * Test connection and API key validity
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.search({
        query: 'test query',
        depth: 'standard'
      })
      return (result.results?.length ?? 0) >= 0 // Even 0 results means API is working
    } catch (error) {
      console.error('Linkup connection test failed:', error)
      return false
    }
  }
}

export const linkupClient = new LinkupClient()