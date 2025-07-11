'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, CheckCircle } from 'lucide-react';

export default function QuickSetupPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const populateMyProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Add work experiences
      const experiences = [
        {
          id: 'exp1',
          title: 'Software Engineer',
          company: { name: 'Current Company', isValidated: true },
          startDate: '2021-06-01',
          isCurrent: true,
          isFuture: false,
          description: 'Building amazing products',
          achievements: [
            'Led development of key features',
            'Improved performance by 40%',
            'Mentored junior developers'
          ],
          skills: ['React', 'TypeScript', 'Node.js', 'AWS']
        },
        {
          id: 'exp2',
          title: 'Junior Developer',
          company: { name: 'Previous Startup', isValidated: true },
          startDate: '2019-03-01',
          endDate: '2021-05-01',
          isCurrent: false,
          isFuture: false,
          description: 'Full stack development',
          achievements: [
            'Built customer portal from scratch',
            'Implemented CI/CD pipeline',
            'Reduced bugs by 60%'
          ],
          skills: ['JavaScript', 'React', 'Python', 'PostgreSQL']
        },
        {
          id: 'exp3',
          title: 'Senior Engineer',
          company: { name: 'Dream Company', isValidated: true },
          startDate: '2025-01-01',
          isCurrent: false,
          isFuture: true,
          targetDate: '2025-01-01',
          whyThisRole: 'Next step in my career growth',
          requiredSteps: [
            'Master system design',
            'Lead larger projects',
            'Contribute to open source'
          ],
          skillGaps: ['System Design', 'Leadership', 'Public Speaking'],
          progress: 45,
          description: 'Leading technical initiatives',
          achievements: [],
          skills: ['Architecture', 'Leadership', 'Strategy']
        }
      ];
      
      // Save experiences
      await fetch('/api/surface-repo/save-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: {
            name: user.fullName || 'Quest User',
            bio: 'Professional on a quest for growth',
            experience: experiences
          }
        })
      });
      
      // Add skills
      const skills = [
        { name: 'React', category: 'Technical', proficiency: 'Expert', yearsOfExperience: 4 },
        { name: 'TypeScript', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 3 },
        { name: 'Node.js', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 4 },
        { name: 'AWS', category: 'Technical', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { name: 'Python', category: 'Technical', proficiency: 'Intermediate', yearsOfExperience: 3 },
        { name: 'PostgreSQL', category: 'Technical', proficiency: 'Advanced', yearsOfExperience: 4 },
        { name: 'System Design', category: 'Technical', proficiency: 'Beginner', yearsOfExperience: 1 },
        { name: 'Project Management', category: 'Business', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { name: 'Team Leadership', category: 'Leadership', proficiency: 'Intermediate', yearsOfExperience: 2 },
        { name: 'Communication', category: 'Leadership', proficiency: 'Advanced', yearsOfExperience: 5 }
      ];
      
      await fetch('/api/deep-repo/working/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills })
      });
      
      setSuccess(true);
      
      // Redirect to visualization after 2 seconds
      setTimeout(() => {
        router.push('/visualization/career');
      }, 2000);
      
    } catch (error) {
      console.error('Error populating profile:', error);
    }
    
    setLoading(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Created!</h2>
          <p className="text-gray-400">Redirecting to your visualizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Quick Profile Setup</h1>
          <p className="text-gray-400 mb-6">
            Let's add some data to your profile so you can see your personalized visualizations!
          </p>
          
          <div className="bg-gray-700 rounded p-4 mb-6 text-left text-sm">
            <p className="font-medium mb-2">This will add:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• 2 past work experiences</li>
              <li>• 1 current role</li>
              <li>• 1 future aspiration</li>
              <li>• 10 skills across categories</li>
            </ul>
          </div>
          
          <button
            onClick={populateMyProfile}
            disabled={loading || !user}
            className="w-full px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up your profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Set Up My Profile
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            You can edit all this data later in your profile settings
          </p>
        </div>
      </div>
    </div>
  );
}