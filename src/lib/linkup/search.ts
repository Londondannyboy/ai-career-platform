export class LinkupSearchService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.LINKUP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('LINKUP_API_KEY not found in environment variables');
    }
  }

  async search(query: string, options?: {
    depth?: 'standard' | 'deep';
    outputType?: 'searchResults' | 'sourcedAnswer';
  }) {
    if (!this.apiKey) {
      throw new Error('Linkup API key not configured');
    }

    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        depth: options?.depth || 'standard',
        outputType: options?.outputType || 'searchResults'
      })
    });

    if (!response.ok) {
      throw new Error(`Linkup API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}