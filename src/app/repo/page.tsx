'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserProfile {
  id: string;
  userId: string;
  surfaceRepo: any; // Public profile
  surfacePrivateRepo: any; // Private achievements for recruiters
  personalRepo: any; // OKRs, goals, coaching material
  deepRepo: any; // Trinity, big hairy goals
  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
}

export default function RepoPage() {
  const { userId } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('surface');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deep-repo');
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Error loading profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateTrinity = async () => {
    try {
      const response = await fetch('/api/deep-repo/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrateAll: false })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Trinity data migrated successfully!');
        fetchProfile();
      } else {
        alert(data.message || 'Migration failed');
      }
    } catch (err) {
      alert('Error migrating Trinity data');
      console.error(err);
    }
  };

  const handleSaveLayer = async (layer: string) => {
    try {
      const response = await fetch('/api/deep-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layer,
          data: editData[layer] || {},
          merge: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setEditMode(false);
        setEditData({});
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      alert('Error saving data');
      console.error(err);
    }
  };

  const renderLayerContent = (layer: string, data: any) => {
    const isEditing = editMode && activeTab === layer;
    
    if (!data || Object.keys(data).length === 0) {
      // Show helpful empty states based on layer
      if (layer === 'surfacePrivate') {
        return (
          <div className="text-gray-500 text-center py-8 space-y-4">
            <p>Share deeper achievements with select recruiters and connections</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card className="p-4 border-dashed">
                <h4 className="font-semibold mb-2">🏆 Quantified Achievements</h4>
                <p className="text-sm text-gray-600">Share real metrics: "Increased revenue by 47%"</p>
              </Card>
              <Card className="p-4 border-dashed">
                <h4 className="font-semibold mb-2">💰 Compensation History</h4>
                <p className="text-sm text-gray-600">Private salary expectations and history</p>
              </Card>
            </div>
          </div>
        );
      }
      if (layer === 'personal') {
        return (
          <div className="text-gray-500 text-center py-8 space-y-4">
            <p>Your coaching workspace - updated by AI during conversations</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 border-dashed">
                <h4 className="font-semibold mb-2">🎯 Personal OKRs</h4>
                <p className="text-sm text-gray-600">Objectives and key results for your career</p>
              </Card>
              <Card className="p-4 border-dashed">
                <h4 className="font-semibold mb-2">📈 Career Goals</h4>
                <p className="text-sm text-gray-600">Short and long-term professional goals</p>
              </Card>
              <Card className="p-4 border-dashed">
                <h4 className="font-semibold mb-2">🗣️ Coaching Notes</h4>
                <p className="text-sm text-gray-600">Insights from your AI coaching sessions</p>
              </Card>
            </div>
          </div>
        );
      }
      return (
        <div className="text-gray-500 text-center py-8">
          No data in this layer yet
        </div>
      );
    }

    if (isEditing) {
      return (
        <div className="space-y-4">
          {layer === 'surface' && (
            <>
              <div>
                <Label>Professional Headline</Label>
                <Input
                  value={editData[layer]?.professional_headline || data.professional_headline || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    [layer]: { ...editData[layer], professional_headline: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea
                  value={editData[layer]?.summary || data.summary || ''}
                  onChange={(e) => setEditData({
                    ...editData,
                    [layer]: { ...editData[layer], summary: e.target.value }
                  })}
                  rows={4}
                />
              </div>
            </>
          )}
          
          <div className="flex gap-2">
            <Button onClick={() => handleSaveLayer(layer)}>Save</Button>
            <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      );
    }

    // Display mode
    if (layer === 'deep' && data.trinity) {
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Your Trinity</h4>
            <div className="space-y-4">
              <Card className="p-4">
                <Badge variant="outline" className="mb-2">Quest ({data.trinity.type})</Badge>
                <p className="text-sm font-medium">{data.trinity.quest}</p>
              </Card>
              <Card className="p-4">
                <Badge variant="outline" className="mb-2">Service</Badge>
                <p className="text-sm font-medium">{data.trinity.service}</p>
              </Card>
              <Card className="p-4">
                <Badge variant="outline" className="mb-2">Pledge</Badge>
                <p className="text-sm font-medium">{data.trinity.pledge}</p>
              </Card>
            </div>
          </div>
          {data.coachingPreferences && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">AI Coaching Preferences</h4>
              <p className="text-sm text-gray-600">Methodology: {data.coachingPreferences.methodology || 'Default'}</p>
              <p className="text-sm text-gray-600">Tone: {data.coachingPreferences.tone || 'Supportive'}</p>
            </div>
          )}
        </div>
      );
    }

    // Surface Private repo structured display
    if (layer === 'surfacePrivate') {
      return (
        <div className="space-y-6">
          {data.achievements && (
            <div>
              <h4 className="font-semibold mb-3">🏆 Quantified Achievements</h4>
              <div className="space-y-3">
                {data.achievements.map((achievement: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-2">
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {achievement.metrics?.map((metric: string, midx: number) => (
                          <Badge key={midx} variant="secondary">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {data.compensation && (
            <div>
              <h4 className="font-semibold mb-3">💰 Compensation Expectations</h4>
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Expected Range:</span>
                    <span className="font-medium">{data.compensation.expectedRange}</span>
                  </div>
                  {data.compensation.previousRoles && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600 mb-2">History (Private)</p>
                      {data.compensation.previousRoles.map((role: any, idx: number) => (
                        <div key={idx} className="text-sm mb-1">
                          {role.company}: {role.compensation}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
          
          {data.references && (
            <div>
              <h4 className="font-semibold mb-3">👥 Private References</h4>
              <div className="space-y-2">
                {data.references.map((ref: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <p className="font-medium text-sm">{ref.name}</p>
                    <p className="text-xs text-gray-600">{ref.relationship} • {ref.contact}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Fallback to JSON if structure is different */}
          {!data.achievements && !data.compensation && !data.references && (
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    // Personal repo structured display
    if (layer === 'personal') {
      return (
        <div className="space-y-6">
          {data.futureExperiences && (
            <div>
              <h4 className="font-semibold mb-3">🚀 Future Aspirations</h4>
              <div className="space-y-2">
                {data.futureExperiences.map((exp: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{exp.title}</p>
                        <p className="text-sm text-gray-600">{exp.company} • {exp.timeframe}</p>
                      </div>
                      <Badge variant="secondary">{exp.priority}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {data.okrs && (
            <div>
              <h4 className="font-semibold mb-3">📊 Personal OKRs</h4>
              <div className="space-y-2">
                {data.okrs.map((okr: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <p className="font-medium mb-2">{okr.objective}</p>
                    <Progress value={okr.progress || 0} className="mb-2" />
                    <p className="text-xs text-gray-600">{okr.keyResults?.length || 0} key results</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {data.goals && (
            <div>
              <h4 className="font-semibold mb-3">🎯 Career Goals</h4>
              <div className="space-y-2">
                {data.goals.map((goal: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <p className="text-sm">{goal.description}</p>
                    <p className="text-xs text-gray-600 mt-1">Target: {goal.targetDate}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Fallback to JSON if structure is different */}
          {!data.futureExperiences && !data.okrs && !data.goals && (
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      );
    }

    return (
      <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading Deep Repo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>My Repository</CardTitle>
              <CardDescription>
                Your complete professional repository - from public profile to deepest aspirations
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">Profile Completeness</div>
              <Progress value={profile?.profileCompleteness || 0} className="w-32" />
              <div className="text-sm font-semibold mt-1">{profile?.profileCompleteness || 0}%</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMigrateTrinity}
            >
              Migrate Trinity Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditMode(!editMode);
                setEditData({});
              }}
            >
              {editMode ? 'Cancel Edit' : 'Edit Mode'}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="surface">
                Surface
                <Badge variant="outline" className="ml-2 text-xs">Public</Badge>
              </TabsTrigger>
              <TabsTrigger value="surfacePrivate">
                Surface
                <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
              </TabsTrigger>
              <TabsTrigger value="personal">
                Personal
                <Badge variant="outline" className="ml-2 text-xs">Goals</Badge>
              </TabsTrigger>
              <TabsTrigger value="deep">
                Deep
                <Badge variant="outline" className="ml-2 text-xs">Core</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="surface" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Surface Repository</CardTitle>
                  <CardDescription>
                    Your public professional profile - what everyone can see (like LinkedIn)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('surface', profile?.surfaceRepo)}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="surfacePrivate" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Surface Repository (Private)</CardTitle>
                  <CardDescription>
                    Deeper achievements and metrics - visible only to recruiters and connections you approve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('surfacePrivate', profile?.surfacePrivateRepo)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Repository</CardTitle>
                  <CardDescription>
                    Your coaching workspace - OKRs, goals, and material for deep career conversations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('personal', profile?.personalRepo)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deep" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Deep Repository</CardTitle>
                  <CardDescription>
                    Your core identity - Trinity, life mission, and deepest professional aspirations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('deep', profile?.deepRepo)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-xs text-gray-500">
            Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Never'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}