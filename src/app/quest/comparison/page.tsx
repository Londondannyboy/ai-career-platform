'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRight, 
  Users, 
  Brain, 
  Target, 
  Sparkles,
  Zap,
  MessageCircle,
  Settings,
  CheckCircle
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import Link from 'next/link'

const FeatureComparison = () => {
  const originalFeatures = [
    { name: 'Single AI Coach', icon: <MessageCircle className="h-4 w-4" />, description: 'One coaching personality' },
    { name: 'Basic Playbook Detection', icon: <Target className="h-4 w-4" />, description: 'Simple keyword matching' },
    { name: 'Static Responses', icon: <Brain className="h-4 w-4" />, description: 'Fixed coaching approach' },
    { name: 'Hume AI Voice', icon: <Zap className="h-4 w-4" />, description: 'Emotional intelligence' },
    { name: 'Basic Session Saving', icon: <CheckCircle className="h-4 w-4" />, description: 'Simple conversation logs' }
  ]

  const enhancedFeatures = [
    { name: 'Multi-Agent Coaching Team', icon: <Users className="h-4 w-4" />, description: '10+ specialized coaches working together' },
    { name: 'User-Controlled Weighting', icon: <Settings className="h-4 w-4" />, description: 'Real-time coaching focus adjustment' },
    { name: 'Vectorized Prompt Management', icon: <Brain className="h-4 w-4" />, description: 'AI-powered semantic prompt selection' },
    { name: 'Synthetic Coach Collaboration', icon: <Sparkles className="h-4 w-4" />, description: '"Let me bring in our productivity coach..."' },
    { name: 'Relationship-Aware Coaching', icon: <Target className="h-4 w-4" />, description: 'Adapts to upward/peer/downward dynamics' },
    { name: 'Intelligent Interventions', icon: <Zap className="h-4 w-4" />, description: 'Automatic specialist coach calling' },
    { name: 'Visual Coach Presence', icon: <MessageCircle className="h-4 w-4" />, description: 'See who\'s active, listening, speaking' },
    { name: 'Context-Aware Blending', icon: <CheckCircle className="h-4 w-4" />, description: 'Dynamic coaching style adaptation' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Original System */}
      <Card className="border-gray-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-gray-600" />
            Original Quest (v4.0)
          </CardTitle>
          <p className="text-sm text-gray-600">Single-agent coaching system</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {originalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="text-gray-600 mt-0.5">{feature.icon}</div>
                <div>
                  <div className="font-medium text-sm">{feature.name}</div>
                  <div className="text-xs text-gray-600">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/quest/original">
              <Button variant="outline" className="w-full">
                Test Original Quest
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced System */}
      <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Enhanced Quest (v5.0)
            <Badge variant="default" className="bg-blue-600">Revolutionary</Badge>
          </CardTitle>
          <p className="text-sm text-blue-700">Multi-agent coaching ecosystem</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enhancedFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
                <div className="text-blue-600 mt-0.5">{feature.icon}</div>
                <div>
                  <div className="font-medium text-sm">{feature.name}</div>
                  <div className="text-xs text-blue-700">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/quest/enhanced">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                Test Enhanced Quest
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function QuestComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Quest Evolution Comparison
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the revolutionary difference between single-agent and multi-agent coaching systems
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>v4.0 Single Agent</span>
            <ArrowRight className="h-4 w-4" />
            <span className="text-blue-600 font-medium">v5.0 Multi-Agent Ecosystem</span>
          </div>
        </div>

        <Tabs defaultValue="comparison" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
            <TabsTrigger value="scenarios">Coaching Scenarios</TabsTrigger>
            <TabsTrigger value="architecture">Technical Architecture</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison">
            <FeatureComparison />
          </TabsContent>

          <TabsContent value="scenarios">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Original Quest Scenario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">
                        "I'm struggling with my marketing campaign and feeling overwhelmed."
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <p className="font-medium text-sm mb-2">Single Coach Response:</p>
                      <p className="text-sm text-gray-700">
                        "I understand you're feeling overwhelmed with your marketing campaign. 
                        Let's break down the challenges and create a step-by-step plan to move forward..."
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Enhanced Quest Scenario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">
                        "I'm struggling with my marketing campaign and feeling overwhelmed."
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                      <p className="font-medium text-sm mb-2">Multi-Agent Team Response:</p>
                      <div className="space-y-3 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium text-blue-600">Marketing Coach:</span> "I can help you with campaign strategy. Let me first understand your specific challenges..."
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium text-purple-600">System Detection:</span> <em>Stress patterns detected</em>
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium text-green-600">Marketing Coach:</span> "I'm sensing some overwhelm here. Let me bring in our stress management specialist..."
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium text-rose-600">Stress Coach:</span> "Hi! I've been listening. Let's first address the overwhelm with some quick techniques, then tackle the campaign strategically..."
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="architecture">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Original Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="h-8 w-8 text-gray-600" />
                      </div>
                      <p className="text-sm font-medium">Single AI Coach</p>
                      <p className="text-xs text-gray-600">Static prompts, basic detection</p>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Technical Stack:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Hume AI EVI for voice</li>
                        <li>• Basic keyword matching</li>
                        <li>• Fixed system prompts</li>
                        <li>• Simple conversation flow</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['Marketing', 'Productivity', 'Communication'].map((coach, i) => (
                        <div key={i} className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <p className="text-xs font-medium">{coach}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-sm text-blue-700 font-medium">Multi-Agent Ecosystem</p>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Revolutionary Features:</h4>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Vector-powered prompt selection</li>
                        <li>• Real-time coach collaboration</li>
                        <li>• Intelligent intervention detection</li>
                        <li>• Relationship-aware adaptation</li>
                        <li>• User-controlled coaching weights</li>
                        <li>• Semantic prompt blending</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Test Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center">Ready to Experience the Difference?</CardTitle>
            <p className="text-center text-gray-600">Test both systems and see the revolutionary improvement</p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-6">
              <Link href="/quest/original">
                <Button variant="outline" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Test Original Quest
                </Button>
              </Link>
              <Link href="/quest/enhanced">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Users className="mr-2 h-5 w-5" />
                  Test Enhanced Quest
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}