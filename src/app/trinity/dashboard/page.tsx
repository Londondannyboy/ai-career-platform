'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface TrinityData {
  id: string;
  quest: string;
  service: string;
  pledge: string;
  trinity_type: 'F' | 'L' | 'M';
  trinity_type_description: string;
  quest_seal: string;
  created_at: string;
  ritual_completed_at: string;
}

interface CoachingPreferences {
  quest_focus: number;
  service_focus: number;
  pledge_focus: number;
  coaching_methodology: string;
  coaching_tone: string;
  context_awareness_level: string;
  voice_enabled: boolean;
}

export default function TrinityDashboard() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [trinityData, setTrinityData] = useState<TrinityData | null>(null);
  const [coachingPreferences, setCoachingPreferences] = useState<CoachingPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (isSignedIn) {
      fetchTrinityData();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchTrinityData = async () => {
    try {
      const response = await fetch('/api/trinity');
      const data = await response.json();
      
      if (data.has_trinity) {
        setTrinityData(data.trinity_statement);
        setCoachingPreferences(data.coaching_preferences);
      } else {
        router.push('/trinity/create');
      }
    } catch (error) {
      console.error('Error fetching Trinity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrinityTypeIcon = (type: 'F' | 'L' | 'M') => {
    switch (type) {
      case 'F': return '🗿';
      case 'L': return '🌱';
      case 'M': return '⚖️';
      default: return '🔺';
    }
  };

  const getTrinityTypeLabel = (type: 'F' | 'L' | 'M') => {
    switch (type) {
      case 'F': return 'Foundation Quest';
      case 'L': return 'Living Trinity';
      case 'M': return 'Mixed Approach';
      default: return 'Unknown';
    }
  };

  const getTrinityTypeColor = (type: 'F' | 'L' | 'M') => {
    switch (type) {
      case 'F': return 'text-stone-300 border-stone-400';
      case 'L': return 'text-green-300 border-green-400';
      case 'M': return 'text-purple-300 border-purple-400';
      default: return 'text-gray-300 border-gray-400';
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your Trinity...</p>
        </div>
      </div>
    );
  }

  if (!trinityData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-300 mb-4">No Trinity Found</h1>
          <p className="text-gray-400 mb-6">You haven't completed your Trinity ritual yet.</p>
          <button
            onClick={() => router.push('/trinity/create')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Create Your Trinity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-green-400 to-purple-400 bg-clip-text text-transparent">
                Your Trinity
              </h1>
              <p className="text-gray-400">
                Created {new Date(trinityData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg border ${getTrinityTypeColor(trinityData.trinity_type)}`}>
                <span className="text-2xl mr-2">{getTrinityTypeIcon(trinityData.trinity_type)}</span>
                <span className="font-semibold">{getTrinityTypeLabel(trinityData.trinity_type)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trinity Visualization */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="w-32 h-32 mx-auto mb-6 relative">
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
                    strokeWidth="4"
                  />
                  <circle cx="50" cy="35" r="4" fill="#3B82F6" />
                  <circle cx="70" cy="65" r="4" fill="#10B981" />
                  <circle cx="30" cy="65" r="4" fill="#8B5CF6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Your Professional Trinity</h2>
              <p className="text-gray-400 mb-6">{trinityData.trinity_type_description}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Quest */}
              <div className="bg-blue-900/20 border border-blue-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-blue-400 mr-3"></span>
                  Quest
                </h3>
                <p className="text-gray-300 leading-relaxed">{trinityData.quest}</p>
              </div>

              {/* Service */}
              <div className="bg-green-900/20 border border-green-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-green-400 mr-3"></span>
                  Service
                </h3>
                <p className="text-gray-300 leading-relaxed">{trinityData.service}</p>
              </div>

              {/* Pledge */}
              <div className="bg-purple-900/20 border border-purple-400/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center">
                  <span className="w-4 h-4 rounded-full bg-purple-400 mr-3"></span>
                  Pledge
                </h3>
                <p className="text-gray-300 leading-relaxed">{trinityData.pledge}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coaching Preferences */}
        {coachingPreferences && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Coaching Preferences</h2>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showPreferences ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {/* Trinity Focus Distribution */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Trinity Focus Distribution</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-20 text-blue-300 font-medium">Quest</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 mr-4">
                      <div 
                        className="bg-blue-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${coachingPreferences.quest_focus}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-gray-400">{coachingPreferences.quest_focus}%</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-20 text-green-300 font-medium">Service</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 mr-4">
                      <div 
                        className="bg-green-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${coachingPreferences.service_focus}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-gray-400">{coachingPreferences.service_focus}%</div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-20 text-purple-300 font-medium">Pledge</div>
                    <div className="flex-1 bg-gray-700 rounded-full h-3 mr-4">
                      <div 
                        className="bg-purple-400 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${coachingPreferences.pledge_focus}%` }}
                      ></div>
                    </div>
                    <div className="w-12 text-right text-gray-400">{coachingPreferences.pledge_focus}%</div>
                  </div>
                </div>
              </div>

              {showPreferences && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Coaching Style</h4>
                    <p className="text-gray-400 capitalize">{coachingPreferences.coaching_methodology}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Coaching Tone</h4>
                    <p className="text-gray-400 capitalize">{coachingPreferences.coaching_tone}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Context Awareness</h4>
                    <p className="text-gray-400 capitalize">{coachingPreferences.context_awareness_level}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Voice Enabled</h4>
                    <p className="text-gray-400">{coachingPreferences.voice_enabled ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quest Seal */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Quest Seal</h2>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
              <p className="text-xs text-gray-400 mb-2">Cryptographic commitment hash (SHA-256):</p>
              <p className="font-mono text-sm text-blue-400 break-all">{trinityData.quest_seal}</p>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              This seal represents your cryptographic commitment to your Trinity statements.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push('/quest/enhanced')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start Trinity Coaching
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}