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

interface Experience {
  id?: string;
  title: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  type?: 'past' | 'current' | 'future';
}

interface Skill {
  name: string;
  category: string;
  endorsements?: number;
}

interface Achievement {
  title: string;
  description: string;
  metrics: string[];
}

interface OKR {
  objective: string;
  keyResults: string[];
  progress: number;
}

export default function RepoEditPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Surface Public
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  
  // Surface Private
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [expectedSalary, setExpectedSalary] = useState('');
  
  // Personal
  const [futureExperiences, setFutureExperiences] = useState<Experience[]>([]);
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [personalGoals, setPersonalGoals] = useState<string[]>([]);
  
  // Deep
  const [trinity, setTrinity] = useState({
    quest: '',
    service: '',
    pledge: ''
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
        if (data.profile) {
          // Load Surface Public
          setHeadline(data.profile.surfaceRepo?.professional_headline || '');
          setSummary(data.profile.surfaceRepo?.summary || '');
          setExperiences(data.profile.surfaceRepo?.experiences || []);
          setSkills(data.profile.surfaceRepo?.skills || []);
          
          // Load Surface Private
          setAchievements(data.profile.surfacePrivateRepo?.achievements || []);
          setExpectedSalary(data.profile.surfacePrivateRepo?.expectedSalary || '');
          
          // Load Personal
          setFutureExperiences(data.profile.personalRepo?.futureExperiences || []);
          setOkrs(data.profile.personalRepo?.okrs || []);
          setPersonalGoals(data.profile.personalRepo?.goals || []);
          
          // Load Deep
          setTrinity(data.profile.deepRepo?.trinity || { quest: '', service: '', pledge: '' });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (section: string, data: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/deep-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({
          layer: section,
          data,
          merge: true
        })
      });
      
      if (response.ok) {
        // Show success somehow
        console.log('Saved successfully');
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => {
    setExperiences([...experiences, {
      title: '',
      company: '',
      startDate: '',
      current: false,
      description: ''
    }]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const addSkill = () => {
    const skillName = prompt('Enter skill name:');
    if (skillName) {
      setSkills([...skills, { name: skillName, category: 'General' }]);
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
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
          <h1 className="text-3xl font-bold mb-2">Edit Your Repository</h1>
          <p className="text-gray-400">Build your complete professional identity</p>
        </div>

        {/* Surface Public */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Surface Repository (Public)</CardTitle>
            <CardDescription>What everyone can see - like LinkedIn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white">Professional Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Senior Software Engineer | AI Enthusiast"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
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

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-white">Experience</Label>
                <Button onClick={addExperience} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add Experience
                </Button>
              </div>
              {experiences.map((exp, index) => (
                <Card key={index} className="mb-4 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <Input
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        <Input
                          type="date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                        <Input
                          type="date"
                          value={exp.endDate || ''}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          disabled={exp.current}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
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
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-white">Skills</Label>
                <Button onClick={addSkill} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Add Skill
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 bg-blue-900 text-blue-100"
                  >
                    {skill.name}
                    <button
                      onClick={() => removeSkill(index)}
                      className="ml-2 text-blue-300 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={() => saveSection('surface', {
                professional_headline: headline,
                summary,
                experiences,
                skills
              })}
              disabled={saving}
              className="w-full"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Surface Repository
            </Button>
          </CardContent>
        </Card>

        {/* Surface Private */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Surface Repository (Private)</CardTitle>
            <CardDescription>For recruiters and close connections only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white">Key Achievements</Label>
              <p className="text-sm text-gray-400 mb-2">Include real metrics like "Increased revenue by 47%"</p>
              {achievements.map((achievement, index) => (
                <Card key={index} className="mb-4 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <Input
                      placeholder="Achievement title"
                      value={achievement.title}
                      onChange={(e) => {
                        const updated = [...achievements];
                        updated[index].title = e.target.value;
                        setAchievements(updated);
                      }}
                      className="mb-2 bg-gray-700 border-gray-600 text-white"
                    />
                    <Textarea
                      placeholder="Description with metrics"
                      value={achievement.description}
                      onChange={(e) => {
                        const updated = [...achievements];
                        updated[index].description = e.target.value;
                        setAchievements(updated);
                      }}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={() => setAchievements([...achievements, { title: '', description: '', metrics: [] }])}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Achievement
              </Button>
            </div>

            <div>
              <Label className="text-white">Expected Salary Range</Label>
              <Input
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="$150,000 - $200,000"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Button
              onClick={() => saveSection('surfacePrivate', {
                achievements,
                expectedSalary
              })}
              disabled={saving}
              className="w-full"
            >
              Save Private Surface Repository
            </Button>
          </CardContent>
        </Card>

        {/* Personal Repository */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Personal Repository</CardTitle>
            <CardDescription>Your private workspace for goals and future planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white">Future Career Aspirations</Label>
              <p className="text-sm text-gray-400 mb-2">Where do you want to be in 1, 3, 5 years?</p>
              {futureExperiences.map((exp, index) => (
                <Card key={index} className="mb-4 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <Input
                      placeholder="Future role (e.g., CTO, VP Engineering)"
                      value={exp.title}
                      className="mb-2 bg-gray-700 border-gray-600 text-white"
                      onChange={(e) => {
                        const updated = [...futureExperiences];
                        updated[index].title = e.target.value;
                        setFutureExperiences(updated);
                      }}
                    />
                    <Input
                      placeholder="Target company or type"
                      value={exp.company}
                      className="bg-gray-700 border-gray-600 text-white"
                      onChange={(e) => {
                        const updated = [...futureExperiences];
                        updated[index].company = e.target.value;
                        setFutureExperiences(updated);
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={() => setFutureExperiences([...futureExperiences, {
                  title: '',
                  company: '',
                  startDate: '',
                  current: false,
                  description: '',
                  type: 'future'
                }])}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Future Goal
              </Button>
            </div>

            <div>
              <Label className="text-white">Personal OKRs</Label>
              {okrs.map((okr, index) => (
                <Card key={index} className="mb-4 bg-gray-800 border-gray-700">
                  <CardContent className="pt-4">
                    <Input
                      placeholder="Objective"
                      value={okr.objective}
                      className="mb-2 bg-gray-700 border-gray-600 text-white"
                      onChange={(e) => {
                        const updated = [...okrs];
                        updated[index].objective = e.target.value;
                        setOkrs(updated);
                      }}
                    />
                    <div className="flex items-center gap-4">
                      <Label className="text-sm">Progress</Label>
                      <Input
                        type="range"
                        min="0"
                        max="100"
                        value={okr.progress}
                        onChange={(e) => {
                          const updated = [...okrs];
                          updated[index].progress = parseInt(e.target.value);
                          setOkrs(updated);
                        }}
                        className="flex-1"
                      />
                      <span className="text-sm">{okr.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                onClick={() => setOkrs([...okrs, { objective: '', keyResults: [], progress: 0 }])}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add OKR
              </Button>
            </div>

            <Button
              onClick={() => saveSection('personal', {
                futureExperiences,
                okrs,
                goals: personalGoals
              })}
              disabled={saving}
              className="w-full"
            >
              Save Personal Repository
            </Button>
          </CardContent>
        </Card>

        {/* Deep Repository */}
        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Deep Repository</CardTitle>
            <CardDescription>Your Trinity - the core of your professional identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white">Quest</Label>
              <p className="text-sm text-gray-400 mb-2">What drives you?</p>
              <Textarea
                value={trinity.quest}
                onChange={(e) => setTrinity({ ...trinity, quest: e.target.value })}
                placeholder="Your mission, your why..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Service</Label>
              <p className="text-sm text-gray-400 mb-2">How do you serve?</p>
              <Textarea
                value={trinity.service}
                onChange={(e) => setTrinity({ ...trinity, service: e.target.value })}
                placeholder="Your contribution to the world..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Pledge</Label>
              <p className="text-sm text-gray-400 mb-2">What do you commit to?</p>
              <Textarea
                value={trinity.pledge}
                onChange={(e) => setTrinity({ ...trinity, pledge: e.target.value })}
                placeholder="Your values and commitments..."
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Button
              onClick={() => saveSection('deep', { trinity })}
              disabled={saving}
              className="w-full"
            >
              Save Deep Repository
            </Button>
          </CardContent>
        </Card>

        {/* View Profile Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => router.push(`/profile/${user?.username || user?.id}`)}
            variant="outline"
            size="lg"
          >
            View Your Profile
          </Button>
        </div>
      </div>
    </div>
  );
}