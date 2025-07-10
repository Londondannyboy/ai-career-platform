'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PopulateProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sampleData = {
    surface: {
      experience: [
        {
          id: 'exp-1',
          title: 'Senior Software Engineer',
          company: { name: 'Tech Corp', industry: 'Technology' },
          startDate: '2022-01-01',
          endDate: null,
          isCurrent: true,
          isFuture: false,
          progress: 0,
          skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
          achievements: [
            'Led migration to microservices architecture',
            'Improved API performance by 40%',
            'Mentored 3 junior developers'
          ],
          whyThisRole: 'Opportunity to work on large-scale systems',
          requiredSteps: []
        },
        {
          id: 'exp-2',
          title: 'Software Engineer',
          company: { name: 'StartupXYZ', industry: 'FinTech' },
          startDate: '2020-06-01',
          endDate: '2021-12-31',
          isCurrent: false,
          isFuture: false,
          progress: 0,
          skills: ['JavaScript', 'Python', 'Docker', 'PostgreSQL'],
          achievements: [
            'Built payment processing system from scratch',
            'Implemented CI/CD pipeline',
            'Reduced deployment time by 60%'
          ]
        },
        {
          id: 'exp-3',
          title: 'Principal Architect',
          company: { name: 'Dream Company', industry: 'Cloud Computing' },
          startDate: '2025-01-01',
          endDate: null,
          isCurrent: false,
          isFuture: true,
          progress: 25,
          skills: ['System Design', 'Cloud Architecture', 'Leadership', 'Strategy'],
          achievements: [],
          whyThisRole: 'Lead technical vision for cloud platform',
          requiredSteps: [
            'Complete AWS Solutions Architect certification',
            'Gain experience with large-scale distributed systems',
            'Build leadership skills through team management'
          ]
        }
      ]
    },
    working: {
      skills: [
        { id: 'skill-1', name: 'React', category: 'Technical', proficiency: 'Expert', yearsOfExperience: 5 },
        { id: 'skill-2', name: 'TypeScript', category: 'Technical', proficiency: 'Expert', yearsOfExperience: 4 },
        { id: 'skill-3', name: 'Node.js', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 4 },
        { id: 'skill-4', name: 'AWS', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 3 },
        { id: 'skill-5', name: 'Python', category: 'Technical', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { id: 'skill-6', name: 'Docker', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 3 },
        { id: 'skill-7', name: 'PostgreSQL', category: 'Data & Analytics', proficiency: 'Advanced', yearsOfExperience: 4 },
        { id: 'skill-8', name: 'System Design', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 3 },
        { id: 'skill-9', name: 'Project Management', category: 'Business', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { id: 'skill-10', name: 'Team Leadership', category: 'Leadership', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { id: 'skill-11', name: 'Agile/Scrum', category: 'Business', proficiency: 'Advanced', yearsOfExperience: 4 },
        { id: 'skill-12', name: 'Technical Writing', category: 'Creative', proficiency: 'Intermediate', yearsOfExperience: 3 }
      ]
    }
  };

  const populateData = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage('');

    try {
      // Update surface repo (experiences)
      const surfaceResponse = await fetch('/api/surface-repo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData.surface)
      });

      if (!surfaceResponse.ok) {
        throw new Error('Failed to save surface data');
      }

      // Update working repo (skills)
      const workingResponse = await fetch('/api/deep-repo/working', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: sampleData.working })
      });

      if (!workingResponse.ok) {
        throw new Error('Failed to save working data');
      }

      setMessage('Sample data populated successfully! Redirecting to visualizations...');
      
      // Redirect to career timeline after 2 seconds
      setTimeout(() => {
        router.push('/visualization/career-timeline');
      }, 2000);

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Authenticated</h2>
          <p className="text-gray-400">Please sign in to populate your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Populate Profile with Sample Data</h1>
        <p className="text-gray-400 mb-8">
          This will add sample career experiences and skills to your profile so you can see the 3D visualizations in action.
        </p>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">What will be added:</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Career Experiences:</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Current: Senior Software Engineer at Tech Corp</li>
                <li>• Past: Software Engineer at StartupXYZ</li>
                <li>• Future Goal: Principal Architect at Dream Company</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Skills (12 total):</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Technical: React, TypeScript, Node.js, AWS, etc.</li>
                <li>• Business: Project Management, Agile/Scrum</li>
                <li>• Leadership: Team Leadership</li>
                <li>• Creative: Technical Writing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={populateData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Populating...' : 'Populate Sample Data'}
          </button>

          <button
            onClick={() => router.push('/visualization/career-timeline')}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium"
          >
            Go to Visualizations
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}