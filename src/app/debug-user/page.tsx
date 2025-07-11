'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function DebugUserPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [testResult, setTestResult] = useState<any>(null);

  const testVisualization = async () => {
    if (!user) {
      setTestResult({ error: 'No user available' });
      return;
    }

    try {
      const response = await fetch('/api/surface-repo/visualize-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error: any) {
      setTestResult({ error: error?.toString() || 'Unknown error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug User ID</h1>
      
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Clerk User State</h2>
        <pre className="text-sm">
          {JSON.stringify({
            isLoaded,
            isSignedIn,
            userId: user?.id,
            email: user?.emailAddresses?.[0]?.emailAddress,
            name: user?.fullName
          }, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800 p-4 rounded mb-4">
        <button
          onClick={testVisualization}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 mb-2"
        >
          Test Visualization Endpoint
        </button>
        
        {testResult && (
          <pre className="text-sm mt-2">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Direct Links</h2>
        <div className="space-y-2">
          <a href="/repo/surface/edit" className="text-blue-400 hover:underline block">
            → Edit Surface Repo
          </a>
          <a href="/visualization/3d/surface-repo" className="text-blue-400 hover:underline block">
            → Surface Repo Visualization
          </a>
          <a href="/visualization/career-timeline" className="text-blue-400 hover:underline block">
            → Career Timeline
          </a>
          <a href="/visualization/skills-universe" className="text-blue-400 hover:underline block">
            → Skills Universe
          </a>
        </div>
      </div>
    </div>
  );
}