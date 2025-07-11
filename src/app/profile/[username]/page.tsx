'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Share2, Eye, EyeOff } from 'lucide-react';

// Dynamic imports for 3D visualizations
const SurfaceRepoVisualization = dynamic(
  () => import('@/components/visualizations/SurfaceRepoVisualization'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading visualization...</div> }
);

const CareerTimelineVisualization = dynamic(
  () => import('@/components/visualizations/CareerTimelineVisualization'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading timeline...</div> }
);

const SkillsUniverseVisualization = dynamic(
  () => import('@/components/visualizations/SkillsUniverseVisualization'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading skills universe...</div> }
);

const TrinityVisualization = dynamic(
  () => import('@/components/visualizations/TrinityVisualization'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading Trinity...</div> }
);

const SkillIntelligence = dynamic(
  () => import('@/components/ai/SkillIntelligence'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading AI insights...</div> }
);

const SkillRelationshipGraph = dynamic(
  () => import('@/components/skills/SkillRelationshipGraph'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading skill relationships...</div> }
);

const SkillLearningPath = dynamic(
  () => import('@/components/skills/SkillLearningPath'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading learning paths...</div> }
);

const CareerRecommendations = dynamic(
  () => import('@/components/ai/CareerRecommendations'),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center">Loading career recommendations...</div> }
);

interface ProfileData {
  username: string;
  name: string;
  headline: string;
  imageUrl?: string;
  surface: any;
  hasPrivateAccess: boolean;
  surfacePrivate?: any;
  personal?: any;
  deep?: any;
  stats: {
    experiences: number;
    skills: number;
    achievements: number;
    completeness: number;
  };
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPrivate, setShowPrivate] = useState(false);

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const isOwnProfile = user?.username === username || user?.id === username;
      
      // Fetch real user data from API
      const response = await fetch('/api/deep-repo', {
        headers: {
          'X-User-Id': username // Try username as user ID
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      if (data.success && data.profile) {
        const profile = data.profile;
        
        setProfile({
          username,
          name: profile.surfaceRepo?.professional_headline?.split('|')[0]?.trim() || username,
          headline: profile.surfaceRepo?.professional_headline || 'Professional',
          imageUrl: user?.imageUrl,
          surface: {
            experiences: profile.surfaceRepo?.experiences || [],
            skills: profile.surfaceRepo?.skills || [],
            education: profile.surfaceRepo?.education || []
          },
          hasPrivateAccess: isOwnProfile,
          surfacePrivate: isOwnProfile ? {
            achievements: profile.surfacePrivateRepo?.achievements || []
          } : null,
          personal: isOwnProfile ? {
            okrs: profile.personalRepo?.okrs || [],
            futureExperiences: profile.personalRepo?.futureExperiences || [],
            goals: profile.personalRepo?.goals || []
          } : null,
          deep: isOwnProfile ? {
            trinity: profile.deepRepo?.trinity || null
          } : null,
          stats: {
            experiences: profile.surfaceRepo?.experiences?.length || 0,
            skills: profile.surfaceRepo?.skills?.length || 0,
            achievements: profile.surfacePrivateRepo?.achievements?.length || 0,
            completeness: profile.profileCompleteness || 0
          }
        });
      } else {
        throw new Error('No profile data found');
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600">{error || 'Profile not found'}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {profile.imageUrl && (
                <img 
                  src={profile.imageUrl} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-gray-600">{profile.headline}</p>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Profile Completeness</div>
                <Progress value={profile.stats.completeness} className="w-32 mt-1" />
                <div className="text-xs font-semibold mt-1">{profile.stats.completeness}%</div>
              </div>
              {isOwnProfile && (
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.stats.experiences}</div>
              <div className="text-sm text-gray-600">Experiences</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.stats.skills}</div>
              <div className="text-sm text-gray-600">Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{profile.stats.achievements}</div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="ai">AI Insights</TabsTrigger>}
          {isOwnProfile && <TabsTrigger value="trinity">Trinity</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Current Role</h4>
                    <p>{profile.surface.experiences[0]?.title} at {profile.surface.experiences[0]?.company}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Top Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.surface.skills.slice(0, 5).map((skill: string) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {profile.hasPrivateAccess && profile.surfacePrivate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Private Achievements
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPrivate(!showPrivate)}
                    >
                      {showPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {showPrivate ? (
                    <div className="space-y-3">
                      {profile.surfacePrivate.achievements.map((achievement: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded">
                          <p className="font-medium">{achievement.title}</p>
                          <p className="text-sm text-gray-600">{achievement.metric}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Click to reveal private achievements</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="network" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Network</CardTitle>
              <CardDescription>
                Interactive 3D visualization of professional connections and experiences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] bg-gray-50 rounded">
                <SurfaceRepoVisualization username={username} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Career Timeline</CardTitle>
              <CardDescription>
                Journey through past experiences and future aspirations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] bg-gray-50 rounded">
                <CareerTimelineVisualization username={username} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Relationships & Clusters</CardTitle>
                <CardDescription>
                  Discover how your skills connect and which complementary skills to learn next
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkillRelationshipGraph 
                  skills={profile.surface.skills} 
                  height={400}
                />
              </CardContent>
            </Card>
            
            {isOwnProfile && (
              <SkillLearningPath 
                currentSkills={profile.surface.skills}
                onSkillSelect={(skill) => {
                  // Could integrate with repo update to add to learning goals
                  console.log('Selected skill for learning:', skill);
                }}
              />
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Skills Universe</CardTitle>
                <CardDescription>
                  Explore skill clusters and relationships in 3D space
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] bg-gray-50 rounded">
                  <SkillsUniverseVisualization username={username} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="ai" className="mt-6">
            <div className="space-y-6">
              <CareerRecommendations 
                profile={{
                  currentRole: profile.surface.experiences.find((exp: any) => exp.current),
                  experiences: profile.surface.experiences || [],
                  futureExperiences: profile.personal?.futureExperiences || [],
                  skills: profile.surface.skills || [],
                  education: profile.surface.education || [],
                  okrs: profile.personal?.okrs || [],
                  trinity: profile.deep?.trinity
                }}
                onRecommendationSelect={(rec) => {
                  console.log('Selected recommendation:', rec);
                  // Could integrate with repo update to add to goals
                }}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Skill Intelligence</CardTitle>
                  <CardDescription>
                    Advanced skill analysis and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SkillIntelligence userId={user?.id} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {isOwnProfile && (
          <TabsContent value="trinity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Trinity</CardTitle>
                <CardDescription>
                  The three eternal questions that define your professional identity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] bg-gray-50 rounded">
                  <TrinityVisualization trinity={profile.deep?.trinity} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}// Force redeploy Fri 11 Jul 2025 15:31:06 BST
