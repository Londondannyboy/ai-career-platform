export class TavilySearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TAVILY_API_KEY not found in environment variables');
    }
  }

  async search(query: string, options?: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
  }) {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: options?.searchDepth || 'basic',
        max_results: options?.maxResults || 5,
        include_domains: options?.includeDomains,
        exclude_domains: options?.excludeDomains,
        include_raw_content: false
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}