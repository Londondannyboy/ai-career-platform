'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  X, 
  TrendingUp, 
  Calendar, 
  Award,
  Star,
  Clock,
  ChevronRight
} from 'lucide-react';
import { 
  Skill, 
  SkillProficiency, 
  SKILL_CATEGORIES,
  SKILL_PROFICIENCY_MILESTONES,
  calculateSkillStrength,
  getSkillAge 
} from '@/lib/skills/skillTypes';
import { skillNormalizer } from '@/lib/skills/skillNormalization';

interface Props {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  showProficiency?: boolean;
  showTemporal?: boolean;
  placeholder?: string;
}

export default function EnhancedSkillInput({ 
  skills, 
  onSkillsChange,
  showProficiency = true,
  showTemporal = true,
  placeholder = "Type to add skills..."
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentEdit, setCurrentEdit] = useState<Skill>({
    name: '',
    category: 'technical',
    proficiency: 'beginner',
    activelyUsing: true
  });

  // Handle skill input with suggestions
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (value.trim()) {
      const searchSuggestions = skillNormalizer.getAutocompleteSuggestions(value);
      setSuggestions(searchSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  // Add skill with proficiency
  const addSkill = () => {
    if (!currentEdit.name.trim()) return;

    const isKnownSkill = skillNormalizer.isKnownSkill(currentEdit.name);
    const normalizedName = isKnownSkill ? 
      skillNormalizer.normalize(currentEdit.name) : 
      currentEdit.name.trim();
    
    const category = isKnownSkill ?
      skillNormalizer.getCategory(normalizedName) :
      currentEdit.category;

    const newSkill: Skill = {
      ...currentEdit,
      id: Date.now().toString(),
      name: normalizedName,
      category,
      isCustom: !isKnownSkill,
      normalizedFrom: isKnownSkill && normalizedName !== currentEdit.name ? 
        currentEdit.name : undefined,
      firstUsed: currentEdit.firstUsed || new Date().toISOString().slice(0, 7),
      lastUsed: new Date().toISOString().slice(0, 7)
    };

    onSkillsChange([...skills, newSkill]);
    setIsAdding(false);
    setCurrentEdit({
      name: '',
      category: 'technical',
      proficiency: 'beginner',
      activelyUsing: true
    });
  };

  // Remove skill
  const removeSkill = (skillId: string) => {
    onSkillsChange(skills.filter(skill => skill.id !== skillId));
  };

  // Update skill proficiency
  const updateSkillProficiency = (skillId: string, proficiency: SkillProficiency) => {
    onSkillsChange(skills.map(skill => 
      skill.id === skillId ? { ...skill, proficiency } : skill
    ));
  };

  // Get proficiency color
  const getProficiencyColor = (proficiency: SkillProficiency) => {
    const colors: Record<SkillProficiency, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-blue-100 text-blue-800',
      'advanced': 'bg-purple-100 text-purple-800',
      'expert': 'bg-orange-100 text-orange-800'
    };
    return colors[proficiency];
  };

  // Get skill strength color
  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'bg-green-500';
    if (strength >= 60) return 'bg-blue-500';
    if (strength >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Existing Skills */}
      <div className="grid gap-3">
        {skills.map((skill) => {
          const strength = calculateSkillStrength(skill);
          const age = getSkillAge(skill);
          
          return (
            <Card key={skill.id} className="bg-gray-800 border-gray-700">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{skill.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {skill.category}
                      </Badge>
                      {skill.isCustom && (
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                    
                    {showProficiency && (
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <Badge className={`text-xs ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <Progress 
                            value={strength} 
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-gray-400">{strength}%</span>
                        </div>
                      </div>
                    )}
                    
                    {showTemporal && (skill.firstUsed || skill.lastUsed) && (
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {age !== null && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {age} {age === 1 ? 'year' : 'years'} experience
                          </div>
                        )}
                        {skill.activelyUsing && (
                          <Badge variant="secondary" className="text-xs">
                            Actively using
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {skill.endorsements && skill.endorsements.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-gray-400">
                          {skill.endorsements.length} endorsements
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => removeSkill(skill.id!)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Skill Form */}
      {isAdding ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 space-y-4">
            {/* Skill Name */}
            <div>
              <Label className="text-white">Skill Name</Label>
              <Input
                value={currentEdit.name}
                onChange={(e) => setCurrentEdit({ ...currentEdit, name: e.target.value })}
                placeholder="e.g., React, Project Management, Spanish"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Category & Proficiency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Category</Label>
                <select
                  value={currentEdit.category}
                  onChange={(e) => setCurrentEdit({ ...currentEdit, category: e.target.value })}
                  className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                >
                  {Object.entries(SKILL_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              {showProficiency && (
                <div>
                  <Label className="text-white">Proficiency</Label>
                  <select
                    value={currentEdit.proficiency}
                    onChange={(e) => setCurrentEdit({ 
                      ...currentEdit, 
                      proficiency: e.target.value as SkillProficiency 
                    })}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
                  >
                    {Object.entries(SKILL_PROFICIENCY_MILESTONES).map(([level, data]) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)} - {data.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Temporal Data */}
            {showTemporal && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">First Used</Label>
                  <Input
                    type="month"
                    value={currentEdit.firstUsed || ''}
                    onChange={(e) => setCurrentEdit({ ...currentEdit, firstUsed: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Years of Experience</Label>
                  <Input
                    type="number"
                    value={currentEdit.yearsOfExperience || ''}
                    onChange={(e) => setCurrentEdit({ 
                      ...currentEdit, 
                      yearsOfExperience: parseInt(e.target.value) || undefined 
                    })}
                    placeholder="e.g., 5"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {/* Active Usage */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={currentEdit.activelyUsing}
                  onChange={(e) => setCurrentEdit({ 
                    ...currentEdit, 
                    activelyUsing: e.target.checked 
                  })}
                />
                Currently using this skill
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={addSkill} className="flex-1">
                Add Skill
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setCurrentEdit({
                    name: '',
                    category: 'technical',
                    proficiency: 'beginner',
                    activelyUsing: true
                  });
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
          Add Skill
        </Button>
      )}
    </div>
  );
}