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
  surfaceRepo: any;
  workingRepo: any;
  personalRepo: any;
  deepRepo: any;
  profileCompleteness: number;
  createdAt: string;
  updatedAt: string;
}

export default function DeepRepoPage() {
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
            <h4 className="font-semibold mb-2">Trinity</h4>
            <div className="space-y-2">
              <div>
                <Badge variant="outline" className="mb-1">Quest ({data.trinity.type})</Badge>
                <p className="text-sm">{data.trinity.quest}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Service</Badge>
                <p className="text-sm">{data.trinity.service}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">Pledge</Badge>
                <p className="text-sm">{data.trinity.pledge}</p>
              </div>
            </div>
          </div>
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
              <CardTitle>Deep Repository</CardTitle>
              <CardDescription>
                Manage your tiered profile data across four privacy layers
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
              <TabsTrigger value="working">
                Working
                <Badge variant="outline" className="ml-2 text-xs">Professional</Badge>
              </TabsTrigger>
              <TabsTrigger value="personal">
                Personal
                <Badge variant="outline" className="ml-2 text-xs">Peers</Badge>
              </TabsTrigger>
              <TabsTrigger value="deep">
                Deep
                <Badge variant="outline" className="ml-2 text-xs">Private</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="surface" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Surface Repository</CardTitle>
                  <CardDescription>
                    Public profile information visible to everyone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('surface', profile?.surfaceRepo)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="working" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Working Repository</CardTitle>
                  <CardDescription>
                    Professional depth shared with recruiters and hiring managers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderLayerContent('working', profile?.workingRepo)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Repository</CardTitle>
                  <CardDescription>
                    Authentic sharing with peers and coaches
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
                    Your Trinity, life goals, and deeply personal mission
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