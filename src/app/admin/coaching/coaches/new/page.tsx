'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  TestTube,
  Upload,
  Brain,
  Settings,
  MessageSquare,
  FileText,
  Zap
} from 'lucide-react'

interface CoachFormData {
  name: string
  type: 'synthetic' | 'company' | 'system'
  specialty: string
  description: string
  personality: {
    tone: string
    style: string
    methodology: string
  }
  prompts: {
    system: string
    greeting: string
    career_focus: string
    productivity_focus: string
    leadership_focus: string
  }
  knowledge_base: {
    documents: File[]
    urls: string[]
    company_data: boolean
  }
}

export default function NewCoachPage() {
  const router = useRouter()
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'prompts' | 'knowledge'>('basic')
  const [formData, setFormData] = useState<CoachFormData>({
    name: '',
    type: 'synthetic',
    specialty: '',
    description: '',
    personality: {
      tone: 'professional',
      style: 'collaborative',
      methodology: 'OKR'
    },
    prompts: {
      system: '',
      greeting: '',
      career_focus: '',
      productivity_focus: '',
      leadership_focus: ''
    },
    knowledge_base: {
      documents: [],
      urls: [],
      company_data: false
    }
  })
  const [isTestingChat, setIsTestingChat] = useState(false)

  const handleSave = async () => {
    // TODO: Implement API call to save coach
    console.log('Saving coach:', formData)
    // For now, just redirect back
    router.push('/admin/coaching')
  }

  const handleTest = () => {
    setIsTestingChat(true)
    // TODO: Implement test chat interface
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Settings },
    { id: 'personality', label: 'Personality', icon: Brain },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin/coaching')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Coach</h1>
          </div>
          <p className="text-gray-600">
            Build a custom AI coach with personality, prompts, and knowledge base
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleTest}
                  variant="outline" 
                  className="w-full"
                  disabled={!formData.name}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Chat
                </Button>
                <Button 
                  onClick={handleSave}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Coach
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coach Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g., AI Readiness Coach"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coach Type *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="synthetic">Synthetic Coach</option>
                          <option value="company">Company Coach</option>
                          <option value="system">System Coach</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Specialty Area
                        </label>
                        <input
                          type="text"
                          value={formData.specialty}
                          onChange={(e) => setFormData({...formData, specialty: e.target.value})}
                          placeholder="e.g., Technology Adoption, Leadership"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={4}
                        placeholder="Describe what this coach specializes in and how it helps users..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Personality Tab */}
                {activeTab === 'personality' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Coach Personality</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Communication Tone
                        </label>
                        <select
                          value={formData.personality.tone}
                          onChange={(e) => setFormData({
                            ...formData, 
                            personality: {...formData.personality, tone: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="motivational">Motivational</option>
                          <option value="analytical">Analytical</option>
                          <option value="supportive">Supportive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Coaching Style
                        </label>
                        <select
                          value={formData.personality.style}
                          onChange={(e) => setFormData({
                            ...formData, 
                            personality: {...formData.personality, style: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="collaborative">Collaborative</option>
                          <option value="directive">Directive</option>
                          <option value="questioning">Questioning</option>
                          <option value="consultative">Consultative</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Methodology
                        </label>
                        <select
                          value={formData.personality.methodology}
                          onChange={(e) => setFormData({
                            ...formData, 
                            personality: {...formData.personality, methodology: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="OKR">OKR (Objectives & Key Results)</option>
                          <option value="SMART">SMART Goals</option>
                          <option value="GROW">GROW Model</option>
                          <option value="CLEAR">CLEAR Framework</option>
                          <option value="FAST">FAST Goals</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prompts Tab */}
                {activeTab === 'prompts' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Coaching Prompts</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          System Prompt
                        </label>
                        <textarea
                          value={formData.prompts.system}
                          onChange={(e) => setFormData({
                            ...formData, 
                            prompts: {...formData.prompts, system: e.target.value}
                          })}
                          rows={4}
                          placeholder="You are a professional coach specializing in..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Greeting Message
                        </label>
                        <textarea
                          value={formData.prompts.greeting}
                          onChange={(e) => setFormData({
                            ...formData, 
                            prompts: {...formData.prompts, greeting: e.target.value}
                          })}
                          rows={3}
                          placeholder="Welcome! I'm here to help you with..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Career Focus Prompt
                          </label>
                          <textarea
                            value={formData.prompts.career_focus}
                            onChange={(e) => setFormData({
                              ...formData, 
                              prompts: {...formData.prompts, career_focus: e.target.value}
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Productivity Focus Prompt
                          </label>
                          <textarea
                            value={formData.prompts.productivity_focus}
                            onChange={(e) => setFormData({
                              ...formData, 
                              prompts: {...formData.prompts, productivity_focus: e.target.value}
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leadership Focus Prompt
                          </label>
                          <textarea
                            value={formData.prompts.leadership_focus}
                            onChange={(e) => setFormData({
                              ...formData, 
                              prompts: {...formData.prompts, leadership_focus: e.target.value}
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Knowledge Base Tab */}
                {activeTab === 'knowledge' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Knowledge Base</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Documents
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500 mb-2">
                            Upload PDFs, documents, or training materials
                          </p>
                          <Button variant="outline" className="mt-2">
                            Choose Files
                          </Button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reference URLs
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Add URLs (one per line) for web content to include in knowledge base..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.knowledge_base.company_data}
                            onChange={(e) => setFormData({
                              ...formData,
                              knowledge_base: {...formData.knowledge_base, company_data: e.target.checked}
                            })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Include company data and org charts
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}