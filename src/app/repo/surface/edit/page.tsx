'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Save, Loader2, Plus, X, Target, Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { WorkExperienceWithFuture, sortExperiencesByDate } from '@/types/work-experience';

export default function SurfaceRepoEditorPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skillCategory, setSkillCategory] = useState('technical');
  
  const [surfaceData, setSurfaceData] = useState({
    headline: '',
    summary: '',
    experience: [] as WorkExperienceWithFuture[],
    skills: [] as { name: string; category: string; endorsed: number }[],
    endorsements: {} as Record<string, number>
  });

  const userId = user?.id || 'test-user-123';

  useEffect(() => {
    if (!isLoaded) return;
    
    // Fetch Surface Repo data
    fetch(`/api/deep-repo/surface?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          // Transform legacy data to new format
          const transformedExperience = (data.data.experience || []).map((exp: any) => ({
            ...exp,
            id: exp.id || Date.now().toString() + Math.random(),
            isCurrent: exp.current || false,
            isFuture: false,
            achievements: exp.achievements || [],
            skills: exp.skills || []
          }));
          
          // Transform legacy skills to new format
          const transformedSkills = (data.data.skills || []).map((skill: string) => ({
            name: skill,
            category: 'general',
            endorsed: data.data.endorsements?.[skill] || 0
          }));
          
          setSurfaceData({
            headline: data.data.headline || '',
            summary: data.data.summary || '',
            experience: transformedExperience,
            skills: transformedSkills,
            endorsements: data.data.endorsements || {}
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load surface data:', err);
        setLoading(false);
      });
  }, [isLoaded, userId]);

  const save = async () => {
    setSaving(true);
    try {
      // Transform back to legacy format for compatibility
      const legacyData = {
        headline: surfaceData.headline,
        summary: surfaceData.summary,
        experience: surfaceData.experience,
        skills: surfaceData.skills.map(s => s.name),
        endorsements: surfaceData.endorsements
      };
      
      const response = await fetch('/api/deep-repo/surface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          data: legacyData
        })
      });
      
      if (response.ok) {
        alert('Surface Repo saved successfully!');
      } else {
        alert('Failed to save');
      }
    } catch (error) {
      alert('Error saving data');
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && !surfaceData.skills.find(s => s.name === newSkill.trim())) {
      setSurfaceData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: newSkill.trim(), category: skillCategory, endorsed: 0 }],
        endorsements: { ...prev.endorsements, [newSkill.trim()]: 0 }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillName: string) => {
    setSurfaceData(prev => {
      const newEndorsements = { ...prev.endorsements };
      delete newEndorsements[skillName];
      return {
        ...prev,
        skills: prev.skills.filter(s => s.name !== skillName),
        endorsements: newEndorsements
      };
    });
  };

  const addExperience = (isFuture: boolean = false) => {
    const newExperience: WorkExperienceWithFuture = {
      id: Date.now().toString(),
      title: '',
      company: '',
      startDate: isFuture ? new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0] : '',
      endDate: undefined,
      isCurrent: false,
      isFuture: isFuture,
      description: '',
      achievements: [],
      skills: [],
      targetDate: isFuture ? new Date(new Date().getFullYear() + 2, 0, 1).toISOString().split('T')[0] : undefined,
      whyThisRole: isFuture ? '' : undefined,
      requiredSteps: isFuture ? [] : undefined,
      skillGaps: isFuture ? [] : undefined,
      progress: isFuture ? 0 : undefined
    };
    
    setSurfaceData(prev => ({
      ...prev,
      experience: sortExperiencesByDate([...prev.experience, newExperience])
    }));
  };

  const updateExperience = (id: string, updates: Partial<WorkExperienceWithFuture>) => {
    setSurfaceData(prev => ({
      ...prev,
      experience: sortExperiencesByDate(
        prev.experience.map(exp => 
          exp.id === id ? { ...exp, ...updates } : exp
        )
      )
    }));
  };

  const removeExperience = (id: string) => {
    setSurfaceData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addAchievement = (expId: string) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp) {
      updateExperience(expId, { achievements: [...exp.achievements, ''] });
    }
  };

  const updateAchievement = (expId: string, index: number, value: string) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp) {
      const newAchievements = [...exp.achievements];
      newAchievements[index] = value;
      updateExperience(expId, { achievements: newAchievements });
    }
  };

  const removeAchievement = (expId: string, index: number) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp) {
      updateExperience(expId, { 
        achievements: exp.achievements.filter((_, i) => i !== index) 
      });
    }
  };

  const addRequiredStep = (expId: string) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp && exp.requiredSteps) {
      updateExperience(expId, { requiredSteps: [...exp.requiredSteps, ''] });
    }
  };

  const updateRequiredStep = (expId: string, index: number, value: string) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp && exp.requiredSteps) {
      const newSteps = [...exp.requiredSteps];
      newSteps[index] = value;
      updateExperience(expId, { requiredSteps: newSteps });
    }
  };

  const removeRequiredStep = (expId: string, index: number) => {
    const exp = surfaceData.experience.find(e => e.id === expId);
    if (exp && exp.requiredSteps) {
      updateExperience(expId, { 
        requiredSteps: exp.requiredSteps.filter((_, i) => i !== index) 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Surface Repo Editor</h1>
          <div className="flex gap-4">
            <Link href="/visualization/3d/surface-repo" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
              View in 3D
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Headline */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <label className="block text-sm font-medium mb-2">Professional Headline</label>
          <input
            type="text"
            value={surfaceData.headline}
            onChange={(e) => setSurfaceData(prev => ({ ...prev, headline: e.target.value }))}
            className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Founder & CEO at Quest | Building the future of professional identity"
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <label className="block text-sm font-medium mb-2">Professional Summary</label>
          <textarea
            value={surfaceData.summary}
            onChange={(e) => setSurfaceData(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full bg-gray-700 px-4 py-2 rounded h-32 focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your professional journey, current focus, and where you're heading..."
          />
        </div>

        {/* Experience */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Experience & Aspirations</h2>
            <div className="flex gap-2">
              <button
                onClick={() => addExperience(false)}
                className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Experience
              </button>
              <button
                onClick={() => addExperience(true)}
                className="bg-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center gap-1"
              >
                <Target className="w-4 h-4" /> Add Future Goal
              </button>
            </div>
          </div>
          
          {surfaceData.experience.map((exp) => (
            <div 
              key={exp.id} 
              className={`p-4 rounded mb-4 border-2 ${
                exp.isFuture 
                  ? 'bg-purple-900/20 border-purple-600' 
                  : exp.isCurrent 
                    ? 'bg-blue-900/20 border-blue-600' 
                    : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  {exp.isFuture && (
                    <div className="flex items-center gap-1 text-purple-400 text-sm">
                      <Target className="w-4 h-4" />
                      <span>Future Aspiration</span>
                    </div>
                  )}
                  {exp.isCurrent && !exp.isFuture && (
                    <div className="flex items-center gap-1 text-blue-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Current Role</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => updateExperience(exp.id, { title: e.target.value })}
                    className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder={exp.isFuture ? "Target Role" : "Job Title"}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company</label>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                    className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder={exp.isFuture ? "Target Company" : "Company"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    {exp.isFuture ? "Target Start Date" : "Start Date"}
                  </label>
                  <input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                    className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!exp.isFuture && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">End Date</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={exp.endDate || ''}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        disabled={exp.isCurrent}
                        className="flex-1 bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={exp.isCurrent}
                          onChange={(e) => updateExperience(exp.id, { 
                            isCurrent: e.target.checked,
                            endDate: e.target.checked ? undefined : exp.endDate
                          })}
                          className="rounded"
                        />
                        Current
                      </label>
                    </div>
                  </div>
                )}
                {exp.isFuture && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Target Achievement Date</label>
                    <input
                      type="date"
                      value={exp.targetDate || ''}
                      onChange={(e) => updateExperience(exp.id, { targetDate: e.target.value })}
                      className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                  className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder={exp.isFuture ? "Describe your vision for this role..." : "Describe your responsibilities..."}
                  rows={3}
                />
              </div>

              {exp.isFuture && (
                <>
                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1">Why This Role?</label>
                    <textarea
                      value={exp.whyThisRole || ''}
                      onChange={(e) => updateExperience(exp.id, { whyThisRole: e.target.value })}
                      className="w-full bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-purple-500"
                      placeholder="How does this align with your Quest, Service, and Pledge?"
                      rows={2}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Progress Towards Goal
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={exp.progress || 0}
                        onChange={(e) => updateExperience(exp.id, { progress: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">{exp.progress || 0}%</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-gray-400">Required Steps</label>
                      <button
                        onClick={() => addRequiredStep(exp.id)}
                        className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Step
                      </button>
                    </div>
                    {exp.requiredSteps?.map((step, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => updateRequiredStep(exp.id, index, e.target.value)}
                          className="flex-1 bg-gray-600 px-3 py-1 rounded text-sm focus:ring-2 focus:ring-purple-500"
                          placeholder="e.g., Complete AWS certification"
                        />
                        <button
                          onClick={() => removeRequiredStep(exp.id, index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!exp.isFuture && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs text-gray-400">Key Achievements</label>
                    <button
                      onClick={() => addAchievement(exp.id)}
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Achievement
                    </button>
                  </div>
                  {exp.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(exp.id, index, e.target.value)}
                        className="flex-1 bg-gray-600 px-3 py-1 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Led team of 10 to deliver project 2 weeks early"
                      />
                      <button
                        onClick={() => removeAchievement(exp.id, index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Skills & Endorsements</h2>
          
          <div className="flex gap-2 mb-4">
            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="bg-gray-700 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="technical">Technical</option>
              <option value="leadership">Leadership</option>
              <option value="business">Business</option>
              <option value="creative">Creative</option>
              <option value="communication">Communication</option>
              <option value="general">General</option>
            </select>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1 bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Add a skill and press Enter"
            />
            <button
              onClick={addSkill}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {/* Group skills by category */}
          {['technical', 'leadership', 'business', 'creative', 'communication', 'general'].map(category => {
            const categorySkills = surfaceData.skills.filter(s => s.category === category);
            if (categorySkills.length === 0) return null;
            
            return (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2 capitalize">{category} Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <div key={skill.name} className="bg-gray-700 px-3 py-2 rounded-full flex items-center gap-2">
                      <span>{skill.name}</span>
                      <span className="text-sm text-gray-400">({skill.endorsed})</span>
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}