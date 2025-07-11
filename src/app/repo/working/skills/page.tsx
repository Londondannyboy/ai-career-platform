'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Save, Loader2, ArrowLeft, Zap, Plus,
  Code, Briefcase, Palette, Users, Database
} from 'lucide-react';
import { SkillsEditor } from '@/components/repo/SkillsEditor';
import { Toast } from '@/components/ui/toast';

export default function WorkingSkillsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    fetch('/api/deep-repo/working/skills')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setSkills(data.data.skills || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load skills:', err);
        setLoading(false);
      });
  }, [isLoaded]);

  const save = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/deep-repo/working/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills })
      });
      
      if (response.ok) {
        setShowToast({ message: 'Skills saved successfully!', type: 'success' });
      } else {
        setShowToast({ message: 'Failed to save skills', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ message: 'Error saving skills', type: 'error' });
    }
    
    setSaving(false);
  };

  if (loading || !isLoaded) {
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
            <Link href="/repo/working" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Working Repo
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-500" />
              Skills & Languages
            </h1>
          </div>
          
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        {/* Skills Editor */}
        <SkillsEditor
          skills={skills}
          onChange={setSkills}
        />
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