'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Briefcase, 
  ArrowRight,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { 
  CareerProfile, 
  CareerRecommendation, 
  CareerPathAnalysis, 
  careerPathEngine 
} from '@/lib/ai/careerPathRecommendations';

interface Props {
  profile: CareerProfile;
  onRecommendationSelect?: (recommendation: CareerRecommendation) => void;
}

export default function CareerRecommendations({ profile, onRecommendationSelect }: Props) {
  const [analysis, setAnalysis] = useState<CareerPathAnalysis | null>(null);
  const [selectedRec, setSelectedRec] = useState<CareerRecommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate async analysis (in real app, this might be an API call)
    setLoading(true);
    setTimeout(() => {
      const result = careerPathEngine.analyzeCareerPath(profile);
      setAnalysis(result);
      setLoading(false);
    }, 1000);
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return <div>Unable to analyze career path</div>;
  }

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'exceptional': return 'text-purple-600 bg-purple-50';
      case 'fast': return 'text-green-600 bg-green-50';
      case 'steady': return 'text-blue-600 bg-blue-50';
      case 'slow': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'next-role': return <TrendingUp className="w-5 h-5" />;
      case 'skill-gap': return <Target className="w-5 h-5" />;
      case 'lateral-move': return <ArrowRight className="w-5 h-5" />;
      case 'leadership': return <Award className="w-5 h-5" />;
      case 'specialization': return <Sparkles className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Career Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Career Analysis Overview</CardTitle>
          <CardDescription>
            Your current position and growth trajectory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Current Level</div>
              <Badge variant="secondary" className="text-sm">
                {analysis.currentLevel}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Experience</div>
              <div className="font-semibold">{analysis.yearsOfExperience} years</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Domain</div>
              <div className="font-semibold">{analysis.primaryDomain}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Career Velocity</div>
              <Badge className={getVelocityColor(analysis.careerVelocity)}>
                <Gauge className="w-3 h-3 mr-1" />
                {analysis.careerVelocity}
              </Badge>
            </div>
          </div>

          {/* Strengths and Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Strength Areas
              </h4>
              <ul className="space-y-1">
                {analysis.strengthAreas.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Growth Areas
              </h4>
              <ul className="space-y-1">
                {analysis.growthAreas.map((area, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personalized Career Recommendations</h3>
        <div className="space-y-4">
          {analysis.recommendations.map((rec) => (
            <Card 
              key={rec.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                selectedRec?.id === rec.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedRec(rec)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      rec.type === 'next-role' ? 'bg-blue-50 text-blue-600' :
                      rec.type === 'skill-gap' ? 'bg-purple-50 text-purple-600' :
                      rec.type === 'lateral-move' ? 'bg-green-50 text-green-600' :
                      rec.type === 'leadership' ? 'bg-amber-50 text-amber-600' :
                      'bg-pink-50 text-pink-600'
                    }`}>
                      {getTypeIcon(rec.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getDifficultyColor(rec.difficulty)}>
                      {rec.difficulty}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {rec.timeframe}
                    </div>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">AI Confidence</span>
                    <span className="font-medium">{Math.round(rec.confidence * 100)}%</span>
                  </div>
                  <Progress value={rec.confidence * 100} className="h-2" />
                </div>

                {/* Required Skills Preview */}
                {rec.requiredSkills.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-600">Key skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {rec.requiredSkills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {rec.requiredSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{rec.requiredSkills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRec(rec);
                  }}
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed View */}
      {selectedRec && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTypeIcon(selectedRec.type)}
              {selectedRec.title}
            </CardTitle>
            <CardDescription>
              Detailed roadmap and action plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rationale */}
            <div>
              <h4 className="font-semibold mb-2">Why this recommendation?</h4>
              <ul className="space-y-2">
                {selectedRec.rationale.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="font-semibold mb-2">Action Plan</h4>
              <div className="space-y-2">
                {selectedRec.actionItems.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                      {idx + 1}
                    </div>
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Skills Detail */}
            {selectedRec.requiredSkills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills to Develop</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRec.requiredSkills.map((skill) => (
                    <div key={skill} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {onRecommendationSelect && (
              <Button 
                onClick={() => onRecommendationSelect(selectedRec)}
                className="w-full"
              >
                Add to Career Goals
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}