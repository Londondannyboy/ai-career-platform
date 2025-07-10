'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Save, Loader2, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function RepoEditorPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'surface' | 'working' | 'personal' | 'deep'>('surface');
  const [repoData, setRepoData] = useState({
    surface: '',
    working: '',
    personal: '',
    deep: ''
  });

  const userId = user?.id || 'test-user-123';

  useEffect(() => {
    if (!isLoaded) return;
    
    // Fetch all repo layers
    Promise.all([
      fetch(`/api/deep-repo/surface?userId=${userId}`).then(r => r.json()),
      fetch(`/api/deep-repo/working?userId=${userId}`).then(r => r.json()),
      fetch(`/api/deep-repo/personal?userId=${userId}`).then(r => r.json()),
      fetch(`/api/deep-repo/deep?userId=${userId}`).then(r => r.json())
    ]).then(([surface, working, personal, deep]) => {
      setRepoData({
        surface: JSON.stringify(surface.data || {}, null, 2),
        working: JSON.stringify(working.data || {}, null, 2),
        personal: JSON.stringify(personal.data || {}, null, 2),
        deep: JSON.stringify(deep.data || {}, null, 2)
      });
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load repo data:', err);
      setLoading(false);
    });
  }, [isLoaded, userId]);

  const saveLayer = async (layer: keyof typeof repoData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/deep-repo/${layer}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          data: JSON.parse(repoData[layer])
        })
      });
      
      if (response.ok) {
        alert(`${layer} repo saved successfully!`);
      } else {
        alert('Failed to save');
      }
    } catch (error) {
      alert('Invalid JSON format');
    }
    setSaving(false);
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Repo Editor</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              User: {isSignedIn ? user.firstName || user.username : 'test-user-123'}
            </span>
            <div className="flex gap-2">
              <Link href="/repo/dashboard" className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Repository Dashboard
              </Link>
              <Link href="/visualization" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
                View Visualizations
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['surface', 'working', 'personal', 'deep'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-t-lg capitalize ${
                activeTab === tab 
                  ? 'bg-gray-700 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab} Repo
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold capitalize">{activeTab} Repo - JSONB Editor</h2>
            <button
              onClick={() => saveLayer(activeTab)}
              disabled={saving}
              className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save {activeTab}
            </button>
          </div>
          
          <textarea
            value={repoData[activeTab]}
            onChange={(e) => setRepoData(prev => ({ ...prev, [activeTab]: e.target.value }))}
            className="w-full h-96 bg-gray-900 text-gray-300 p-4 rounded font-mono text-sm"
            placeholder={`Enter ${activeTab} repo JSON data...`}
          />
          
          {/* Examples */}
          <div className="mt-4 text-sm text-gray-400">
            {activeTab === 'surface' && (
              <div>
                <p className="mb-2">Example Surface Repo (LinkedIn-style):</p>
                <pre className="bg-gray-900 p-2 rounded overflow-x-auto">{`{
  "headline": "Founder & CEO at Quest",
  "summary": "Building AI-powered professional networking",
  "experience": [
    {
      "title": "Founder & CEO",
      "company": "Quest",
      "startDate": "2024-01",
      "current": true
    }
  ],
  "skills": ["AI", "Leadership", "Product Strategy"],
  "endorsements": {"AI": 45, "Leadership": 38}
}`}</pre>
              </div>
            )}
            
            {activeTab === 'deep' && (
              <div>
                <p className="mb-2">Example Deep Repo (Trinity):</p>
                <pre className="bg-gray-900 p-2 rounded overflow-x-auto">{`{
  "trinity": {
    "quest": "Build revolutionary technology",
    "service": "Create AI systems that amplify creativity",
    "pledge": "Deliver ethical, transparent solutions",
    "type": "F",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}`}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}