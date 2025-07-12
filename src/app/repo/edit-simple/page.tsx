'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SimpleSkillInput from '@/components/skills/SimpleSkillInput';

// Simple types
interface SimpleExperience {
  id?: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface SimpleEducation {
  id?: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: string;
  endDate?: string;
}

export default function SimpleRepoEditPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Surface Public - Simple data
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<SimpleExperience[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<SimpleEducation[]>([]);
  
  // Experience form state
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<SimpleExperience>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });

  // Education form state  
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [currentEducation, setCurrentEducation] = useState<SimpleEducation>({
    institution: '',
    degree: '',
    field: '',
    endDate: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
    }
  }, [isLoaded, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deep-repo', {
        headers: {
          'X-User-Id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.profile?.surfaceRepo) {
          const repo = data.profile.surfaceRepo;
          
          // Load data
          setHeadline(repo.professional_headline || '');
          setSummary(repo.summary || '');
          
          // Handle experiences
          if (repo.experiences) {
            setExperiences(repo.experiences);
          } else if (repo.work_experience) {
            // Legacy field
            setExperiences(repo.work_experience);
          }
          
          // Handle skills - convert objects to strings if needed
          if (repo.skills) {
            const skillStrings = repo.skills.map((skill: any) => 
              typeof skill === 'string' ? skill : skill.name
            );
            setSkills(skillStrings);
          }
          
          // Handle education
          if (repo.education) {
            setEducation(repo.education);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const dataToSave = {
        professional_headline: headline,
        summary,
        experiences,
        skills,
        education
      };
      
      console.log('Saving data:', dataToSave);
      
      const response = await fetch('/api/deep-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({
          layer: 'surface',
          data: dataToSave,
          merge: false // Replace entire layer
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage('✅ Saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error: ${result.error || 'Failed to save'}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      setMessage('❌ Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    if (currentExperience.title && currentExperience.company) {
      const newExp = {
        ...currentExperience,
        id: Date.now().toString()
      };
      setExperiences([...experiences, newExp]);
      setCurrentExperience({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      });
      setShowExperienceForm(false);
    }
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    if (currentEducation.institution && currentEducation.degree) {
      const newEdu = {
        ...currentEducation,
        id: Date.now().toString()
      };
      setEducation([...education, newEdu]);
      setCurrentEducation({
        institution: '',
        degree: '',
        field: '',
        endDate: ''
      });
      setShowEducationForm(false);
    }
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Your Profile (Simple)</h1>
          <p className="text-gray-400">Simplified profile editor for testing</p>
          {message && (
            <div className="mt-4 p-3 rounded bg-gray-800 text-sm">
              {message}
            </div>
          )}
        </div>

        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headline */}
            <div>
              <Label className="text-white">Professional Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Software Engineer | AI Enthusiast"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            {/* Summary */}
            <div>
              <Label className="text-white">Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Tell your professional story..."
                rows={4}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            {/* Experience */}
            <div>
              <Label className="text-white mb-2 block">Experience</Label>
              
              {/* List existing experiences */}
              {experiences.map((exp, index) => (
                <div key={exp.id || index} className="mb-3 p-3 bg-gray-800 rounded flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{exp.title}</div>
                    <div className="text-sm text-gray-400">{exp.company}</div>
                    <div className="text-xs text-gray-500">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                    </div>
                  </div>
                  <Button
                    onClick={() => removeExperience(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add experience form */}
              {showExperienceForm ? (
                <Card className="mt-3 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      placeholder="Job Title"
                      value={currentExperience.title}
                      onChange={(e) => setCurrentExperience({...currentExperience, title: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Company"
                      value={currentExperience.company}
                      onChange={(e) => setCurrentExperience({...currentExperience, company: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="month"
                        placeholder="Start Date"
                        value={currentExperience.startDate}
                        onChange={(e) => setCurrentExperience({...currentExperience, startDate: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Input
                        type="month"
                        placeholder="End Date"
                        value={currentExperience.endDate}
                        onChange={(e) => setCurrentExperience({...currentExperience, endDate: e.target.value})}
                        disabled={currentExperience.current}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentExperience.current}
                        onChange={(e) => setCurrentExperience({...currentExperience, current: e.target.checked, endDate: ''})}
                      />
                      Current position
                    </label>
                    <Textarea
                      placeholder="Description (optional)"
                      value={currentExperience.description}
                      onChange={(e) => setCurrentExperience({...currentExperience, description: e.target.value})}
                      rows={3}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button onClick={addExperience} size="sm">Add</Button>
                      <Button onClick={() => setShowExperienceForm(false)} size="sm" variant="outline">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  onClick={() => setShowExperienceForm(true)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Experience
                </Button>
              )}
            </div>

            {/* Skills */}
            <div>
              <Label className="text-white mb-2 block">Skills</Label>
              <SimpleSkillInput
                skills={skills}
                onSkillsChange={setSkills}
                placeholder="Type a skill and press Enter (e.g., JavaScript, Project Management)"
              />
            </div>

            {/* Education */}
            <div>
              <Label className="text-white mb-2 block">Education</Label>
              
              {/* List education */}
              {education.map((edu, index) => (
                <div key={edu.id || index} className="mb-3 p-3 bg-gray-800 rounded flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{edu.degree} in {edu.field}</div>
                    <div className="text-sm text-gray-400">{edu.institution}</div>
                    {edu.endDate && <div className="text-xs text-gray-500">Graduated: {edu.endDate}</div>}
                  </div>
                  <Button
                    onClick={() => removeEducation(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add education form */}
              {showEducationForm ? (
                <Card className="mt-3 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4 space-y-3">
                    <Input
                      placeholder="Institution"
                      value={currentEducation.institution}
                      onChange={(e) => setCurrentEducation({...currentEducation, institution: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Degree (e.g., BS, MS, PhD)"
                      value={currentEducation.degree}
                      onChange={(e) => setCurrentEducation({...currentEducation, degree: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Field of Study"
                      value={currentEducation.field}
                      onChange={(e) => setCurrentEducation({...currentEducation, field: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="month"
                      placeholder="Graduation Date"
                      value={currentEducation.endDate}
                      onChange={(e) => setCurrentEducation({...currentEducation, endDate: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button onClick={addEducation} size="sm">Add</Button>
                      <Button onClick={() => setShowEducationForm(false)} size="sm" variant="outline">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  onClick={() => setShowEducationForm(true)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Education
                </Button>
              )}
            </div>

            {/* Save Button */}
            <Button
              onClick={saveProfile}
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}