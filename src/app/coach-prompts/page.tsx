'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { defaultCoachPrompts, CoachPrompts } from '@/lib/prompts/quest-coach-prompts'

export default function CoachPromptsPage() {
  const [prompts, setPrompts] = useState<CoachPrompts>(defaultCoachPrompts)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load saved prompts from localStorage
  useEffect(() => {
    const savedPrompts = localStorage.getItem('questCoachPrompts')
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts))
      } catch (e) {
        console.error('Error loading saved prompts:', e)
      }
    }
  }, [])

  const handleSave = () => {
    setLoading(true)
    localStorage.setItem('questCoachPrompts', JSON.stringify(prompts))
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setLoading(false)
    }, 2000)
  }

  const handleReset = () => {
    setPrompts(defaultCoachPrompts)
    localStorage.removeItem('questCoachPrompts')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updatePrompt = (key: keyof CoachPrompts, value: string) => {
    setPrompts(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quest Coach Prompt Configuration</h1>
        <p className="text-muted-foreground">
          Customize how Quest responds and handles conversations
        </p>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Prompt Editor</CardTitle>
          <CardDescription>
            Edit the prompts that control Quest's personality and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="interruption">Interruption</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="personality">Personality</TabsTrigger>
            </TabsList>

            <TabsContent value="system" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">System Prompt</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The core instructions that define Quest's role and capabilities
                </p>
                <Textarea
                  value={prompts.systemPrompt}
                  onChange={(e) => updatePrompt('systemPrompt', e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                  placeholder="Enter system prompt..."
                />
              </div>
            </TabsContent>

            <TabsContent value="interruption" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Interruption Handling</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  How Quest should handle when users interrupt mid-response
                </p>
                <div className="mb-2">
                  <Badge variant="outline" className="mb-2">Critical for Natural Conversation</Badge>
                </div>
                <Textarea
                  value={prompts.interruptionHandling}
                  onChange={(e) => updatePrompt('interruptionHandling', e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Enter interruption handling rules..."
                />
              </div>
            </TabsContent>

            <TabsContent value="conversation" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Conversation Rules</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Guidelines for how Quest structures conversations
                </p>
                <Textarea
                  value={prompts.conversationRules}
                  onChange={(e) => updatePrompt('conversationRules', e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="Enter conversation rules..."
                />
              </div>
            </TabsContent>

            <TabsContent value="personality" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Personality Traits</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The tone and personality characteristics of Quest
                </p>
                <Textarea
                  value={prompts.personalityTraits}
                  onChange={(e) => updatePrompt('personalityTraits', e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Enter personality traits..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : (saved ? '✅ Saved!' : 'Save Changes')}
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Interruption Handling Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Behavior:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>User speaks while AI is talking</li>
              <li>AI immediately stops speaking ✅</li>
              <li>AI should acknowledge the interruption</li>
              <li>AI responds to the new input (not resume previous)</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Key Settings for Natural Interruptions:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Short responses that are easier to interrupt</li>
              <li>Natural acknowledgment phrases</li>
              <li>Never resuming incomplete thoughts</li>
              <li>Treating interruptions as conversational turns</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Example Interruption Flow:</h4>
            <div className="text-sm space-y-2">
              <p><strong>AI:</strong> "Let me tell you about three strategies for career growth. First, you should focus on—"</p>
              <p><strong>User:</strong> "Actually, wait, I have a specific question"</p>
              <p><strong>AI:</strong> "Of course! What's your question?"</p>
              <p className="text-muted-foreground">(AI does not continue with the three strategies)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}