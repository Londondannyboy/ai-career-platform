'use client';

import React, { useState } from 'react';

export default function CreateCompanyTestPage() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/public/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          website: website
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Success! Company "${data.company.name}" created with ID: ${data.company.id}`);
        setCompanyName('');
        setWebsite('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Network error');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Company (No Auth Test)</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-gray-800 px-4 py-2 rounded"
              placeholder="e.g., CK Delta"
              required
            />
          </div>

          <div>
            <label className="block mb-1">Website (optional)</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-gray-800 px-4 py-2 rounded"
              placeholder="e.g., www.ckdelta.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Company'}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded ${message.includes('✅') ? 'bg-green-800' : 'bg-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}