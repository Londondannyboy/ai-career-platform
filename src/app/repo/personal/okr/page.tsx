'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Save, Loader2, ArrowLeft, Target, BarChart3, Download,
  TrendingUp, Calendar, Lock
} from 'lucide-react';
import { OKREditor } from '@/components/repo/OKREditor';
import { Toast } from '@/components/ui/toast';
import { ProfessionalOKR, calculateOKRProgress, formatOKRPeriod } from '@/lib/repo/okrService';

export default function PersonalOKRPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [okrs, setOkrs] = useState<ProfessionalOKR[]>([]);
  const [aspirations, setAspirations] = useState<{ id: string; title: string }[]>([]);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load OKRs from Personal Repo
    fetch('/api/deep-repo/personal/okr')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setOkrs(data.data.okrs || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load OKRs:', err);
        setLoading(false);
      });

    // Load aspirations from Surface Repo
    fetch('/api/surface-repo/load-simple')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.experience) {
          const futureRoles = data.data.experience
            .filter((exp: any) => exp.isFuture)
            .map((exp: any) => ({
              id: exp.id,
              title: `${exp.title} at ${exp.company?.name || exp.company}`
            }));
          setAspirations(futureRoles);
        }
      })
      .catch(err => {
        console.error('Failed to load aspirations:', err);
      });
  }, [isLoaded]);

  const save = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/deep-repo/personal/okr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ okrs })
      });
      
      if (response.ok) {
        setShowToast({ message: 'OKRs saved successfully!', type: 'success' });
      } else {
        const error = await response.json();
        setShowToast({ message: error.error || 'Failed to save', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ message: 'Network error while saving', type: 'error' });
    }
    
    setSaving(false);
  };

  const exportOKRs = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      user: user?.emailAddresses[0]?.emailAddress || 'Unknown',
      okrs: okrs.map(okr => ({
        objective: okr.objective,
        period: formatOKRPeriod(okr.timeframe, okr.year),
        progress: calculateOKRProgress(okr),
        status: okr.status,
        keyResults: okr.keyResults.map(kr => ({
          description: kr.description,
          progress: `${kr.currentValue}/${kr.targetValue} ${kr.unit}`,
          status: kr.status
        })),
        linkedAspiration: aspirations.find(a => a.id === okr.linkedToAspiration)?.title
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quest-okrs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowToast({ message: 'OKRs exported successfully!', type: 'success' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const activeOKRs = okrs.filter(okr => okr.status === 'active');
  const completedOKRs = okrs.filter(okr => okr.status === 'completed');
  const totalKeyResults = okrs.reduce((sum, okr) => sum + okr.keyResults.length, 0);
  const achievedKeyResults = okrs.reduce((sum, okr) => 
    sum + okr.keyResults.filter(kr => kr.status === 'achieved').length, 0
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/repo/personal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Personal Repo
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              OKR Management
            </h1>
            <p className="text-gray-400 mt-1">Set objectives and track your professional growth</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={exportOKRs}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
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

        {/* Privacy Notice */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-300 mb-1">Personal Repo - Private by Default</h3>
            <p className="text-sm text-gray-300">
              Your OKRs are stored in your Personal Repository and are private by default. 
              You can choose to share specific OKRs with your coach, mentor, or accountability group.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{activeOKRs.length}</div>
            <div className="text-sm text-gray-400">Active OKRs</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedOKRs.length}</div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{totalKeyResults}</div>
            <div className="text-sm text-gray-400">Key Results</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {totalKeyResults > 0 ? Math.round((achievedKeyResults / totalKeyResults) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-400">Achievement Rate</div>
          </div>
        </div>

        {/* OKR Editor */}
        <OKREditor
          okrs={okrs}
          onChange={setOkrs}
          linkedAspirations={aspirations}
        />

        {/* Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 OKR Best Practices</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Set 3-5 objectives per quarter for focus</li>
            <li>• Each objective should have 3-5 measurable key results</li>
            <li>• Key results should be quantifiable (numbers, percentages, yes/no)</li>
            <li>• Aim for 70-80% achievement - 100% means targets were too easy</li>
            <li>• Review and update progress weekly for best results</li>
            <li>• Link OKRs to your future career aspirations for alignment</li>
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