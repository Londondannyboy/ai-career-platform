'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Save, Loader2, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function SurfaceRepoEditorPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  const [surfaceData, setSurfaceData] = useState({
    headline: '',
    summary: '',
    experience: [] as any[],
    skills: [] as string[],
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
          setSurfaceData({
            headline: data.data.headline || '',
            summary: data.data.summary || '',
            experience: data.data.experience || [],
            skills: data.data.skills || [],
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
      const response = await fetch('/api/deep-repo/surface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          data: surfaceData
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
    if (newSkill.trim() && !surfaceData.skills.includes(newSkill.trim())) {
      setSurfaceData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
        endorsements: { ...prev.endorsements, [newSkill.trim()]: 0 }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSurfaceData(prev => {
      const newEndorsements = { ...prev.endorsements };
      delete newEndorsements[skill];
      return {
        ...prev,
        skills: prev.skills.filter(s => s !== skill),
        endorsements: newEndorsements
      };
    });
  };

  const addExperience = () => {
    setSurfaceData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        title: '',
        company: '',
        startDate: '',
        current: false,
        description: ''
      }]
    }));
  };

  const updateExperience = (index: number, field: string, value: any) => {
    setSurfaceData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setSurfaceData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
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
          <h1 className="text-3xl font-bold">Surface Repo Editor (LinkedIn-style)</h1>
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
            className="w-full bg-gray-700 px-4 py-2 rounded"
            placeholder="e.g., Founder & CEO at Quest"
          />
        </div>

        {/* Summary */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <label className="block text-sm font-medium mb-2">Summary</label>
          <textarea
            value={surfaceData.summary}
            onChange={(e) => setSurfaceData(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full bg-gray-700 px-4 py-2 rounded h-32"
            placeholder="Describe your professional journey and goals..."
          />
        </div>

        {/* Experience */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Experience</h2>
            <button
              onClick={addExperience}
              className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Experience
            </button>
          </div>
          
          {surfaceData.experience.map((exp, index) => (
            <div key={exp.id || index} className="bg-gray-700 p-4 rounded mb-3">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => removeExperience(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="bg-gray-600 px-3 py-2 rounded"
                  placeholder="Job Title"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="bg-gray-600 px-3 py-2 rounded"
                  placeholder="Company"
                />
              </div>
              <textarea
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                className="w-full bg-gray-600 px-3 py-2 rounded"
                placeholder="Description..."
                rows={2}
              />
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Skills & Endorsements</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="flex-1 bg-gray-700 px-4 py-2 rounded"
              placeholder="Add a skill and press Enter"
            />
            <button
              onClick={addSkill}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {surfaceData.skills.map((skill) => (
              <div key={skill} className="bg-gray-700 px-3 py-2 rounded-full flex items-center gap-2">
                <span>{skill}</span>
                <span className="text-sm text-gray-400">({surfaceData.endorsements[skill] || 0})</span>
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}