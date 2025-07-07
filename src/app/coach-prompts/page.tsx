'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { defaultCoachPrompts, CoachPrompts, goalMethodologies, coachingStyles } from '@/lib/prompts/quest-coach-prompts'

export default function CoachPromptsPage() {
  const [prompts, setPrompts] = useState<CoachPrompts>(defaultCoachPrompts)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMethodology, setSelectedMethodology] = useState<string>('smart')
  const [selectedCoachingStyle, setSelectedCoachingStyle] = useState<string>('collaborative')

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

  const selectMethodology = (methodologyKey: string) => {
    setSelectedMethodology(methodologyKey)
    const methodology = goalMethodologies[methodologyKey as keyof typeof goalMethodologies]
    if (methodology) {
      updatePrompt('goalSettingMethodology', methodology.prompt)
    }
  }

  const selectCoachingStyle = (styleKey: string) => {
    setSelectedCoachingStyle(styleKey)
    const style = coachingStyles[styleKey as keyof typeof coachingStyles]
    if (style) {
      updatePrompt('coachingStyle', style.prompt)
    }
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
          <Tabs defaultValue="methodology" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="methodology">Goals</TabsTrigger>
              <TabsTrigger value="coaching">Style</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="interruption">Interruption</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="personality">Personality</TabsTrigger>
            </TabsList>

            <TabsContent value="methodology" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Goal-Setting Methodology</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how Quest approaches goal-setting and achievement frameworks
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Methodology:</label>
                    <Select value={selectedMethodology} onValueChange={selectMethodology}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a goal-setting methodology" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(goalMethodologies).map(([key, methodology]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span className="font-medium">{methodology.name}</span>
                              <span className="text-xs text-muted-foreground">{methodology.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Goal Framework:</label>
                    <Textarea
                      value={prompts.goalSettingMethodology}
                      onChange={(e) => updatePrompt('goalSettingMethodology', e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="Enter custom goal-setting methodology..."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="coaching" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Coaching Style</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Define how Quest interacts and guides users through conversations
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Coaching Style:</label>
                    <Select value={selectedCoachingStyle} onValueChange={selectCoachingStyle}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a coaching style" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(coachingStyles).map(([key, style]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span className="font-medium">{style.name}</span>
                              <span className="text-xs text-muted-foreground">{style.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Coaching Approach:</label>
                    <Textarea
                      value={prompts.coachingStyle}
                      onChange={(e) => updatePrompt('coachingStyle', e.target.value)}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder="Enter custom coaching style..."
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Goal-Setting Methodologies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">SMART Goals:</h4>
              <p className="text-sm">Perfect for clear, actionable career objectives with specific deadlines and measurable outcomes.</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">OKRs (Objectives & Key Results):</h4>
              <p className="text-sm">Great for ambitious, high-level career objectives with measurable key results. Encourages stretch goals.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Getting Things Done (GTD):</h4>
              <p className="text-sm">Ideal for task-oriented professionals who want to capture and organize all career-related actions.</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Career Ladder Progression:</h4>
              <p className="text-sm">Focused on specific skills and milestones needed for promotion and career advancement.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coaching Styles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Collaborative:</h4>
              <p className="text-sm">Partners with you to discover solutions together. Uses questions to guide your thinking.</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Directive:</h4>
              <p className="text-sm">Provides clear guidance and actionable advice. More prescriptive and structured approach.</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Supportive:</h4>
              <p className="text-sm">Emphasizes encouragement and emotional support. Builds confidence through positive reinforcement.</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Socratic:</h4>
              <p className="text-sm">Uses primarily questions to help you think through problems systematically and discover insights.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Voice Interruption Handling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">✅ Working Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Voice interruption stops AI immediately</li>
              <li>AI acknowledges interruption naturally</li>
              <li>AI responds to new input (doesn't resume previous)</li>
              <li>Customizable prompt handling for different scenarios</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Example Conversation Flow:</h4>
            <div className="text-sm space-y-2">
              <p><strong>AI:</strong> "Let me share three career strategies. First, you should focus on—"</p>
              <p><strong>User:</strong> "Actually, I want to set some goals"</p>
              <p><strong>AI:</strong> "Absolutely! I'd love to help you with goal setting. What area of your career would you like to focus on?"</p>
              <p className="text-muted-foreground italic">(Notice: AI doesn't continue with the three strategies)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}