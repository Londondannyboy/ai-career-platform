'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import TrinityRitual from '@/components/trinity/TrinityRitual';

export default function TrinityCreatePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [showRitual, setShowRitual] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasExistingTrinity, setHasExistingTrinity] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (isSignedIn) {
      checkExistingTrinity();
    }
  }, [isLoaded, isSignedIn, router]);

  const checkExistingTrinity = async () => {
    try {
      const response = await fetch('/api/trinity');
      const data = await response.json();
      
      if (data.has_trinity) {
        setHasExistingTrinity(true);
      }
    } catch (error) {
      console.error('Error checking existing Trinity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrinityComplete = async (trinityData: {
    quest: string;
    service: string;
    pledge: string;
    trinity_type: 'F' | 'L' | 'M';
    trinity_type_description: string;
  }) => {
    setIsCreating(true);
    
    try {
      const response = await fetch('/api/trinity/debug-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...trinityData,
          ritual_session_id: null // Could be populated if created during voice session
        }),
      });

      const result = await response.json();

      console.log('Trinity creation response:', { ok: response.ok, status: response.status, result });
      
      if (response.ok && result.success) {
        console.log('✅ Trinity created successfully!', result);
        alert('Trinity created successfully! Redirecting to success page...');
        router.push('/trinity/success');
      } else {
        console.error('Trinity creation failed:', result);
        // Show detailed debug information
        const errorMsg = `Failed to create Trinity at step: ${result.step || 'unknown'}\n\nError: ${result.error || 'Unknown error'}\n\nDetails: ${result.details || 'No details'}\n\nAction: ${result.action || 'Try again'}`;
        
        // Check if it's a database table issue
        if (result.action && result.action.includes('/trinity/init')) {
          const shouldInit = confirm('Trinity database not initialized. Would you like to go to the initialization page now?');
          if (shouldInit) {
            router.push('/trinity/init');
            return;
          }
        } else {
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('Trinity creation error:', error);
      alert('Network error creating Trinity: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartRitual = () => {
    setShowRitual(true);
  };

  const handleCloseRitual = () => {
    setShowRitual(false);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasExistingTrinity) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon
                  points="50,10 90,80 10,80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-400"
                />
                <circle cx="50" cy="35" r="2" fill="currentColor" className="text-blue-400" />
                <circle cx="70" cy="65" r="2" fill="currentColor" className="text-green-400" />
                <circle cx="30" cy="65" r="2" fill="currentColor" className="text-purple-400" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Trinity Already Exists</h1>
            <p className="text-gray-400 mb-6">
              You already have an active Trinity statement. You can view and manage it from your dashboard.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={() => router.push('/trinity/dashboard')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
              >
                Go to Trinity Dashboard
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full"
              >
                Return to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center">
          <div className="mb-12">
            {/* Hero Section */}
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="trinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="50,10 90,80 10,80"
                    fill="none"
                    stroke="url(#trinityGradient)"
                    strokeWidth="3"
                    className="animate-pulse"
                  />
                  <circle cx="50" cy="35" r="3" fill="#3B82F6" className="animate-pulse" />
                  <circle cx="70" cy="65" r="3" fill="#10B981" className="animate-pulse" />
                  <circle cx="30" cy="65" r="3" fill="#8B5CF6" className="animate-pulse" />
                </svg>
              </div>
            </div>

            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
              Create Your Trinity
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your professional identity through the ancient ritual of three questions. 
              This is not registration—it's initiation into something extraordinary.
            </p>
          </div>

          {/* Pre-Ritual Information */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Why Trinity?</h3>
              <ul className="text-gray-400 space-y-2 text-left">
                <li>• Moves beyond transactional networking</li>
                <li>• Creates authentic professional connections</li>
                <li>• Enables AI coaching based on your true purpose</li>
                <li>• Generates sacred geometry visualization of your identity</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-green-300">What to Expect</h3>
              <ul className="text-gray-400 space-y-2 text-left">
                <li>• 10-15 minutes of thoughtful reflection</li>
                <li>• Three profound questions about your purpose</li>
                <li>• Choice between permanent or evolving identity</li>
                <li>• Cryptographic seal of your commitment</li>
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-900/20 via-green-900/20 to-purple-900/20 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Ready to Begin?</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              This ritual will create your professional Trinity—the foundation for all your 
              interactions on Quest. Take your time, be honest, and embrace the transformation.
            </p>
            
            <button
              onClick={handleStartRitual}
              disabled={isCreating}
              className="bg-gradient-to-r from-blue-500 via-green-500 to-purple-600 hover:from-blue-600 hover:via-green-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-4 rounded-lg font-semibold text-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Trinity...
                </span>
              ) : (
                'Begin Trinity Ritual'
              )}
            </button>
          </div>

          {/* Important Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              Your Trinity statements will be protected by our four-layer privacy system. 
              You control what is shared and with whom. This is your sacred professional space.
            </p>
          </div>
        </div>
      </div>

      {/* Trinity Ritual Modal */}
      {showRitual && (
        <TrinityRitual
          onComplete={handleTrinityComplete}
          onClose={handleCloseRitual}
        />
      )}
    </>
  );
}