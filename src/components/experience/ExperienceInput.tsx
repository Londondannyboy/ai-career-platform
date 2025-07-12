'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  X, 
  Briefcase, 
  Calendar, 
  Users, 
  Target, 
  Zap,
  TrendingUp,
  Award,
  Code
} from 'lucide-react';
import { 
  Experience, 
  ImpactMetric, 
  METHODOLOGIES, 
  IMPACT_TEMPLATES,
  getExperienceLevel 
} from '@/lib/experience/experienceTypes';

interface Props {
  experiences: Experience[];
  onExperiencesChange: (experiences: Experience[]) => void;
  isFutureExperience?: boolean;
}

export default function ExperienceInput({ 
  experiences, 
  onExperiencesChange,
  isFutureExperience = false 
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Experience>({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    impact: [],
    technologies: [],
    methodologies: [],
    achievements: [],
    isFuture: isFutureExperience
  });

  // Add new experience
  const addExperience = () => {
    if (!currentEdit.title || !currentEdit.company) {
      return;
    }

    const newExperience: Experience = {
      ...currentEdit,
      id: Date.now().toString()
    };

    onExperiencesChange([...experiences, newExperience]);
    setIsAdding(false);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setCurrentEdit({
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      impact: [],
      technologies: [],
      methodologies: [],
      achievements: [],
      isFuture: isFutureExperience
    });
  };

  // Remove experience
  const removeExperience = (index: number) => {
    onExperiencesChange(experiences.filter((_, i) => i !== index));
  };

  // Add impact metric
  const addImpactMetric = () => {
    const newMetric: ImpactMetric = {
      description: '',
      metric: '',
      category: 'other'
    };
    setCurrentEdit({
      ...currentEdit,
      impact: [...(currentEdit.impact || []), newMetric]
    });
  };

  // Update impact metric
  const updateImpactMetric = (index: number, updates: Partial<ImpactMetric>) => {
    const updatedImpact = [...(currentEdit.impact || [])];
    updatedImpact[index] = { ...updatedImpact[index], ...updates };
    setCurrentEdit({ ...currentEdit, impact: updatedImpact });
  };

  // Remove impact metric
  const removeImpactMetric = (index: number) => {
    setCurrentEdit({
      ...currentEdit,
      impact: (currentEdit.impact || []).filter((_, i) => i !== index)
    });
  };

  // Add to array field
  const addToArray = (field: 'technologies' | 'methodologies', value: string) => {
    if (!value.trim()) return;
    
    setCurrentEdit({
      ...currentEdit,
      [field]: [...(currentEdit[field] || []), value.trim()]
    });
  };

  // Remove from array field
  const removeFromArray = (field: 'technologies' | 'methodologies', index: number) => {
    setCurrentEdit({
      ...currentEdit,
      [field]: (currentEdit[field] || []).filter((_, i) => i !== index)
    });
  };

  // Get experience level color
  const getLevelColor = (title: string) => {
    const level = getExperienceLevel(title);
    const colors: Record<string, string> = {
      'Entry Level': 'bg-green-100 text-green-800',
      'Mid Level': 'bg-blue-100 text-blue-800',
      'Senior': 'bg-purple-100 text-purple-800',
      'Staff+': 'bg-orange-100 text-orange-800',
      'Management': 'bg-red-100 text-red-800',
      'Executive': 'bg-pink-100 text-pink-800',
      'C-Level': 'bg-indigo-100 text-indigo-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Existing Experiences */}
      {experiences.map((exp, index) => (
        <Card key={exp.id || index} className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-1" />
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      {exp.title}
                      <Badge className={`text-xs ${getLevelColor(exp.title)}`}>
                        {getExperienceLevel(exp.title)}
                      </Badge>
                      {exp.isFuture && (
                        <Badge variant="secondary" className="text-xs">
                          Future Goal
                        </Badge>
                      )}
                    </h4>
                    <p className="text-gray-400">{exp.company}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                      </span>
                      {exp.teamSize && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Team of {exp.teamSize}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {exp.description && (
                    <p className="text-sm text-gray-300">{exp.description}</p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => removeExperience(index)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Impact Metrics */}
            {exp.impact && exp.impact.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                  <Target className="h-3 w-3" />
                  Impact & Achievements
                </div>
                <div className="space-y-2">
                  {exp.impact.map((metric, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-gray-300">
                        {metric.description} 
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {metric.metric}
                        </Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {exp.technologies && exp.technologies.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                  <Code className="h-3 w-3" />
                  Technologies
                </div>
                <div className="flex flex-wrap gap-1">
                  {exp.technologies.map((tech, idx) => (
                    <Badge key={idx} className="text-xs bg-blue-900 text-blue-100">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New Experience Form */}
      {isAdding ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Job Title</Label>
                <Input
                  value={currentEdit.title}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, title: e.target.value })}
                  placeholder="e.g., Senior Software Engineer"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Company</Label>
                <Input
                  value={currentEdit.company}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, company: e.target.value })}
                  placeholder="e.g., Quest"
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Company search coming soon</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Start Date</Label>
                <Input
                  type="month"
                  value={currentEdit.startDate}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, startDate: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">End Date</Label>
                <Input
                  type="month"
                  value={currentEdit.endDate}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, endDate: e.target.value })}
                  disabled={currentEdit.current}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={currentEdit.current}
                    onChange={(e) => setCurrentEdit({ 
                      ...currentEdit, 
                      current: e.target.checked,
                      endDate: e.target.checked ? '' : currentEdit.endDate
                    })}
                  />
                  {isFutureExperience ? 'Target role' : 'Current position'}
                </label>
              </div>
            </div>

            {/* Team Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Team Size</Label>
                <Input
                  type="number"
                  value={currentEdit.teamSize || ''}
                  onChange={(e) => setCurrentEdit({ 
                    ...currentEdit, 
                    teamSize: parseInt(e.target.value) || undefined 
                  })}
                  placeholder="e.g., 12"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Direct Reports</Label>
                <Input
                  type="number"
                  value={currentEdit.directReports || ''}
                  onChange={(e) => setCurrentEdit({ 
                    ...currentEdit, 
                    directReports: parseInt(e.target.value) || undefined 
                  })}
                  placeholder="e.g., 5"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Reporting To</Label>
                <Input
                  value={currentEdit.reportingTo || ''}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, reportingTo: e.target.value })}
                  placeholder="e.g., CTO"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={currentEdit.description}
                onChange={(e) => setCurrentEdit({ ...currentEdit, description: e.target.value })}
                placeholder="Describe your role and responsibilities..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Impact Metrics */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-white">Impact Metrics</Label>
                <Button
                  onClick={addImpactMetric}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Impact
                </Button>
              </div>
              {(currentEdit.impact || []).map((metric, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={metric.description}
                    onChange={(e) => updateImpactMetric(idx, { description: e.target.value })}
                    placeholder="e.g., Reduced infrastructure costs"
                    className="flex-1 bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    value={metric.metric}
                    onChange={(e) => updateImpactMetric(idx, { metric: e.target.value })}
                    placeholder="e.g., 47%"
                    className="w-24 bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    onClick={() => removeImpactMetric(idx)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Technologies */}
            <div>
              <Label className="text-white">Technologies Used</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('technologies', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(currentEdit.technologies || []).map((tech, idx) => (
                  <Badge key={idx} className="text-xs bg-blue-900 text-blue-100">
                    {tech}
                    <button
                      onClick={() => removeFromArray('technologies', idx)}
                      className="ml-1 text-blue-300 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={addExperience} className="flex-1">
                Add Experience
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {isFutureExperience ? 'Future Experience Goal' : 'Experience'}
        </Button>
      )}
    </div>
  );
}