'use client'

/**
 * Quest Profile Completion - Bite-sized Professional Repository
 * Progressive, conversational interface for building professional profile
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Building2,
  GraduationCap,
  Award,
  Zap,
  CheckCircle,
  Circle,
  Download,
  Edit,
  Plus,
  Save,
  X
} from 'lucide-react'

interface ProfileSection {
  id: string
  title: string
  description: string
  icon: any
  completed: boolean
  required: boolean
  count?: number
}

interface WorkExperience {
  id?: string
  company_name: string
  role_title: string
  period_description: string
  is_current: boolean
  description?: string
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [currentSection, setCurrentSection] = useState<string>('overview')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState<any>({
    workExperience: [],
    education: [],
    certificates: [],
    coreSkills: []
  })
  const [completionData, setCompletionData] = useState<any>({
    current_work_completed: false,
    work_history_completed: false, 
    education_completed: false,
    certificates_completed: false,
    core_skills_completed: false,
    completion_percentage: 0
  })

  // Profile completion sections
  const sections: ProfileSection[] = [
    {
      id: 'current-work',
      title: 'Current Work',
      description: 'Where do you work now?',
      icon: Building2,
      completed: completionData.current_work_completed,
      required: true,
      count: profileData.workExperience?.filter((w: any) => w.is_current).length || 0
    },
    {
      id: 'work-history',
      title: 'Recent Work',
      description: 'Your last 2-3 roles',
      icon: Building2,
      completed: completionData.work_history_completed,
      required: true,
      count: profileData.workExperience?.filter((w: any) => !w.is_current).length || 0
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Degrees and qualifications',
      icon: GraduationCap,
      completed: completionData.education_completed,
      required: true,
      count: profileData.education?.length || 0
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Professional certifications',
      icon: Award,
      completed: completionData.certificates_completed,
      required: false,
      count: profileData.certificates?.length || 0
    },
    {
      id: 'core-skills',
      title: 'Core Skills',
      description: 'Your key professional skills',
      icon: Zap,
      completed: completionData.core_skills_completed,
      required: true,
      count: profileData.coreSkills?.length || 0
    }
  ]

  useEffect(() => {
    if (isLoaded && user) {
      loadProfileData()
    }
  }, [isLoaded, user])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      // TODO: Load from our Quest database
      console.log('Loading profile data for user:', user?.id)
      
      // Mock data for now - will be replaced with real API calls
      setProfileData({
        workExperience: [
          {
            id: '1',
            company_name: 'CKDelta',
            role_title: 'Founder/CEO',
            period_description: 'Q1 2023 - Present',
            is_current: true,
            description: 'Building Quest AI platform'
          }
        ],
        education: [],
        certificates: [],
        coreSkills: ['Leadership', 'AI/ML', 'Strategy']
      })
      
      setCompletionData({
        current_work_completed: true,
        work_history_completed: false,
        education_completed: false,
        certificates_completed: false,
        core_skills_completed: true,
        completion_percentage: 40
      })
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to complete your profile.</p>
      </div>
    )
  }

  // Overview/Progress view
  if (currentSection === 'overview') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Export CV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Professional Profile
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              We just need to know a bit about you. This will be very quick!
            </p>
            
            {/* Progress Bar */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Profile Completion
                </span>
                <span className="text-sm text-gray-500">
                  {completionData.completion_percentage}% complete
                </span>
              </div>
              <Progress value={completionData.completion_percentage} className="h-2" />
              {completionData.completion_percentage < 100 && (
                <p className="text-sm text-gray-500 mt-2">
                  Just a few quick sections to complete your professional story
                </p>
              )}
            </div>
          </div>

          {/* Profile Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <Card 
                  key={section.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    section.completed ? 'border-green-200 bg-green-50' : ''
                  }`}
                  onClick={() => setCurrentSection(section.id)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center">
                        <div className={`rounded-lg p-2 mr-3 ${
                          section.completed ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            section.completed ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          {section.title}
                          {section.required && (
                            <span className="ml-2 text-xs text-red-500">*</span>
                          )}
                          {section.count > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {section.count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {section.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {section.description}
                    </p>
                    <Button 
                      size="sm" 
                      variant={section.completed ? "outline" : "default"}
                      className="w-full"
                    >
                      {section.completed ? (
                        <>
                          <Edit className="w-3 h-3 mr-2" />
                          Edit Section
                        </>
                      ) : (
                        'Complete Section'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Tips */}
          <div className="mt-8">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Quick Tips
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Approximate dates are fine (e.g., "Q1 2020 - Q2 2022")</li>
                  <li>• You can edit and refine everything later</li>
                  <li>• Focus on your most recent and relevant experience</li>
                  <li>• This will power your AI career coaching conversations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Individual section editing would go here
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentSection('overview')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile Overview
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            {sections.find(s => s.id === currentSection)?.title} Editor
          </h2>
          <p className="text-gray-600 mb-6">
            Section editing interfaces coming soon.
          </p>
          <Button onClick={() => setCurrentSection('overview')}>
            Return to Overview
          </Button>
        </div>
      </div>
    </div>
  )
}
