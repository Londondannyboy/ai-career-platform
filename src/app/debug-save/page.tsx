'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function DebugSavePage() {
  const { user, isLoaded } = useUser();
  const [testData, setTestData] = useState('');
  const [saveResult, setSaveResult] = useState('');
  const [loadResult, setLoadResult] = useState('');
  const [profileCheck, setProfileCheck] = useState('');

  useEffect(() => {
    checkProfile();
  }, [isLoaded]);

  const checkProfile = async () => {
    try {
      const response = await fetch('/api/debug/check-profile');
      const data = await response.json();
      setProfileCheck(JSON.stringify(data, null, 2));
    } catch (error) {
      setProfileCheck('Error checking profile: ' + error);
    }
  };

  const testSave = async () => {
    try {
      const saveData = {
        headline: 'Test Headline ' + Date.now(),
        summary: 'Test Summary',
        skills: [
          { name: 'JavaScript', category: 'technical', endorsed: 5 },
          { name: 'React', category: 'technical', endorsed: 3 }
        ],
        experience: [],
        endorsements: {
          'JavaScript': 5,
          'React': 3
        }
      };

      setTestData(JSON.stringify(saveData, null, 2));

      const response = await fetch('/api/surface-repo/save-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: saveData })
      });

      const result = await response.json();
      setSaveResult(JSON.stringify(result, null, 2) + '\n\nStatus: ' + response.status);
      
      // Check profile again after save
      setTimeout(checkProfile, 1000);
    } catch (error) {
      setSaveResult('Error: ' + error);
    }
  };

  const testLoad = async () => {
    try {
      const response = await fetch('/api/surface-repo/load-simple');
      const data = await response.json();
      setLoadResult(JSON.stringify(data, null, 2) + '\n\nStatus: ' + response.status);
    } catch (error) {
      setLoadResult('Error: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Save/Load Functionality</h1>
      
      <div className="mb-6">
        <p className="text-gray-400 mb-2">
          User: {user?.emailAddresses[0]?.emailAddress || 'Not signed in'} 
          (ID: {user?.id || 'None'})
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Profile Check</h2>
          <button
            onClick={checkProfile}
            className="mb-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Check Database Profile
          </button>
          <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs max-h-96">
            {profileCheck || 'Click to check...'}
          </pre>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Save</h2>
          <button
            onClick={testSave}
            className="mb-2 px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Test Save
          </button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Data to Save:</h3>
              <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                {testData || 'Click Test Save...'}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Save Result:</h3>
              <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                {saveResult || 'Click Test Save...'}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Load</h2>
          <button
            onClick={testLoad}
            className="mb-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            Test Load
          </button>
          <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs max-h-96">
            {loadResult || 'Click to load...'}
          </pre>
        </div>
      </div>
    </div>
  );
}