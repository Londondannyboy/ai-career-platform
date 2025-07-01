/**
 * Quest - Serper.dev Fast Search Client
 * Lightning-fast web search for speed-critical queries
 */

export interface SerperSearchRequest {
  query: string
  type?: 'search' | 'news' | 'images' | 'videos' | 'places' | 'shopping'
  location?: string
  num?: number
  page?: number
  domain?: string[]
}

export interface SerperSearchResult {
  title: string
  link: string
  snippet: string
  position: number
  date?: string
  source?: string
}

export interface SerperResponse {
  searchParameters: {
    q: string
    type: string
    engine: string
  }
  organic: SerperSearchResult[]
  answerBox?: {
    answer: string
    title: string
    link: string
  }
  knowledgeGraph?: {
    title: string
    type: string
    description: string
    descriptionSource: string
    imageUrl: string
    attributes: Record<string, string>
  }
  searchInformation: {
    totalResults: string
    timeTaken: number
    formattedTotalResults: string
    formattedTimeTaken: string
  }
}

export class SerperClient {
  private apiKey: string
  private baseUrl = 'https://google.serper.dev'

  constructor(apiKey?: string) {
    // Use provided test key for now, fallback to env
    this.apiKey = apiKey || '283930ae73689a0190bec03233e3178be7ce3c82' || process.env.SERPER_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('Serper API key is required. Set SERPER_API_KEY environment variable.')
    }
  }

  /**
   * Fast general search
   */
  async search(request: SerperSearchRequest): Promise<SerperResponse> {
    try {
      const endpoint = request.type === 'search' ? '/search' : `/${request.type || 'search'}`
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: request.query,
          ...(request.location && { gl: request.location }),
          ...(request.num && { num: request.num }),
          ...(request.page && { page: request.page }),
          ...(request.domain && { site: request.domain.join(' OR site:') })
        })
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status} - ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Serper search error:', error)
      throw new Error(`Failed to search with Serper: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Quick job search
   */
  async searchJobs(query: string, location?: string): Promise<SerperResponse> {
    const jobQuery = location ? `${query} jobs ${location}` : `${query} jobs`
    
    return this.search({
      query: jobQuery,
      type: 'search',
      num: 10,
      ...(location && { location })
    })
  }

  /**
   * Fast company news search
   */
  async searchCompanyNews(companyName: string): Promise<SerperResponse> {
    return this.search({
      query: `${companyName} news`,
      type: 'news',
      num: 8
    })
  }

  /**
   * Quick salary lookup
   */
  async searchSalary(role: string, location?: string): Promise<SerperResponse> {
    const salaryQuery = location ? `${role} salary ${location}` : `${role} salary`
    
    return this.search({
      query: salaryQuery,
      type: 'search',
      num: 5
    })
  }

  /**
   * Fast people search
   */
  async searchPerson(name: string, company?: string): Promise<SerperResponse> {
    const personQuery = company ? `${name} ${company}` : name
    
    return this.search({
      query: personQuery,
      type: 'search',
      num: 8
    })
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.search({
        query: 'test',
        num: 1
      })
      return result.organic?.length >= 0
    } catch (error) {
      console.error('Serper connection test failed:', error)
      return false
    }
  }
}

export const serperClient = new SerperClient()