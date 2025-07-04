'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Brain,
  Users,
  Settings
} from 'lucide-react'
import Navigation from '@/components/Navigation'

interface SetupStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'error'
  endpoint: string
}

export default function SetupPage() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'prompts',
      name: 'Initialize Coaching Prompts',
      description: 'Set up base coaching prompts and database tables',
      status: 'pending',
      endpoint: '/api/admin/init-prompts'
    },
    {
      id: 'relationship_prompts',
      name: 'Initialize Relationship Prompts',
      description: 'Set up relationship-aware coaching prompts',
      status: 'pending',
      endpoint: '/api/admin/init-relationship-prompts'
    }
  ])

  const runStep = async (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status: 'running' } : step
    ))

    try {
      const step = steps.find(s => s.id === stepId)
      if (!step) return

      const response = await fetch(step.endpoint, { method: 'POST' })
      const result = await response.json()

      if (result.success) {
        setSteps(prev => prev.map(s => 
          s.id === stepId ? { ...s, status: 'completed' } : s
        ))
      } else {
        setSteps(prev => prev.map(s => 
          s.id === stepId ? { ...s, status: 'error' } : s
        ))
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      setSteps(prev => prev.map(s => 
        s.id === stepId ? { ...s, status: 'error' } : s
      ))
      alert(`Failed to run step: ${error}`)
    }
  }

  const runAllSteps = async () => {
    for (const step of steps) {
      if (step.status !== 'completed') {
        await runStep(step.id)
        // Wait a bit between steps
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Database className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Complete</Badge>
      case 'running':
        return <Badge variant="default" className="bg-blue-600">Running</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const allCompleted = steps.every(step => step.status === 'completed')
  const anyRunning = steps.some(step => step.status === 'running')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Enhanced Quest Setup</h1>
          <p className="text-gray-600 mt-2">
            Initialize the multi-agent coaching system database and prompts
          </p>
        </div>

        {/* Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}
                  />
                </div>
              </div>
              
              {allCompleted ? (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-600">Setup Complete!</p>
                </div>
              ) : (
                <Button 
                  onClick={runAllSteps}
                  disabled={anyRunning}
                  className="bg-blue-600"
                >
                  {anyRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run All Steps'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <Card key={step.id} className={step.status === 'completed' ? 'border-green-200 bg-green-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStepIcon(step.status)}
                    <div>
                      <h3 className="font-medium">{step.name}</h3>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStepBadge(step.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runStep(step.id)}
                      disabled={step.status === 'running' || step.status === 'completed'}
                    >
                      {step.status === 'completed' ? 'Done' : 'Run'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Steps */}
        {allCompleted && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users className="h-5 w-5" />
                Ready to Test!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                Your Enhanced Quest system is now ready. You can test both versions to see the difference.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" asChild>
                  <a href="/quest/comparison">
                    View Comparison
                  </a>
                </Button>
                <Button asChild className="bg-blue-600">
                  <a href="/quest/enhanced">
                    <Brain className="mr-2 h-4 w-4" />
                    Test Enhanced Quest
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}