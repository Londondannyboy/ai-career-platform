'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import skill graph
const SkillGraph = dynamic(() => import('@/components/conversation/MiniSkillGraph'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded animate-pulse" />
});

interface Skill {
  name: string;
  category: string;
  proficiency: string;
  isNew?: boolean;
}

export default function AddSkillPage() {
  const { user, isLoaded } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'technical',
    proficiency: 'intermediate'
  });

  // Load existing skills
  useEffect(() => {
    if (user?.id) {
      loadSkills();
    }
  }, [user?.id]);

  const loadSkills = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/skills?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        const userSkills = data.skills || [];
        setSkills(userSkills.map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name,
          category: typeof skill === 'object' ? skill.category || 'technical' : 'technical',
          proficiency: typeof skill === 'object' ? skill.proficiency || 'intermediate' : 'intermediate',
          isNew: typeof skill === 'object' ? skill.isNew || false : false
        })));
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async () => {
    if (!newSkill.name.trim() || !user?.id) return;

    // Check if skill already exists
    const exists = skills.some(skill => 
      skill.name.toLowerCase() === newSkill.name.toLowerCase()
    );

    if (exists) {
      alert('This skill already exists in your profile');
      return;
    }

    // Add skill to local state immediately for instant visualization
    const skillToAdd: Skill = {
      ...newSkill,
      name: newSkill.name.trim(),
      isNew: true
    };

    setSkills(prev => [...prev, skillToAdd]);

    // Clear form
    setNewSkill({
      name: '',
      category: 'technical',
      proficiency: 'intermediate'
    });

    // Save to database
    setSaving(true);
    try {
      await saveSkillToProfile(skillToAdd);
      
      // Mark as no longer new after a moment
      setTimeout(() => {
        setSkills(prev => prev.map(skill => 
          skill.name === skillToAdd.name ? { ...skill, isNew: false } : skill
        ));
      }, 3000);
    } catch (error) {
      console.error('Error saving skill:', error);
      // Remove from local state if save failed
      setSkills(prev => prev.filter(skill => skill.name !== skillToAdd.name));
      alert('Failed to save skill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveSkillToProfile = async (skill: Skill) => {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id,
        skill
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save skill');
    }
  };

  const removeSkill = async (skillName: string) => {
    if (!user?.id) return;

    // Remove from local state immediately
    setSkills(prev => prev.filter(skill => skill.name !== skillName));

    // Remove from database
    try {
      const response = await fetch('/api/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          skillName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove skill');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      // Re-add to local state if removal failed
      loadSkills();
    }
  };

  const getSkillConnections = (skillName: string) => {
    // Simple connection logic based on categories and common patterns
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return [];

    const connections = skills.filter(s => 
      s.name !== skillName && (
        s.category === skill.category ||
        isRelatedSkill(skillName, s.name)
      )
    );

    return connections;
  };

  const isRelatedSkill = (skill1: string, skill2: string) => {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    // Common skill relationships
    const relationships = [
      ['javascript', 'react', 'node.js', 'typescript'],
      ['python', 'django', 'flask', 'machine learning'],
      ['java', 'spring', 'maven', 'gradle'],
      ['aws', 'docker', 'kubernetes', 'devops'],
      ['sql', 'postgresql', 'mysql', 'database'],
      ['leadership', 'management', 'team building', 'communication'],
      ['project management', 'agile', 'scrum', 'planning']
    ];

    return relationships.some(group => 
      group.some(skill => s1.includes(skill)) && 
      group.some(skill => s2.includes(skill))
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please sign in to manage your skills.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Skills Visualizer
          </h1>
          <p className="mt-2 text-gray-600">
            Add skills and see immediate graph visualization with connections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Skill Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Skill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="skillName">Skill Name</Label>
                  <Input
                    id="skillName"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., React, Python, Leadership"
                    onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={newSkill.category} 
                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="proficiency">Proficiency</Label>
                  <Select 
                    value={newSkill.proficiency} 
                    onValueChange={(value) => setNewSkill(prev => ({ ...prev, proficiency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={addSkill}
                  disabled={!newSkill.name.trim() || saving}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? 'Adding...' : 'Add Skill'}
                </Button>
              </CardContent>
            </Card>

            {/* Skills List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Your Skills ({skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {skills.map((skill, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-2 rounded border transition-all ${
                        skill.isNew ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {skill.category}
                        </Badge>
                        <span className="font-medium">{skill.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {skill.proficiency}
                        </Badge>
                        {skill.isNew && (
                          <Badge className="text-xs bg-yellow-500">NEW</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {getSkillConnections(skill.name).length} connections
                        </span>
                        <Button
                          onClick={() => removeSkill(skill.name)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No skills yet. Add your first skill to see the visualization!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skills Graph Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Skills Network Graph
                  {skills.length > 0 && (
                    <Badge variant="secondary">
                      {skills.length} skills, {skills.reduce((acc, skill) => acc + getSkillConnections(skill.name).length, 0)} connections
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading your skills...</p>
                    </div>
                  </div>
                ) : (
                  <SkillGraph skills={skills} height={500} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}