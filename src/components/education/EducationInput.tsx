'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GraduationCap, Calendar, Award, BookOpen } from 'lucide-react';
import { Education, DEGREE_TYPES, EDUCATION_ENRICHMENTS } from '@/lib/education/educationTypes';
import { educationNormalizer } from '@/lib/education/educationNormalization';

interface Props {
  education: Education[];
  onEducationChange: (education: Education[]) => void;
}

export default function EducationInput({ education, onEducationChange }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Education>({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: [],
    coursework: [],
    skillsGained: []
  });
  const [institutionSuggestions, setInstitutionSuggestions] = useState<string[]>([]);
  const [showInstitutionSuggestions, setShowInstitutionSuggestions] = useState(false);

  // Handle institution input with suggestions
  const handleInstitutionChange = (value: string) => {
    setCurrentEdit({ ...currentEdit, institution: value });
    
    if (value.trim()) {
      const suggestions = educationNormalizer.getInstitutionSuggestions(value);
      setInstitutionSuggestions(suggestions);
      setShowInstitutionSuggestions(suggestions.length > 0);
    } else {
      setShowInstitutionSuggestions(false);
    }
  };

  // Select institution from suggestions
  const selectInstitution = (institution: string) => {
    const institutionId = educationNormalizer.getInstitutionId(institution);
    setCurrentEdit({ 
      ...currentEdit, 
      institution,
      institutionId
    });
    setShowInstitutionSuggestions(false);
  };

  // Add new education entry
  const addEducation = () => {
    if (!currentEdit.institution || !currentEdit.degree || !currentEdit.field) {
      return;
    }

    // Normalize institution name
    const normalizedInstitution = educationNormalizer.normalizeInstitution(currentEdit.institution);
    const institutionId = educationNormalizer.getInstitutionId(normalizedInstitution);

    // Get suggested skills for the field
    const suggestedSkills = educationNormalizer.getFieldSkills(currentEdit.field);

    const newEducation: Education = {
      ...currentEdit,
      id: Date.now().toString(),
      institution: normalizedInstitution,
      institutionId,
      skillsGained: [...(currentEdit.skillsGained || []), ...suggestedSkills].filter((v, i, a) => a.indexOf(v) === i)
    };

    onEducationChange([...education, newEducation]);
    setIsAdding(false);
    setCurrentEdit({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: [],
      coursework: [],
      skillsGained: []
    });
  };

  // Remove education entry
  const removeEducation = (index: number) => {
    onEducationChange(education.filter((_, i) => i !== index));
  };

  // Update education entry
  const updateEducation = (index: number, updates: Partial<Education>) => {
    const updated = [...education];
    updated[index] = { ...updated[index], ...updates };
    onEducationChange(updated);
  };

  // Add achievement/coursework/skill to current edit
  const addToArray = (field: 'achievements' | 'coursework' | 'skillsGained', value: string) => {
    if (!value.trim()) return;
    
    setCurrentEdit({
      ...currentEdit,
      [field]: [...(currentEdit[field] || []), value.trim()]
    });
  };

  // Remove from array in current edit
  const removeFromArray = (field: 'achievements' | 'coursework' | 'skillsGained', index: number) => {
    setCurrentEdit({
      ...currentEdit,
      [field]: (currentEdit[field] || []).filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-4">
      {/* Existing Education Entries */}
      {education.map((edu, index) => (
        <Card key={edu.id || index} className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-white">
                    {edu.degree} in {edu.field}
                  </h4>
                  <p className="text-gray-400">{edu.institution}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {edu.startDate} - {edu.current ? 'Present' : edu.endDate || 'N/A'}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => removeEducation(index)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Achievements */}
            {edu.achievements && edu.achievements.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                  <Award className="h-3 w-3" />
                  Achievements
                </div>
                <div className="flex flex-wrap gap-1">
                  {edu.achievements.map((achievement, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Gained */}
            {edu.skillsGained && edu.skillsGained.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                  <BookOpen className="h-3 w-3" />
                  Skills Gained
                </div>
                <div className="flex flex-wrap gap-1">
                  {edu.skillsGained.map((skill, idx) => (
                    <Badge key={idx} className="text-xs bg-blue-900 text-blue-100">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New Education Form */}
      {isAdding ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-4 space-y-4">
            {/* Institution with autocomplete */}
            <div className="relative">
              <Label className="text-white">Institution</Label>
              <Input
                value={currentEdit.institution}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                onBlur={() => setTimeout(() => setShowInstitutionSuggestions(false), 200)}
                placeholder="e.g., Harvard University"
                className="bg-gray-700 border-gray-600 text-white"
              />
              {showInstitutionSuggestions && (
                <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-auto">
                  {institutionSuggestions.map((suggestion) => (
                    <div
                      key={suggestion}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => selectInstitution(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </Card>
              )}
            </div>

            {/* Degree Type */}
            <div>
              <Label className="text-white">Degree</Label>
              <select
                value={currentEdit.degree}
                onChange={(e) => setCurrentEdit({ ...currentEdit, degree: e.target.value })}
                className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2"
              >
                <option value="">Select degree type</option>
                {Object.entries(DEGREE_TYPES).map(([abbr, full]) => (
                  <option key={abbr} value={abbr}>
                    {abbr} - {full}
                  </option>
                ))}
              </select>
            </div>

            {/* Field of Study */}
            <div>
              <Label className="text-white">Field of Study</Label>
              <Input
                value={currentEdit.field}
                onChange={(e) => setCurrentEdit({ ...currentEdit, field: e.target.value })}
                placeholder="e.g., Computer Science, PPE, Business Administration"
                className="bg-gray-700 border-gray-600 text-white"
              />
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
                  Currently enrolled
                </label>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <Label className="text-white">Achievements (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Dean's List, First Class Honours"
                  className="bg-gray-700 border-gray-600 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('achievements', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(currentEdit.achievements || []).map((achievement, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {achievement}
                    <button
                      onClick={() => removeFromArray('achievements', idx)}
                      className="ml-1 text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={addEducation} className="flex-1">
                Add Education
              </Button>
              <Button
                onClick={() => setIsAdding(false)}
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
          Add Education
        </Button>
      )}
    </div>
  );
}