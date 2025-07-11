'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Sparkles, 
  BookOpen,
  AlertCircle,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface SkillAnalysis {
  existingSkills: Array<{
    name: string;
    category: string;
    proficiency?: string;
    normalized: string;
  }>;
  suggestedSkills: Array<{
    name: string;
    category: string;
    reason: string;
    relevance: 'high' | 'medium' | 'low';
    learningPath?: string[];
  }>;
  skillGaps: Array<{
    category: string;
    missingSkills: string[];
    importance: 'critical' | 'important' | 'nice-to-have';
    relatedToGoals: boolean;
  }>;
  skillClusters: Array<{
    clusterName: string;
    skills: string[];
    strength: 'strong' | 'developing' | 'weak';
  }>;
  careerPathAlignment: {
    currentRole: string;
    suggestedNextRole: string;
    readinessScore: number;
    keySkillsNeeded: string[];
  };
}

interface Props {
  userId?: string;
  onSkillAdd?: (skill: { name: string; category: string }) => void;
}

export default function SkillIntelligence({ userId, onSkillAdd }: Props) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<SkillAnalysis | null>(null);
  const [categorizedSkills, setCategorizedSkills] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'gaps' | 'clusters' | 'path'>('suggestions');

  useEffect(() => {
    if (userId) {
      analyzeSkills();
    }
  }, [userId]);

  const analyzeSkills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ai/skill-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze skills');
      }

      setAnalysis(data.analysis);
      setCategorizedSkills(data.categorizedSkills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis) {
    return null;
  }

  const relevanceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  };

  const importanceColors = {
    critical: 'bg-red-100 text-red-800',
    important: 'bg-orange-100 text-orange-800',
    'nice-to-have': 'bg-blue-100 text-blue-800'
  };

  const strengthColors = {
    strong: 'bg-green-500',
    developing: 'bg-yellow-500',
    weak: 'bg-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Skill Intelligence
              </CardTitle>
              <CardDescription>
                Personalized skill analysis and career recommendations
              </CardDescription>
            </div>
            <Button onClick={analyzeSkills} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Career Path Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Career Path Alignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Role</p>
              <p className="font-medium">{analysis.careerPathAlignment.currentRole}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Suggested Next Role</p>
              <p className="font-medium">{analysis.careerPathAlignment.suggestedNextRole}</p>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Readiness Score</span>
              <span className="text-sm text-gray-600">
                {analysis.careerPathAlignment.readinessScore}%
              </span>
            </div>
            <Progress value={analysis.careerPathAlignment.readinessScore} />
          </div>

          {analysis.careerPathAlignment.keySkillsNeeded.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Key Skills Needed</p>
              <div className="flex flex-wrap gap-2">
                {analysis.careerPathAlignment.keySkillsNeeded.map((skill, idx) => (
                  <Badge key={idx} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'suggestions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </Button>
        <Button
          variant={activeTab === 'gaps' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('gaps')}
        >
          Skill Gaps
        </Button>
        <Button
          variant={activeTab === 'clusters' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('clusters')}
        >
          Skill Clusters
        </Button>
      </div>

      {/* Suggested Skills */}
      {activeTab === 'suggestions' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Skills</CardTitle>
            <CardDescription>
              Skills that would enhance your profile based on your experience and goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.suggestedSkills.map((skill, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{skill.name}</h4>
                    <p className="text-sm text-gray-600">{skill.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={relevanceColors[skill.relevance]}>
                      {skill.relevance} relevance
                    </Badge>
                    {onSkillAdd && (
                      <Button
                        size="sm"
                        onClick={() => onSkillAdd({ name: skill.name, category: skill.category })}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{skill.reason}</p>
                {skill.learningPath && skill.learningPath.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Learning Path
                    </p>
                    <ol className="text-sm text-gray-600 list-decimal list-inside">
                      {skill.learningPath.map((step, stepIdx) => (
                        <li key={stepIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Gaps */}
      {activeTab === 'gaps' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Gaps Analysis</CardTitle>
            <CardDescription>
              Areas where additional skills would significantly boost your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.skillGaps.map((gap, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{gap.category}</h4>
                  <div className="flex gap-2">
                    <Badge className={importanceColors[gap.importance]}>
                      {gap.importance}
                    </Badge>
                    {gap.relatedToGoals && (
                      <Badge variant="secondary">Goal-aligned</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {gap.missingSkills.map((skill, skillIdx) => (
                    <Badge key={skillIdx} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skill Clusters */}
      {activeTab === 'clusters' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Clusters</CardTitle>
            <CardDescription>
              Your skills grouped by strength and category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.skillClusters.map((cluster, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{cluster.clusterName}</h4>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strengthColors[cluster.strength]}`}
                      style={{ 
                        width: cluster.strength === 'strong' ? '100%' : 
                               cluster.strength === 'developing' ? '60%' : '30%' 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{cluster.strength}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cluster.skills.map((skill, skillIdx) => (
                    <Badge key={skillIdx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}