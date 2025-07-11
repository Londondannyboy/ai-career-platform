'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  Target, 
  Sparkles, 
  BookOpen,
  TrendingUp,
  CheckCircle,
  Circle,
  ChevronRight
} from 'lucide-react';
import { Skill } from '@/lib/skills/skillTypes';
import { skillRelationshipAnalyzer } from '@/lib/skills/skillRelationships';
import { skillNormalizer } from '@/lib/skills/skillNormalization';

interface Props {
  currentSkills: Skill[];
  onSkillSelect?: (skill: string) => void;
}

interface LearningPath {
  targetSkill: string;
  prerequisites: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nextSteps: string[];
}

export default function SkillLearningPath({ currentSkills, onSkillSelect }: Props) {
  const [targetSkill, setTargetSkill] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  // Get skill names for comparison
  const currentSkillNames = useMemo(() => 
    currentSkills.map(s => skillNormalizer.normalize(s.name)),
    [currentSkills]
  );

  // Get suggestions for target skill
  const suggestions = useMemo(() => {
    if (!targetSkill.trim()) return [];
    return skillNormalizer.getAutocompleteSuggestions(targetSkill, 5);
  }, [targetSkill]);

  // Analyze skill clusters and get recommendations
  const { clusters, suggestions: clusterSuggestions } = useMemo(() => 
    skillRelationshipAnalyzer.analyzeSkillClusters(currentSkills),
    [currentSkills]
  );

  // Generate learning path
  const generateLearningPath = (target: string) => {
    const normalizedTarget = skillNormalizer.normalize(target);
    const prerequisites = skillRelationshipAnalyzer.findLearningPath(
      currentSkillNames,
      normalizedTarget
    );
    
    // Get complementary skills
    const complementary = skillRelationshipAnalyzer.getComplementarySkills(normalizedTarget);
    const nextSteps = complementary.filter(skill => !currentSkillNames.includes(skill));
    
    // Estimate difficulty and time
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    let estimatedTime = '1-3 months';
    
    if (prerequisites.length === 0) {
      difficulty = 'beginner';
      estimatedTime = '1-3 months';
    } else if (prerequisites.length <= 2) {
      difficulty = 'intermediate';
      estimatedTime = '3-6 months';
    } else {
      difficulty = 'advanced';
      estimatedTime = '6-12 months';
    }
    
    const path: LearningPath = {
      targetSkill: normalizedTarget,
      prerequisites,
      estimatedTime,
      difficulty,
      nextSteps: nextSteps.slice(0, 3)
    };
    
    setSelectedPath(path);
    setTargetSkill('');
    setShowSuggestions(false);
  };

  // Get top recommended skills based on clusters
  const topRecommendations = useMemo(() => {
    return clusterSuggestions
      .filter(s => !currentSkillNames.includes(s.skill))
      .slice(0, 6);
  }, [clusterSuggestions, currentSkillNames]);

  return (
    <div className="space-y-6">
      {/* Target Skill Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Choose Your Next Skill
          </CardTitle>
          <CardDescription>
            Enter a skill you want to learn, and we'll create a personalized learning path
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Label>Target Skill</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={targetSkill}
                  onChange={(e) => {
                    setTargetSkill(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="e.g., Machine Learning, Kubernetes, Leadership"
                  className="w-full"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-auto">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setTargetSkill(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
              <Button
                onClick={() => generateLearningPath(targetSkill)}
                disabled={!targetSkill.trim()}
              >
                Generate Path
              </Button>
            </div>
          </div>
          
          {/* Quick Recommendations */}
          {topRecommendations.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm text-gray-600 mb-2 block">
                Recommended based on your skills:
              </Label>
              <div className="flex flex-wrap gap-2">
                {topRecommendations.map((rec) => (
                  <Badge
                    key={rec.skill}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => generateLearningPath(rec.skill)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {rec.skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Learning Path */}
      {selectedPath && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Learning Path to {selectedPath.targetSkill}
              </span>
              <Badge
                variant={
                  selectedPath.difficulty === 'beginner' ? 'default' :
                  selectedPath.difficulty === 'intermediate' ? 'secondary' :
                  'destructive'
                }
              >
                {selectedPath.difficulty}
              </Badge>
            </CardTitle>
            <CardDescription>
              Estimated time: {selectedPath.estimatedTime}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prerequisites */}
            {selectedPath.prerequisites.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Prerequisites to Master First
                </h4>
                <div className="space-y-2">
                  {selectedPath.prerequisites.map((prereq, idx) => {
                    const hasSkill = currentSkillNames.includes(prereq);
                    return (
                      <div
                        key={prereq}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          hasSkill ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        {hasSkill ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={hasSkill ? 'line-through text-gray-500' : ''}>
                          {prereq}
                        </span>
                        {idx < selectedPath.prerequisites.length - 1 && (
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Great! You can start learning {selectedPath.targetSkill} right away.
                </p>
              </div>
            )}

            {/* Target Skill */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {selectedPath.targetSkill}
              </h4>
              <p className="text-sm text-blue-700 mt-1">Your target skill to acquire</p>
            </div>

            {/* Next Steps */}
            {selectedPath.nextSteps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  After {selectedPath.targetSkill}, Consider Learning
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedPath.nextSteps.map((next) => (
                    <Card
                      key={next}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => generateLearningPath(next)}
                    >
                      <CardContent className="pt-4">
                        <p className="font-medium">{next}</p>
                        <p className="text-xs text-gray-500 mt-1">Complementary skill</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {onSkillSelect && (
              <Button
                onClick={() => onSkillSelect(selectedPath.targetSkill)}
                className="w-full"
              >
                Add {selectedPath.targetSkill} to My Learning Goals
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skill Clusters Overview */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Skill Clusters</CardTitle>
            <CardDescription>
              You're building expertise in these areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clusters.slice(0, 3).map(({ cluster, skills, coverage }) => (
                <div key={cluster.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{cluster.name}</h4>
                    <Badge variant="secondary">
                      {Math.round(coverage * 100)}% coverage
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{cluster.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {skills.slice(0, 5).map(skill => (
                      <Badge key={skill.name} variant="outline" className="text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                    {skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}