'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Search, 
  Plus, 
  RefreshCw, 
  Settings,
  Brain,
  Target,
  Users,
  Building
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Prompt {
  id: string
  prompt_type: string
  context_tags: string[]
  name: string
  content: string
  variables: Record<string, string>
  effectiveness_score: number
  usage_count: number
  created_at: string
}

export default function PromptsManagementPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const initializePrompts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/init-prompts', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setInitialized(true)
        alert('Prompts system initialized successfully!')
        loadPrompts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to initialize prompts:', error)
      alert('Failed to initialize prompts system')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/prompts')
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts || [])
        setInitialized(true)
      }
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const testSemanticSearch = async () => {
    const query = prompt('Enter a search query for prompts:')
    if (!query) return

    setLoading(true)
    try {
      const res = await fetch('/api/prompts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      const data = await res.json()
      if (data.results) {
        setPrompts(data.results)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrompts()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'base':
        return <Brain className="h-4 w-4" />
      case 'specialized':
        return <Target className="h-4 w-4" />
      case 'relationship':
        return <Users className="h-4 w-4" />
      case 'company':
        return <Building className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const filteredPrompts = prompts.filter(prompt => {
    const matchesType = selectedType === 'all' || prompt.prompt_type === selectedType
    const matchesSearch = searchQuery === '' || 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.context_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesType && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Prompt Management System</h1>
          <p className="text-gray-600 mt-2">
            Manage vectorized coaching prompts with semantic search
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            {!initialized && (
              <Button onClick={initializePrompts} disabled={loading}>
                <Database className="mr-2 h-4 w-4" />
                Initialize Database
              </Button>
            )}
            <Button onClick={loadPrompts} variant="outline" disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={testSemanticSearch} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Semantic Search
            </Button>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Prompt
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search prompts..."
              className="px-4 py-2 border rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs for filtering by type */}
        <Tabs defaultValue="all" value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="all">All Prompts</TabsTrigger>
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="specialized">Specialized</TabsTrigger>
            <TabsTrigger value="relationship">Relationship</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPrompts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No prompts found</p>
                  {!initialized && (
                    <p className="text-sm text-gray-400 mt-2">
                      Initialize the database to create default prompts
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPrompts.map((prompt) => (
                  <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {getTypeIcon(prompt.prompt_type)}
                            {prompt.name}
                          </CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{prompt.prompt_type}</Badge>
                            {prompt.context_tags.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Effectiveness: {(prompt.effectiveness_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            Used {prompt.usage_count} times
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Content Preview:</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {prompt.content.substring(0, 200)}...
                          </p>
                        </div>
                        
                        {Object.keys(prompt.variables).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Variables:</h4>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(prompt.variables).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-gray-500">
                            Created: {new Date(prompt.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            <Button size="sm" variant="outline">Test</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Stats Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Prompt Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{prompts.length}</div>
                <div className="text-sm text-gray-600">Total Prompts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {prompts.filter(p => p.prompt_type === 'base').length}
                </div>
                <div className="text-sm text-gray-600">Base Prompts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {prompts.filter(p => p.prompt_type === 'specialized').length}
                </div>
                <div className="text-sm text-gray-600">Specialized</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {prompts.reduce((sum, p) => sum + p.usage_count, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}