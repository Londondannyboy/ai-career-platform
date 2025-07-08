'use client';

import { useState } from 'react';

export default function TrinityInitPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);

  const initializeTrinity = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/admin/init-trinity');
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setResult(data);
      } else {
        setStatus('error');
        setResult(data);
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: 'Failed to initialize Trinity database' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Initialize Trinity Database</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Trinity Database Setup</h2>
          <p className="text-gray-300 mb-6">
            Click the button below to initialize the Trinity database tables in production.
            This needs to be done once before the Trinity system can be used.
          </p>
          
          <button
            onClick={initializeTrinity}
            disabled={status === 'loading'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {status === 'loading' ? 'Initializing...' : 'Initialize Trinity Database'}
          </button>
        </div>

        {status === 'loading' && (
          <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
            <p className="text-yellow-300">⏳ Initializing Trinity database schema...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
            <h3 className="text-green-300 font-semibold mb-2">✅ Success!</h3>
            <p className="text-green-300 mb-4">Trinity database initialized successfully!</p>
            
            {result.tables && (
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Tables Created:</h4>
                <ul className="list-disc list-inside text-sm text-green-200">
                  {result.tables.map((table: string) => (
                    <li key={table}>{table}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-green-200 text-sm">
              You can now visit <a href="/trinity/create" className="underline hover:text-green-100">/trinity/create</a> to test the Trinity system!
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/50 border border-red-600 rounded-lg p-4">
            <h3 className="text-red-300 font-semibold mb-2">❌ Error</h3>
            <p className="text-red-300 mb-4">Failed to initialize Trinity database</p>
            <pre className="bg-red-950/50 p-3 rounded text-sm text-red-200 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}