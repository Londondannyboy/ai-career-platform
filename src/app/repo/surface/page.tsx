'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  MapPin, 
  Building, 
  Download, 
  Edit3, 
  Plus, 
  Eye,
  EyeOff
} from 'lucide-react'
import { SurfaceRepo, WorkExperience, Education, ExportFormat } from '@/types/tiered-repo'

export default function SurfaceRepoPage() {
  const { user, isLoaded } = useUser()
  const [surfaceRepo, setSurfaceRepo] = useState<SurfaceRepo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editForm, setEditForm] = useState<Partial<SurfaceRepo>>({})
  
  const supabase = createClient()

  useEffect(() => {
    if (isLoaded && user?.id) {
      loadSurfaceRepo()
    }
  }, [isLoaded, user])

  const loadSurfaceRepo = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('surface_repo')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No surface repo exists, create default one
        await createDefaultSurfaceRepo()
      } else if (error) {
        console.error('Error loading surface repo:', error)
      } else {
        setSurfaceRepo(data)
        setEditForm(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createDefaultSurfaceRepo = async () => {
    if (!user?.id) return

    const defaultRepo: Partial<SurfaceRepo> = {
      user_id: user.id,
      professional_headline: user.fullName || 'Professional',
      summary: '',
      current_role: '',
      current_company: '',
      location: '',
      work_experience: [],
      education: [],
      certifications: [],
      core_skills: [],
      skill_endorsements: {},
      languages: [],
      portfolio_items: [],
      social_links: {},
      preferred_export_format: 'PDF_STANDARD',
      custom_templates: {},
      is_public: true,
      is_searchable: true,
      show_contact_info: true
    }

    const { data, error } = await supabase
      .from('surface_repo')
      .insert(defaultRepo)
      .select()
      .single()

    if (error) {
      console.error('Error creating surface repo:', error)
    } else {
      setSurfaceRepo(data)
      setEditForm(data)
    }
  }

  const saveSurfaceRepo = async () => {
    if (!user?.id || !editForm) return

    try {
      const { data, error } = await supabase
        .from('surface_repo')
        .upsert({
          ...editForm,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving surface repo:', error)
        alert('Error saving changes')
      } else {
        setSurfaceRepo(data)
        setIsEditing(false)
        alert('Changes saved successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving changes')
    }
  }

  const exportToPDF = async (format: ExportFormat = 'PDF_STANDARD') => {
    if (!surfaceRepo) return

    try {
      const response = await fetch('/api/export-surface-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surfaceRepo,
          format,
          user: {
            name: user?.fullName,
            email: user?.emailAddresses?.[0]?.emailAddress
          }
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${surfaceRepo.professional_headline.replace(/\s+/g, '_')}_Resume.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting PDF')
    }
  }

  const addWorkExperience = () => {
    const newExp: WorkExperience = {
      title: '',
      company: '',
      duration: '',
      description: '',
      achievements: [],
      is_current: false
    }
    setEditForm({
      ...editForm,
      work_experience: [...(editForm.work_experience || []), newExp]
    })
  }

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: string | boolean | string[]) => {
    const updated = [...(editForm.work_experience || [])]
    updated[index] = { ...updated[index], [field]: value }
    setEditForm({ ...editForm, work_experience: updated })
  }

  const addEducation = () => {
    const newEdu: Education = {
      institution: '',
      degree: '',
      field: '',
      year: ''
    }
    setEditForm({
      ...editForm,
      education: [...(editForm.education || []), newEdu]
    })
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...(editForm.education || [])]
    updated[index] = { ...updated[index], [field]: value }
    setEditForm({ ...editForm, education: updated })
  }

  const addSkill = (skill: string) => {
    if (!skill.trim() || editForm.core_skills?.includes(skill)) return
    setEditForm({
      ...editForm,
      core_skills: [...(editForm.core_skills || []), skill.trim()]
    })
  }

  const removeSkill = (skill: string) => {
    setEditForm({
      ...editForm,
      core_skills: editForm.core_skills?.filter(s => s !== skill) || []
    })
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surface Repo</h1>
            <p className="mt-2 text-gray-600">
              Your public professional profile - LinkedIn style with PDF export
            </p>
          </div>
          
          <div className="flex space-x-3">
            {surfaceRepo && (
              <>
                <Button
                  onClick={() => exportToPDF()}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export PDF</span>
                </Button>
                
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "secondary" : "default"}
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </Button>
                
                {isEditing && (
                  <Button
                    onClick={saveSurfaceRepo}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save Changes
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {surfaceRepo && (
          <div className="space-y-6">
            {/* Professional Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Professional Profile</span>
                  <div className="flex items-center space-x-2">
                    {editForm.is_public ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-500">
                      {editForm.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Headline
                      </label>
                      <Input
                        value={editForm.professional_headline || ''}
                        onChange={(e) => setEditForm({...editForm, professional_headline: e.target.value})}
                        placeholder="e.g. Senior Software Engineer at TechCorp"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Summary
                      </label>
                      <Textarea
                        value={editForm.summary || ''}
                        onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                        placeholder="Brief professional summary highlighting your expertise and career focus"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Role
                        </label>
                        <Input
                          value={editForm.current_role || ''}
                          onChange={(e) => setEditForm({...editForm, current_role: e.target.value})}
                          placeholder="Current job title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Company
                        </label>
                        <Input
                          value={editForm.current_company || ''}
                          onChange={(e) => setEditForm({...editForm, current_company: e.target.value})}
                          placeholder="Current employer"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <Input
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                        placeholder="City, State/Country"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {surfaceRepo.professional_headline}
                        </h2>
                        {surfaceRepo.summary && (
                          <p className="mt-2 text-gray-600">{surfaceRepo.summary}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          {surfaceRepo.current_role && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {surfaceRepo.current_role}
                              {surfaceRepo.current_company && ` at ${surfaceRepo.current_company}`}
                            </div>
                          )}
                          {surfaceRepo.location && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {surfaceRepo.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Work Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Work Experience</span>
                  {isEditing && (
                    <Button onClick={addWorkExperience} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Experience
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-6">
                    {editForm.work_experience?.map((exp, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Job Title"
                            value={exp.title}
                            onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                          />
                          <Input
                            placeholder="Company"
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                          />
                        </div>
                        <Input
                          placeholder="Duration (e.g., Jan 2020 - Present)"
                          value={exp.duration}
                          onChange={(e) => updateWorkExperience(index, 'duration', e.target.value)}
                        />
                        <Textarea
                          placeholder="Job description and key responsibilities"
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {surfaceRepo.work_experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4">
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-blue-600 font-medium">{exp.company}</p>
                        <p className="text-sm text-gray-500">{exp.duration}</p>
                        {exp.description && (
                          <p className="mt-2 text-gray-600">{exp.description}</p>
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Education</span>
                  {isEditing && (
                    <Button onClick={addEducation} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Education
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {editForm.education?.map((edu, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Institution"
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          />
                          <Input
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Field of Study"
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                          />
                          <Input
                            placeholder="Year"
                            value={edu.year}
                            onChange={(e) => updateEducation(index, 'year', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {surfaceRepo.education.map((edu, index) => (
                      <div key={index} className="border-l-2 border-green-200 pl-4">
                        <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                        <p className="text-green-600 font-medium">{edu.institution}</p>
                        <p className="text-sm text-gray-500">{edu.field} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Core Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {editForm.core_skills?.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => removeSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a skill"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addSkill(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addSkill(input.value)
                          input.value = ''
                        }}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {surfaceRepo.core_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Options */}
            {!isEditing && (
              <Card>
                <CardHeader>
                  <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => exportToPDF('PDF_STANDARD')}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Download className="h-6 w-6 mb-2" />
                      Standard Resume
                    </Button>
                    <Button
                      onClick={() => exportToPDF('PDF_TECH')}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Download className="h-6 w-6 mb-2" />
                      Tech Focus
                    </Button>
                    <Button
                      onClick={() => exportToPDF('PDF_EXECUTIVE')}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Download className="h-6 w-6 mb-2" />
                      Executive Style
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}