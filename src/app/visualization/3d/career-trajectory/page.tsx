'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import CareerTrajectory3D from '@/components/visualization/CareerTrajectory3D';

export default function CareerTrajectoryPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadProfile();
    }
  }, [isLoaded, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deep-repo', {
        headers: {
          'X-User-Id': user?.id || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <p className="text-gray-400">No profile data found. Please complete your profile first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from profile
  const experiences = profileData.surfaceRepo?.experiences || [];
  const futureExperiences = profileData.personalRepo?.futureExperiences || [];
  const education = profileData.surfaceRepo?.education || [];
  const skills = profileData.surfaceRepo?.skills || [];
  const achievements = profileData.surfacePrivateRepo?.achievements || [];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto py-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Career Trajectory</CardTitle>
            <CardDescription>
              Your professional journey visualized in 3D - past, present, and future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] bg-gray-950 rounded-lg">
              <CareerTrajectory3D
                experiences={experiences}
                futureExperiences={futureExperiences}
                education={education}
                skills={skills}
                achievements={achievements}
              />
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-2">Timeline View</h4>
                  <p className="text-sm text-gray-400">
                    Your career progresses along the X-axis, with education below and skills above
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-2">Connections</h4>
                  <p className="text-sm text-gray-400">
                    Lines show relationships between education, experiences, and skills
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-2">Future Path</h4>
                  <p className="text-sm text-gray-400">
                    Amber nodes represent your career aspirations and goals
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}