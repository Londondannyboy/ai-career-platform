'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Save, Loader2, ArrowLeft, GraduationCap, Award } from 'lucide-react';
import { EducationForm } from '@/components/repo/EducationForm';
import { CertificationForm } from '@/components/repo/CertificationForm';
import { Toast } from '@/components/ui/toast';
import { Education, Certification } from '@/lib/repo/educationValidation';

export default function SurfaceEducationPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'education' | 'certifications'>('education');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load Surface Repo data
    fetch('/api/surface-repo/load-simple')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.educations) {
            setEducations(data.data.educations);
          }
          if (data.data.certifications) {
            setCertifications(data.data.certifications);
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
      
      // Merge with new education data
      const updatedData = {
        ...existingData,
        educations,
        certifications
      };
      
      const response = await fetch('/api/surface-repo/save-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData })
      });
      
      if (response.ok) {
        setShowToast({ message: 'Education and certifications saved successfully!', type: 'success' });
      } else {
        setShowToast({ message: 'Failed to save', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ message: 'Network error while saving', type: 'error' });
    }
    
    setSaving(false);
  };

  const handleSkillsAdd = (skills: string[]) => {
    // This would integrate with the skills system
    setShowToast({ 
      message: `Added ${skills.length} skills from certification`, 
      type: 'info' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Count future items
  const futurePlans = {
    education: educations.filter(e => e.isPlanned).length,
    certifications: certifications.filter(c => c.isPlanned).length
  };

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
            <h1 className="text-3xl font-bold">Education & Certifications</h1>
            <p className="text-gray-400 mt-1">Track your learning journey and plan future achievements</p>
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

        {/* Stats Bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{educations.filter(e => !e.isPlanned).length}</div>
            <div className="text-sm text-gray-400">Degrees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{futurePlans.education}</div>
            <div className="text-sm text-gray-400">Planned Degrees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{certifications.filter(c => !c.isPlanned).length}</div>
            <div className="text-sm text-gray-400">Certifications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{futurePlans.certifications}</div>
            <div className="text-sm text-gray-400">Planned Certs</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('education')}
              className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'education' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Education ({educations.length})
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`py-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'certifications' 
                  ? 'border-blue-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              Certifications ({certifications.length})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'education' ? (
          <EducationForm
            educations={educations}
            onChange={setEducations}
          />
        ) : (
          <CertificationForm
            certifications={certifications}
            onChange={setCertifications}
            onSkillsAdd={handleSkillsAdd}
          />
        )}

        {/* Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 Pro Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            {activeTab === 'education' ? (
              <>
                <li>• Include all degrees, even if incomplete - shows your learning journey</li>
                <li>• Add future education plans to show career ambition</li>
                <li>• Include relevant coursework, thesis topics, and academic achievements</li>
                <li>• GPA is optional - only include if it strengthens your profile</li>
              </>
            ) : (
              <>
                <li>• Keep certifications current - we'll alert you before they expire</li>
                <li>• Plan future certifications aligned with your career goals</li>
                <li>• Add verification links to build credibility</li>
                <li>• Link certifications to skills for better discoverability</li>
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