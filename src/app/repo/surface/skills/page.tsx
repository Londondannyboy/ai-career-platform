'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Save, Loader2, ArrowLeft, FileDown, FileUp } from 'lucide-react';
import { SkillsEditor } from '@/components/repo/SkillsEditor';
import { LanguageSelector } from '@/components/repo/LanguageSelector';
import { Toast } from '@/components/ui/toast';
import { SkillWithMetadata, Language } from '@/lib/repo/skillCategories';

export default function SurfaceSkillsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'languages'>('skills');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [skills, setSkills] = useState<SkillWithMetadata[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load Surface Repo data
    fetch('/api/surface-repo/load-simple')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          // Transform legacy skills to new format
          if (data.data.skills) {
            const transformedSkills = data.data.skills.map((skill: any) => {
              if (typeof skill === 'string') {
                return {
                  id: Date.now().toString() + Math.random(),
                  name: skill,
                  category: 'Technical',
                  endorsements: 0
                };
              }
              return skill;
            });
            setSkills(transformedSkills);
          }
          
          // Load languages if they exist
          if (data.data.languages) {
            setLanguages(data.data.languages);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, [isLoaded]);

  const save = async () => {
    setSaving(true);
    
    try {
      // Load existing data first
      const loadResponse = await fetch('/api/surface-repo/load-simple');
      const loadData = await loadResponse.json();
      const existingData = loadData.data || {};
      
      // Merge with new skills and languages
      const updatedData = {
        ...existingData,
        skills,
        languages
      };
      
      const response = await fetch('/api/surface-repo/save-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData })
      });
      
      if (response.ok) {
        setShowToast({ message: 'Skills and languages saved successfully!', type: 'success' });
      } else {
        setShowToast({ message: 'Failed to save', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ message: 'Network error while saving', type: 'error' });
    }
    
    setSaving(false);
  };

  const exportSkills = () => {
    const data = {
      skills: skills.map(s => ({
        name: s.name,
        category: s.category,
        level: s.level,
        endorsements: s.endorsements
      })),
      languages: languages.map(l => ({
        name: l.name,
        proficiency: l.proficiency,
        certified: l.certified
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quest-skills-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowToast({ message: 'Skills exported successfully!', type: 'success' });
  };

  const importSkills = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.skills) {
          const importedSkills = data.skills.map((s: any) => ({
            id: Date.now().toString() + Math.random(),
            name: s.name,
            category: s.category || 'Technical',
            level: s.level || 'Intermediate',
            endorsements: s.endorsements || 0
          }));
          setSkills(importedSkills);
        }
        
        if (data.languages) {
          const importedLanguages = data.languages.map((l: any) => ({
            id: Date.now().toString() + Math.random(),
            name: l.name,
            proficiency: l.proficiency || 'Professional',
            certified: l.certified || false
          }));
          setLanguages(importedLanguages);
        }
        
        setShowToast({ message: 'Skills imported successfully!', type: 'success' });
      } catch (error) {
        setShowToast({ message: 'Invalid file format', type: 'error' });
      }
    };
    reader.readAsText(file);
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/repo/surface/edit" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Surface Repo
            </Link>
            <h1 className="text-3xl font-bold">Skills & Languages</h1>
            <p className="text-gray-400 mt-1">Showcase your professional capabilities</p>
          </div>
          
          <div className="flex gap-3">
            <input
              type="file"
              accept=".json"
              onChange={importSkills}
              className="hidden"
              id="import-skills"
            />
            <label
              htmlFor="import-skills"
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Import
            </label>
            
            <button
              onClick={exportSkills}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'skills' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Skills ({skills.length})
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`py-3 px-1 border-b-2 transition-colors ${
                activeTab === 'languages' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Languages ({languages.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'skills' ? (
          <SkillsEditor
            skills={skills}
            onChange={setSkills}
            showEndorsements={true}
          />
        ) : (
          <LanguageSelector
            languages={languages}
            onChange={setLanguages}
          />
        )}

        {/* Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {activeTab === 'skills' ? (
              <>
                <li>• Add up to 50 skills to maximize your visibility</li>
                <li>• Choose the right category for each skill for better organization</li>
                <li>• Reorder skills by dragging to highlight your strengths</li>
                <li>• Skills with more endorsements appear more credible</li>
              </>
            ) : (
              <>
                <li>• List all languages you can use professionally</li>
                <li>• Be honest about proficiency levels</li>
                <li>• Add certifications to validate your language skills</li>
                <li>• Native speakers are highly valued in global teams</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}