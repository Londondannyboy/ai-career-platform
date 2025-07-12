'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function TestSavePage() {
  const { user } = useUser();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testSave = async () => {
    if (!user) {
      setResponse('Not logged in');
      return;
    }

    setLoading(true);
    setResponse('Testing save...');

    try {
      const testData = {
        professional_headline: 'Test Engineer ' + Date.now(),
        summary: 'This is a test profile',
        experiences: [
          {
            id: '1',
            title: 'Test Engineer',
            company: 'Test Company',
            startDate: '2023-01',
            current: true,
            description: 'Testing the save functionality'
          }
        ],
        skills: ['JavaScript', 'Testing', 'Debugging'],
        education: [
          {
            id: '1',
            institution: 'Test University',
            degree: 'BS',
            field: 'Computer Science',
            endDate: '2022-05'
          }
        ]
      };

      console.log('Sending test data:', testData);

      const res = await fetch('/api/deep-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id
        },
        body: JSON.stringify({
          layer: 'surface',
          data: testData,
          merge: false
        })
      });

      const result = await res.json();
      
      setResponse(`
Status: ${res.status}
Response: ${JSON.stringify(result, null, 2)}

${res.ok ? '✅ Save successful!' : '❌ Save failed!'}
      `);

      // If save worked, try to load it back
      if (res.ok) {
        setTimeout(async () => {
          setResponse(prev => prev + '\n\nLoading data back...');
          
          const loadRes = await fetch('/api/deep-repo', {
            headers: {
              'X-User-Id': user.id
            }
          });

          const loadData = await loadRes.json();
          
          setResponse(prev => prev + '\n\nLoaded data:\n' + 
            JSON.stringify(loadData.profile?.surfaceRepo, null, 2));
        }, 1000);
      }
    } catch (error: any) {
      setResponse('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Save Functionality</h1>
        
        <div className="space-y-4">
          <p className="text-gray-400">
            User ID: {user?.id || 'Not logged in'}
          </p>

          <button
            onClick={testSave}
            disabled={loading || !user}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Save'}
          </button>

          {response && (
            <pre className="bg-gray-900 p-4 rounded overflow-auto">
              {response}
            </pre>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>This page tests the save functionality directly.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
}