'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { Search, Sparkles, Network, Database } from 'lucide-react'

export default function AgentSearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<string | null>(null)
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)

  const checkStrategy = async () => {
    if (!query) return
    
    try {
      const res = await fetch(`/api/agent/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setStrategy(data.strategy)
    } catch (error) {
      console.error('Strategy check failed:', error)
    }
  }

  const performSearch = async () => {
    if (!query) return
    
    setLoading(true)
    setResponse('')
    setStreaming(true)
    
    try {
      const res = await fetch('/api/agent/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      if (!res.ok) throw new Error('Search failed')
      
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          setResponse(prev => prev + chunk)
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      setResponse('Error: Failed to process search query')
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const exampleQueries = [
    { text: "Find CTOs at AI companies in our network", type: "hybrid" },
    { text: "Who can introduce me to Philip at CK Delta?", type: "graph" },
    { text: "Companies similar to OpenAI", type: "vector" },
    { text: "Decision makers for enterprise software at CK Delta", type: "hybrid" },
    { text: "Philip's career progression over time", type: "graph" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            Quest Agent Search
          </h1>
          <p className="text-gray-600">
            Intelligent search that automatically chooses the best strategy for your query
          </p>
        </div>

        {/* Search Input */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask anything about companies, people, or relationships..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setStrategy(null)
                  }}
                  onBlur={checkStrategy}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                />
                <Button 
                  onClick={performSearch} 
                  disabled={loading || !query}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              {/* Strategy Indicator */}
              {strategy && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Search strategy:</span>
                  <Badge 
                    variant={strategy === 'hybrid' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {strategy === 'vector' && <Database className="h-3 w-3" />}
                    {strategy === 'graph' && <Network className="h-3 w-3" />}
                    {strategy === 'hybrid' && (
                      <>
                        <Database className="h-3 w-3" />
                        <span>+</span>
                        <Network className="h-3 w-3" />
                      </>
                    )}
                    {strategy}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {strategy === 'vector' && '(Semantic similarity)'}
                    {strategy === 'graph' && '(Relationships & connections)'}
                    {strategy === 'hybrid' && '(Combined approach)'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Example Queries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Example Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {exampleQueries.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(example.text)
                    setStrategy(example.type)
                  }}
                  className="text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm font-medium">{example.text}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Strategy: {example.type}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response */}
        {(response || streaming) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Response</span>
                {streaming && (
                  <Badge variant="outline" className="animate-pulse">
                    Streaming...
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {response || 'Waiting for response...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How Quest Agent Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <strong>1. Query Analysis:</strong> AI analyzes your query to understand intent
              </div>
              <div>
                <strong>2. Strategy Selection:</strong> Automatically chooses the best search approach:
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• <strong>Vector:</strong> For finding similar content, skills, descriptions</li>
                  <li>• <strong>Graph:</strong> For relationships, connections, org structures</li>
                  <li>• <strong>Hybrid:</strong> For complex queries needing both</li>
                </ul>
              </div>
              <div>
                <strong>3. Intelligent Search:</strong> Searches across both Neon.tech (vectors) and Neo4j (graph)
              </div>
              <div>
                <strong>4. Contextual Response:</strong> Generates answers with source citations
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <strong>💡 Pro Tip:</strong> The agent learns from context and can handle complex multi-part queries. Try asking about relationships between specific people or companies!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}