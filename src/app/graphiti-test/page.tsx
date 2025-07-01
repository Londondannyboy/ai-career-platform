'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { Clock, Brain, Search, Database, Check, AlertCircle, Loader2 } from 'lucide-react'

export default function GraphitiTestPage() {
  const [initStatus, setInitStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState('')
  const [userId] = useState('test-user-' + Math.random().toString(36).substr(2, 9))

  const initializeGraphiti = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/graphiti/init', { method: 'POST' })
      const data = await res.json()
      setInitStatus(data)
    } catch (error) {
      setInitStatus({ error: 'Failed to initialize Graphiti' })
    } finally {
      setLoading(false)
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/graphiti/init')
      const data = await res.json()
      setInitStatus(data)
    } catch (error) {
      setInitStatus({ error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const performTemporalSearch = async () => {
    if (!query.trim()) return
    
    setSearching(true)
    setSearchResult('')
    
    try {
      const res = await fetch('/api/temporal-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId })
      })
      
      if (!res.body) throw new Error('No response body')
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        setSearchResult(prev => prev + chunk)
      }
    } catch (error) {
      setSearchResult('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSearching(false)
    }
  }

  const exampleQueries = [
    "What do we know about Philip's current work situation?",
    "Show me the history of CK Delta company",
    "Who has AI and machine learning skills?",
    "What has changed recently about our tracked entities?",
    "Find people similar to Philip based on temporal patterns"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Clock className="h-8 w-8 text-purple-600" />
            Graphiti Temporal Knowledge Graph
          </h1>
          <p className="text-gray-600">
            Test temporal search capabilities with time-aware facts and episodic memory
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Initialization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Graphiti Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={initializeGraphiti} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Initialize'}
                  {!loading && 'Initialize Graphiti'}
                </Button>
                <Button 
                  onClick={checkStatus} 
                  disabled={loading}
                  variant="outline"
                >
                  Status
                </Button>
              </div>
              
              {initStatus && (
                <div className="p-4 rounded-lg bg-gray-50">
                  {initStatus.success || initStatus.initialized ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <Check className="h-4 w-4" />
                        {initStatus.message || 'Graphiti Ready'}
                      </div>
                      
                      {initStatus.features && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {initStatus.features.map((feature: string) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {initStatus.exampleFacts && (
                        <div className="text-xs text-green-700">
                          Created {initStatus.exampleFacts} example temporal facts
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {initStatus.error || 'Initialization failed'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Temporal Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span><strong>Temporal Facts:</strong> Track how data changes over time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-green-500" />
                  <span><strong>Episodic Memory:</strong> Remember past searches and outcomes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-purple-500" />
                  <span><strong>Entity Resolution:</strong> Merge duplicate entities automatically</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-orange-500" />
                  <span><strong>Confidence Decay:</strong> Reduce confidence of old facts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temporal Search */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Temporal Search
              <Badge variant="outline" className="ml-auto">
                User: {userId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask a temporal question..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && performTemporalSearch()}
                disabled={searching}
              />
              <Button 
                onClick={performTemporalSearch}
                disabled={searching || !query.trim()}
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {/* Example Queries */}
            <div>
              <div className="text-sm font-medium mb-2">Example Queries:</div>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                    disabled={searching}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            {/* Search Results */}
            {(searchResult || searching) && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 border">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing temporal search...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Temporal Search Results
                    </>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap text-gray-700">
                  {searchResult}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="font-medium text-purple-900 mb-2">About Graphiti Integration</h3>
          <p className="text-sm text-purple-800">
            This implementation brings Cole Medin's temporal knowledge graph architecture to Quest. 
            Graphiti tracks facts over time, builds episodic memory of searches, and provides 
            time-aware context for intelligent responses. Each search creates an episode that 
            contributes to the system's growing temporal understanding.
          </p>
        </div>
      </div>
    </div>
  )
}