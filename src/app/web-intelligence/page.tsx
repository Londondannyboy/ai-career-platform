'use client'

/**
 * Quest - Web Intelligence Testing Interface
 * Test Linkup.so and Serper.dev integrations with live results
 */

import { useState } from 'react'

interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  score: number
  provider: string
}

interface HealthStatus {
  status: string
  providers: {
    linkup: { status: string; details?: any }
    serper: { status: string; details?: any }
  }
  capabilities: any
}

export default function WebIntelligencePage() {
  const [query, setQuery] = useState('')
  const [intent, setIntent] = useState('general')
  const [urgency, setUrgency] = useState('balanced')
  const [location, setLocation] = useState('')
  const [company, setCompany] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [answer, setAnswer] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [streamingResults, setStreamingResults] = useState('')

  const searchIntents = [
    { value: 'general', label: 'General Search' },
    { value: 'job_search', label: 'Job Search' },
    { value: 'company_research', label: 'Company Research' },
    { value: 'salary_research', label: 'Salary Research' },
    { value: 'person_lookup', label: 'Person Lookup' },
    { value: 'news', label: 'News Search' }
  ]

  const urgencyLevels = [
    { value: 'fast', label: 'Fast (Serper)' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'comprehensive', label: 'Comprehensive (Linkup)' }
  ]

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setResults([])
    setAnswer('')
    setMetadata(null)

    try {
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          intent,
          urgency,
          location: location.trim() || undefined,
          company: company.trim() || undefined,
          maxResults: 10
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])
      setAnswer(data.answer || '')
      setMetadata(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStreamingSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setStreamingResults('')
    setResults([])

    try {
      const response = await fetch('/api/web-search/streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          intent,
          urgency,
          location: location.trim() || undefined,
          company: company.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error(`Streaming search failed: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        let currentAnswer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'answer_chunk') {
                  currentAnswer = data.content
                  setStreamingResults(currentAnswer)
                } else if (data.type === 'sources') {
                  setResults(data.sources || [])
                } else if (data.type === 'metadata') {
                  setMetadata(data)
                }
              } catch (e) {
                // Ignore JSON parse errors in streaming
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Streaming search failed')
    } finally {
      setLoading(false)
    }
  }

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/web-search/health')
      const data = await response.json()
      setHealthStatus(data)
    } catch (err) {
      setError('Health check failed')
    }
  }

  const handleJobSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/web-search/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim() || undefined,
          urgency
        })
      })

      const data = await response.json()
      
      // Transform job results to match our results format
      const jobResults = data.jobs?.map((job: any) => ({
        title: job.title,
        url: job.url,
        snippet: job.description,
        domain: job.source,
        score: job.score,
        provider: job.provider,
        metadata: { company: job.company, location: job.location }
      })) || []
      
      setResults(jobResults)
      setMetadata(data.searchMetadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCompanyResearch = async () => {
    if (!company.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/web-search/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          focus: 'overview'
        })
      })

      const data = await response.json()
      setResults(data.sources || [])
      setAnswer(JSON.stringify(data.insights, null, 2))
      setMetadata(data.intelligence)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Company research failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quest Web Intelligence
          </h1>
          <p className="text-gray-600 mb-6">
            Test Linkup.so (SOTA 91% accuracy) and Serper.dev integrations with intelligent routing
          </p>

          {/* Health Check */}
          <div className="mb-6">
            <button
              onClick={checkHealth}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Check Provider Health
            </button>
            
            {healthStatus && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">System Status: {healthStatus.status}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      healthStatus.providers.linkup.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    Linkup.so: {healthStatus.providers.linkup.status}
                  </div>
                  <div>
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      healthStatus.providers.serper.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    Serper.dev: {healthStatus.providers.serper.status}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Intent
              </label>
              <select
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {searchIntents.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {urgencyLevels.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (optional)
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., OpenAI, Google"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Standard Search'}
            </button>

            <button
              onClick={handleStreamingSearch}
              disabled={loading || !query.trim()}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Streaming Search
            </button>

            <button
              onClick={handleJobSearch}
              disabled={loading || !query.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Job Search
            </button>

            <button
              onClick={handleCompanyResearch}
              disabled={loading || !company.trim()}
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Company Research
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Streaming Results */}
          {streamingResults && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Answer Stream:</h3>
              <div className="bg-blue-50 p-4 rounded border">
                {streamingResults}
              </div>
            </div>
          )}

          {/* Answer Display */}
          {answer && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Synthesized Answer:</h3>
              <div className="bg-green-50 p-4 rounded border">
                <pre className="whitespace-pre-wrap">{answer}</pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {metadata && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Metadata:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><strong>Provider:</strong> {metadata.provider}</div>
                  <div><strong>Strategy:</strong> {metadata.strategy}</div>
                  <div><strong>Time:</strong> {metadata.processingTime}ms</div>
                  <div><strong>Results:</strong> {metadata.totalResults}</div>
                  <div><strong>Confidence:</strong> {metadata.confidence}</div>
                  <div><strong>Intent:</strong> {metadata.intent}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results ({results.length})
              </h3>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800">
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          {result.title}
                        </a>
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.provider === 'linkup' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {result.provider}
                        </span>
                        <span>Score: {result.score.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{result.snippet}</p>
                    <div className="text-sm text-gray-500">
                      <span>{result.domain}</span>
                      {(result as any).metadata?.company && (
                        <span className="ml-4">Company: {(result as any).metadata.company}</span>
                      )}
                      {(result as any).metadata?.location && (
                        <span className="ml-4">Location: {(result as any).metadata.location}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}