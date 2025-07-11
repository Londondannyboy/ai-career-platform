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
import EnhancedSkillInput from '@/components/skills/EnhancedSkillInput';
import EducationInput from '@/components/education/EducationInput';
import ExperienceInput from '@/components/experience/ExperienceInput';
import { Education } from '@/lib/education/educationTypes';
import { Experience as RichExperience } from '@/lib/experience/experienceTypes';
import { Skill as EnhancedSkill } from '@/lib/skills/skillTypes';
import { migrateUserData, needsMigration } from '@/lib/migration/dataEnrichmentMigration';

// Use RichExperience from experienceTypes and EnhancedSkill from skillTypes

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
  const [experiences, setExperiences] = useState<RichExperience[]>([]);
  const [skills, setSkills] = useState<EnhancedSkill[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  
  // Surface Private
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [expectedSalary, setExpectedSalary] = useState('');
  
  // Personal
  const [futureExperiences, setFutureExperiences] = useState<RichExperience[]>([]);
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
          // Check if Surface Public data needs migration
          if (data.profile.surfaceRepo && needsMigration(data.profile.surfaceRepo)) {
            const migrated = migrateUserData(data.profile.surfaceRepo);
            data.profile.surfaceRepo.skills = migrated.skills;
            data.profile.surfaceRepo.experiences = migrated.experiences;
            data.profile.surfaceRepo.education = migrated.education;
            
            // Save migrated data back to server
            await saveSection('surface', data.profile.surfaceRepo);
          }
          
          // Check if Personal repo data needs migration
          if (data.profile.personalRepo && needsMigration({ experiences: data.profile.personalRepo.futureExperiences })) {
            const migrated = migrateUserData({ experiences: data.profile.personalRepo.futureExperiences });
            data.profile.personalRepo.futureExperiences = migrated.experiences;
            
            // Save migrated data back to server
            await saveSection('personal', data.profile.personalRepo);
          }
          
          // Load Surface Public
          setHeadline(data.profile.surfaceRepo?.professional_headline || '');
          setSummary(data.profile.surfaceRepo?.summary || '');
          setExperiences(data.profile.surfaceRepo?.experiences || []);
          setSkills(data.profile.surfaceRepo?.skills || []);
          setEducation(data.profile.surfaceRepo?.education || []);
          
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

  // Experience handlers are now in ExperienceInput component


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
              <Label className="text-white mb-2 block">Experience</Label>
              <ExperienceInput
                experiences={experiences}
                onExperiencesChange={setExperiences}
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Skills</Label>
              <EnhancedSkillInput
                skills={skills}
                onSkillsChange={setSkills}
                showProficiency={true}
                showTemporal={true}
                placeholder="Type to add skills (e.g., React, Python, Leadership)..."
              />
            </div>

            <div>
              <Label className="text-white mb-2 block">Education</Label>
              <EducationInput
                education={education}
                onEducationChange={setEducation}
              />
            </div>

            <Button
              onClick={() => saveSection('surface', {
                professional_headline: headline,
                summary,
                experiences,
                skills,
                education
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
              <Label className="text-white mb-2 block">Future Career Aspirations</Label>
              <p className="text-sm text-gray-400 mb-4">Where do you want to be in 1, 3, 5 years?</p>
              <ExperienceInput
                experiences={futureExperiences}
                onExperiencesChange={setFutureExperiences}
                isFutureExperience={true}
              />
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