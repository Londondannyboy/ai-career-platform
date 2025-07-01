'use client'

/**
 * Quest Unified Search Interface
 * Intelligent web search with automatic provider routing
 */

import { useState } from 'react'

interface QuestResult {
  title: string
  url: string
  snippet: string
  domain: string
  score: number
  provider: string
  publishedDate?: string
}

interface QuestResponse {
  query: string
  provider: string
  strategy: string
  confidence: number
  answer?: string
  results: QuestResult[]
  followUpQuestions?: string[]
  processingTime: number
  reasoning: string
  questMetadata: any
}

export default function QuestSearchPage() {
  const [query, setQuery] = useState('')
  const [urgency, setUrgency] = useState('balanced')
  const [response, setResponse] = useState<QuestResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showStrategy, setShowStrategy] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setError('')
    setResponse(null)

    try {
      const res = await fetch('/api/quest-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          urgency: urgency,
          userId: 'demo-user'
        })
      })

      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`)
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'serper': return 'bg-green-100 text-green-800'
      case 'linkup': return 'bg-blue-100 text-blue-800'
      case 'tavily': return 'bg-purple-100 text-purple-800'
      case 'hybrid': return 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'serper': return '⚡'
      case 'linkup': return '🧠'
      case 'tavily': return '📰'
      case 'hybrid': return '🔄'
      default: return '🔍'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎯 Quest Unified Search
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Intelligent web search with automatic provider routing
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">⚡ Serper - Fast</span>
            <span className="flex items-center">🧠 Linkup - AI Analysis</span>
            <span className="flex items-center">📰 Tavily - Research</span>
            <span className="flex items-center">🔄 Hybrid - Combined</span>
          </div>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Quest anything... (e.g., 'Compare Microsoft vs Amazon', 'Latest OpenAI news')"
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fast">⚡ Fast</option>
              <option value="balanced">⚖️ Balanced</option>
              <option value="comprehensive">🔬 Comprehensive</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold transition-all"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Loading State with Provider Selection */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="text-lg text-gray-600 mb-4">
                  🤖 Quest AI is analyzing your query...
                </div>
                <div className="text-sm text-gray-500">
                  Selecting optimal search provider based on intent
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {response && (
          <div className="space-y-6">
            {/* Strategy Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getProviderIcon(response.provider)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Search Strategy
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getProviderColor(response.provider)}`}>
                      {response.provider.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowStrategy(!showStrategy)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {showStrategy ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Confidence:</strong> {(response.confidence * 100).toFixed(0)}%</div>
                <div><strong>Time:</strong> {response.processingTime}ms</div>
                <div><strong>Results:</strong> {response.results.length}</div>
                <div><strong>Provider:</strong> {response.provider}</div>
              </div>

              {showStrategy && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Reasoning:</strong> {response.reasoning}
                  </p>
                </div>
              )}
            </div>

            {/* AI Answer */}
            {response.answer && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  🤖 AI-Synthesized Answer
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border-l-4 border-blue-500">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {response.answer}
                  </p>
                </div>
              </div>
            )}

            {/* Follow-up Questions */}
            {response.followUpQuestions && response.followUpQuestions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💡 Follow-up Questions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {response.followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(question)
                        handleSearch()
                      }}
                      className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-blue-800 text-sm transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {response.results.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  🔍 Search Results ({response.results.length})
                </h3>
                <div className="space-y-4">
                  {response.results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800 flex-1 mr-4">
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            {result.title}
                          </a>
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded text-xs ${getProviderColor(result.provider)}`}>
                            {getProviderIcon(result.provider)} {result.provider}
                          </span>
                          <span>Score: {result.score.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2 leading-relaxed">{result.snippet}</p>
                      <div className="text-sm text-gray-500 flex items-center space-x-4">
                        <span>🌐 {result.domain}</span>
                        {result.publishedDate && (
                          <span>📅 {result.publishedDate}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}