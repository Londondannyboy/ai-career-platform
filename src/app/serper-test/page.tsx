'use client'

/**
 * Simple Serper.dev Test Page
 * Get Serper working first, then add complexity
 */

import { useState } from 'react'

interface SerperResult {
  title: string
  url: string
  snippet: string
  domain: string
  score: number
  position: number
}

export default function SerperTestPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SerperResult[]>([])
  const [metadata, setMetadata] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setResults([])
    setMetadata(null)

    try {
      const response = await fetch('/api/serper-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          type: 'search'
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])
      setMetadata(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Serper.dev Test
          </h1>
          <p className="text-gray-600 mb-6">
            Simple test of Serper.dev Google search API
          </p>

          {/* Search Form */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
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
                  <div><strong>Results:</strong> {metadata.totalResults}</div>
                  <div><strong>Time:</strong> {metadata.processingTime}ms</div>
                  <div><strong>Query:</strong> {metadata.query}</div>
                </div>
              </div>
            </div>
          )}

          {/* Knowledge Graph */}
          {metadata?.knowledgeGraph && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Graph:</h3>
              <div className="bg-blue-50 p-4 rounded border">
                <h4 className="font-semibold">{metadata.knowledgeGraph.title}</h4>
                <p className="text-sm text-gray-600">{metadata.knowledgeGraph.type}</p>
                <p className="mt-2">{metadata.knowledgeGraph.description}</p>
              </div>
            </div>
          )}

          {/* Answer Box */}
          {metadata?.answerBox && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Answer:</h3>
              <div className="bg-green-50 p-4 rounded border">
                <p><strong>{metadata.answerBox.title}</strong></p>
                <p>{metadata.answerBox.answer}</p>
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
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          Serper
                        </span>
                        <span>#{result.position}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{result.snippet}</p>
                    <div className="text-sm text-gray-500">
                      <span>{result.domain}</span>
                      <span className="ml-4">Score: {result.score.toFixed(2)}</span>
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