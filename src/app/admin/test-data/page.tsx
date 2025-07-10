'use client';

import React, { useState } from 'react';
import { Loader2, Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { generateTestData, saveTestData } from '@/scripts/generateTestData';
import { Toast } from '@/components/ui/toast';

export default function TestDataGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savedData, setSavedData] = useState<any>(null);

  const generatePreview = () => {
    setLoading(true);
    try {
      const data = generateTestData();
      setPreview(data);
      setShowToast({ message: 'Test data generated!', type: 'success' });
    } catch (error) {
      console.error('Error generating data:', error);
      setShowToast({ message: 'Failed to generate test data', type: 'error' });
    }
    setLoading(false);
  };

  const saveGeneratedData = async () => {
    if (!preview) {
      setShowToast({ message: 'Generate data first!', type: 'info' });
      return;
    }

    setLoading(true);
    try {
      const result = await saveTestData();
      setSavedData(result);
      setShowToast({ message: 'Test data saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving data:', error);
      setShowToast({ message: 'Failed to save test data', type: 'error' });
    }
    setLoading(false);
  };

  const clearAllData = async () => {
    if (!confirm('Are you sure you want to clear all repo data? This cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      // Clear each repo layer
      const clearPromises = [
        fetch('/api/deep-repo/surface', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {}, userId: 'test-user' })
        }),
        fetch('/api/deep-repo/working', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {}, userId: 'test-user' })
        }),
        fetch('/api/deep-repo/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {}, userId: 'test-user' })
        }),
        fetch('/api/deep-repo/deep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: {}, userId: 'test-user' })
        })
      ];

      await Promise.all(clearPromises);
      setPreview(null);
      setSavedData(null);
      setShowToast({ message: 'All data cleared!', type: 'success' });
    } catch (error) {
      console.error('Error clearing data:', error);
      setShowToast({ message: 'Failed to clear data', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-500" />
            Test Data Generator
          </h1>
          <p className="text-gray-400">
            Generate comprehensive test data to validate all Quest repository features
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-300 mb-1">Admin Only</h3>
              <p className="text-sm text-gray-300">
                This tool generates and saves test data to your repositories. 
                Use with caution as it will overwrite existing data.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={generatePreview}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Generate Test Data
          </button>
          
          <button
            onClick={saveGeneratedData}
            disabled={loading || !preview}
            className="px-6 py-3 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save to Repositories
          </button>
          
          <button
            onClick={clearAllData}
            disabled={loading}
            className="px-6 py-3 bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 ml-auto"
          >
            Clear All Data
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Generated Data Preview</h2>
            
            {/* Surface Repo Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-medium mb-3 text-blue-400">Surface Repository</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Name:</strong> {preview.surfaceRepo.name}</p>
                  <p><strong>Location:</strong> {preview.surfaceRepo.location}</p>
                  <p><strong>Email:</strong> {preview.surfaceRepo.contact.email}</p>
                </div>
                <div>
                  <p><strong>Work Experiences:</strong> {preview.surfaceRepo.experience.length}</p>
                  <p><strong>Current Role:</strong> {preview.surfaceRepo.experience.find((e: any) => e.isCurrent)?.title}</p>
                  <p><strong>Future Aspirations:</strong> {preview.surfaceRepo.experience.filter((e: any) => e.isFuture).length}</p>
                </div>
              </div>
            </div>

            {/* Working Repo Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-medium mb-3 text-green-400">Working Repository</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>Skills:</strong> {preview.workingRepo.skills.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Object.entries(
                      preview.workingRepo.skills.reduce((acc: any, skill: any) => {
                        acc[skill.category] = (acc[skill.category] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([cat, count]) => `${cat}: ${count}`).join(', ')}
                  </p>
                </div>
                <div>
                  <p><strong>Education:</strong> {preview.workingRepo.education.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {preview.workingRepo.education.filter((e: any) => e.isFuture).length} future planned
                  </p>
                </div>
                <div>
                  <p><strong>Certifications:</strong> {preview.workingRepo.certifications.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {preview.workingRepo.certifications.filter((c: any) => c.status === 'completed').length} completed
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Repo Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-medium mb-3 text-purple-400">Personal Repository</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>OKRs:</strong> {preview.personalRepo.okrs.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {preview.personalRepo.okrs.filter((o: any) => o.status === 'active').length} active
                  </p>
                </div>
                <div>
                  <p><strong>Goals:</strong> {preview.personalRepo.goals.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {preview.personalRepo.goals.reduce((sum: number, g: any) => sum + g.tasks.length, 0)} total tasks
                  </p>
                </div>
                <div>
                  <p><strong>Daily Plans:</strong> {preview.personalRepo.dailyPlans.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Last 7 days tracked
                  </p>
                </div>
              </div>
            </div>

            {/* Deep Repo Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-medium mb-3 text-red-400">Deep Repository (Trinity)</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Quest:</strong> "{preview.deepRepo.trinity.quest}"</p>
                <p><strong>Service:</strong> "{preview.deepRepo.trinity.service}"</p>
                <p><strong>Pledge:</strong> "{preview.deepRepo.trinity.pledge}"</p>
              </div>
            </div>

            {/* Sample Data */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-medium mb-3">Sample Generated Content</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-yellow-400 mb-2">Sample Skills</h4>
                  <div className="space-y-1">
                    {preview.workingRepo.skills.slice(0, 5).map((skill: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{skill.name}</span>
                        <span className="text-gray-400">{skill.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-400 mb-2">Sample OKR</h4>
                  {preview.personalRepo.okrs[0] && (
                    <div>
                      <p className="mb-2">{preview.personalRepo.okrs[0].objective}</p>
                      <ul className="space-y-1 text-xs text-gray-400">
                        {preview.personalRepo.okrs[0].keyResults.slice(0, 3).map((kr: any, i: number) => (
                          <li key={i}>• {kr.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {savedData && (
          <div className="mt-8 bg-green-900/20 border border-green-700 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-300 mb-2">Test Data Saved Successfully!</h3>
                <p className="text-sm text-gray-300 mb-4">
                  All repository layers have been populated with test data.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium text-green-300">Next Steps:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <a href="/repo/dashboard" className="bg-gray-800 p-3 rounded hover:bg-gray-700 flex items-center justify-between group">
                      <span>View Repository Dashboard</span>
                      <span className="text-gray-400 group-hover:text-white">→</span>
                    </a>
                    <a href="/repo/surface/edit" className="bg-gray-800 p-3 rounded hover:bg-gray-700 flex items-center justify-between group">
                      <span>Edit Surface Repo</span>
                      <span className="text-gray-400 group-hover:text-white">→</span>
                    </a>
                    <a href="/repo/personal/okr" className="bg-gray-800 p-3 rounded hover:bg-gray-700 flex items-center justify-between group">
                      <span>View OKRs</span>
                      <span className="text-gray-400 group-hover:text-white">→</span>
                    </a>
                    <a href="/repo/personal/goals" className="bg-gray-800 p-3 rounded hover:bg-gray-700 flex items-center justify-between group">
                      <span>View Goals & Tasks</span>
                      <span className="text-gray-400 group-hover:text-white">→</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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