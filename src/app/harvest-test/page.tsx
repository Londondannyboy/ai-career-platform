'use client';

import { useState } from 'react';

export default function HarvestTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test/harvest-vanilla');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">HarvestAPI Test</h1>
      <p className="mb-4 text-gray-600">Testing HarvestAPI with CK Delta company data</p>
      
      <div className="mb-8">
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Running Test...' : 'Test HarvestAPI'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Success! Found {results.employeeCount} employees from {results.company}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Employees Found:</h2>
            <div className="grid gap-4">
              {results.employees.map((emp: any, index: number) => (
                <div key={index} className="border p-4 rounded bg-white shadow-sm">
                  <h3 className="font-semibold text-lg">{emp.name}</h3>
                  <p className="text-gray-600 mb-2">{emp.title}</p>
                  {emp.hasRecommendations && (
                    <p className="text-sm text-blue-600 mb-2">
                      📝 {emp.recommendationCount} LinkedIn recommendations
                    </p>
                  )}
                  <a 
                    href={emp.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View LinkedIn Profile →
                  </a>
                </div>
              ))}
            </div>
          </div>

          <details className="mt-8">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              🔍 View Raw Data Sample (First Employee)
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto text-xs">
              {JSON.stringify(results.rawDataSample, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}