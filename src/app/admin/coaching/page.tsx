'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  BookOpen, 
  FileText, 
  Building2, 
  Plus, 
  Edit3, 
  Eye, 
  Users,
  Settings,
  Zap,
  Target,
  Briefcase,
  MessageSquare
} from 'lucide-react'

interface Coach {
  id: string
  name: string
  type: 'synthetic' | 'company' | 'system'
  specialty: string
  description: string
  status: 'active' | 'draft' | 'archived'
  sessions: number
  rating: number
}

interface Course {
  id: string
  title: string
  description: string
  modules: number
  enrollments: number
  completion_rate: number
  status: 'active' | 'draft' | 'archived'
  coaches: string[]
}

export default function AdminCoachingPage() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState<'coaches' | 'courses' | 'playbooks'>('coaches')
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  // Mock data - replace with actual API calls
  useEffect(() => {
    setCoaches([
      {
        id: '1',
        name: 'Career Development Coach',
        type: 'system',
        specialty: 'Career Growth',
        description: 'Helps with career planning, goal setting, and professional development',
        status: 'active',
        sessions: 127,
        rating: 4.8
      },
      {
        id: '2', 
        name: 'AI Readiness Coach',
        type: 'synthetic',
        specialty: 'Technology Adoption',
        description: 'Guides teams through AI implementation and digital transformation',
        status: 'active',
        sessions: 45,
        rating: 4.6
      },
      {
        id: '3',
        name: 'CK Delta Leadership Coach',
        type: 'company',
        specialty: 'Leadership Development',
        description: 'Custom coach trained on CK Delta culture and leadership principles',
        status: 'draft',
        sessions: 0,
        rating: 0
      }
    ])

    setCourses([
      {
        id: '1',
        title: 'AI Readiness Program',
        description: 'Comprehensive program to prepare teams for AI adoption',
        modules: 6,
        enrollments: 23,
        completion_rate: 78,
        status: 'active',
        coaches: ['AI Readiness Coach', 'Technology Coach']
      },
      {
        id: '2',
        title: 'Leadership Excellence',
        description: 'Advanced leadership development for senior managers',
        modules: 8,
        enrollments: 15,
        completion_rate: 92,
        status: 'active', 
        coaches: ['Leadership Coach', 'Communication Coach']
      }
    ])
  }, [])

  const getCoachTypeColor = (type: Coach['type']) => {
    switch (type) {
      case 'synthetic': return 'bg-purple-100 text-purple-800'
      case 'company': return 'bg-blue-100 text-blue-800'
      case 'system': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coaching Administration</h1>
          <p className="mt-2 text-gray-600">
            Manage synthetic coaches, courses, and coaching playbooks
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('coaches')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'coaches'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Brain className="h-4 w-4 inline mr-2" />
                Coaches ({coaches.length})
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'courses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Courses ({courses.length})
              </button>
              <button
                onClick={() => setActiveTab('playbooks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'playbooks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Playbooks
              </button>
            </nav>
          </div>
        </div>

        {/* Coaches Tab */}
        {activeTab === 'coaches' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Coaching Agents</h2>
              <div className="flex space-x-3">
                <Link href="/admin/coaching/coaches/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Coach
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => (
                <Card key={coach.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{coach.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getCoachTypeColor(coach.type)}>
                            {coach.type}
                          </Badge>
                          <Badge className={getStatusColor(coach.status)}>
                            {coach.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Link href={`/admin/coaching/coaches/${coach.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/coaching/coaches/${coach.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{coach.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{coach.sessions} sessions</span>
                      {coach.rating > 0 && (
                        <span className="text-yellow-600">★ {coach.rating}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Coaching Courses</h2>
              <div className="flex space-x-3">
                <Link href="/admin/coaching/courses/new">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Link href={`/admin/coaching/courses/${course.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/coaching/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{course.modules} modules</span>
                        <span className="text-gray-500">{course.enrollments} enrolled</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Completion rate:</span>
                        <span className="text-green-600 font-medium">{course.completion_rate}%</span>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Assigned Coaches:</p>
                        <div className="flex flex-wrap gap-1">
                          {course.coaches.map((coach, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {coach}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Playbooks Tab */}
        {activeTab === 'playbooks' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Coaching Playbooks</h2>
              <div className="flex space-x-3">
                <Link href="/admin/coaching/playbooks/new">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Playbook
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Career Coaching',
                  icon: Briefcase,
                  description: 'Core career development and goal-setting prompts',
                  prompts: 15,
                  color: 'blue'
                },
                {
                  name: 'Productivity Focus',
                  icon: Zap,
                  description: 'Time management and efficiency coaching',
                  prompts: 12,
                  color: 'green'
                },
                {
                  name: 'Leadership Development',
                  icon: Target,
                  description: 'Leadership skills and team management',
                  prompts: 18,
                  color: 'purple'
                },
                {
                  name: 'Communication Skills',
                  icon: MessageSquare,
                  description: 'Interpersonal and presentation skills',
                  prompts: 10,
                  color: 'orange'
                }
              ].map((playbook, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-${playbook.color}-100`}>
                        <playbook.icon className={`h-6 w-6 text-${playbook.color}-600`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{playbook.name}</CardTitle>
                        <p className="text-sm text-gray-500">{playbook.prompts} prompts</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{playbook.description}</p>
                    <div className="flex space-x-2">
                      <Link href={`/admin/coaching/playbooks/${playbook.name.toLowerCase().replace(' ', '-')}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/admin/coaching/playbooks/${playbook.name.toLowerCase().replace(' ', '-')}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}