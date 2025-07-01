'use client'

/**
 * Simple Tavily Test Page
 * Research-grade real-time search following successful pattern
 */

import { useState } from 'react'

interface TavilyResult {
  title: string
  url: string
  snippet: string
  domain: string
  score: number
  publishedDate?: string
}

export default function TavilyTestPage() {
  const [query, setQuery] = useState('')
  const [searchDepth, setSearchDepth] = useState('basic')
  const [results, setResults] = useState<TavilyResult[]>([])
  const [answer, setAnswer] = useState('')
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setResults([])
    setAnswer('')
    setMetadata(null)

    try {
      const response = await fetch('/api/tavily-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          search_depth: searchDepth
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

  const handleDebug = async () => {
    setLoading(true)
    setError('')
    setResults([])
    setAnswer('')
    setMetadata(null)

    try {
      const response = await fetch('/api/tavily-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim() || 'test query'
        })
      })

      const data = await response.json()
      
      // Show debug info in the answer section
      setAnswer(JSON.stringify(data, null, 2))
      setMetadata({ 
        provider: 'debug', 
        query: query.trim() || 'test query',
        debugResponse: data 
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Debug failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tavily Search Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test Tavily research-grade real-time search with AI-optimized responses
          </p>

          {/* Search Form */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <select
                value={searchDepth}
                onChange={(e) => setSearchDepth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="advanced">Advanced</option>
              </select>
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={handleDebug}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Debug
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Metadata */}
          {metadata && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Info:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><strong>Provider:</strong> {metadata.provider}</div>
                  <div><strong>Depth:</strong> {metadata.searchDepth}</div>
                  <div><strong>Results:</strong> {metadata.totalResults}</div>
                  <div><strong>Query:</strong> {metadata.query}</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Answer */}
          {answer && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Research Answer:
              </h3>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>
            </div>
          )}

          {/* Follow-up Questions */}
          {metadata?.followUpQuestions && metadata.followUpQuestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Follow-up Questions:</h3>
              <div className="bg-blue-50 p-4 rounded border">
                <ul className="list-disc list-inside space-y-1">
                  {metadata.followUpQuestions.map((question: string, index: number) => (
                    <li key={index} className="text-blue-800">{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Research Results ({results.length})
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
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          Tavily
                        </span>
                        <span>Score: {result.score.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{result.snippet}</p>
                    <div className="text-sm text-gray-500">
                      <span>{result.domain}</span>
                      {result.publishedDate && (
                        <span className="ml-4">Published: {result.publishedDate}</span>
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