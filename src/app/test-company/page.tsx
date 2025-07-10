'use client';

import { useState } from 'react';

export default function TestCompanyPage() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [result, setResult] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);

  const createCompany = async () => {
    try {
      const response = await fetch('/api/test-company/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, website })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      
      if (data.success) {
        loadCompanies();
      }
    } catch (error) {
      setResult('Error: ' + error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/test-company/list');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Test Company Creation</h1>
      
      <div className="max-w-md space-y-4">
        <input
          type="text"
          placeholder="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded"
        />
        
        <input
          type="text"
          placeholder="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded"
        />
        
        <button
          onClick={createCompany}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Company
        </button>
        
        <button
          onClick={loadCompanies}
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 ml-2"
        >
          Load Companies
        </button>
      </div>
      
      {result && (
        <pre className="mt-8 p-4 bg-gray-800 rounded overflow-auto">
          {result}
        </pre>
      )}
      
      {companies.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl mb-4">Companies in Database:</h2>
          {companies.map((company, i) => (
            <div key={i} className="p-2 bg-gray-800 rounded mb-2">
              {company.name} - {company.domain}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}