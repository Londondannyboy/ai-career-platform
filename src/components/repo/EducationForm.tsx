'use client';

import React, { useState } from 'react';
import { X, Plus, GraduationCap, Calendar, Target, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Education, 
  COMMON_DEGREES, 
  COMMON_FIELDS, 
  validateEducation 
} from '@/lib/repo/educationValidation';

interface EducationFormProps {
  educations: Education[];
  onChange: (educations: Education[]) => void;
  maxEducations?: number;
}

export const EducationForm: React.FC<EducationFormProps> = ({
  educations,
  onChange,
  maxEducations = 10
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const addEducation = (isPlanned: boolean = false) => {
    const newEducation: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      isPlanned,
      showGpa: false,
      activities: [],
      honors: []
    };
    
    onChange([...educations, newEducation]);
    setExpandedIds(new Set([...expandedIds, newEducation.id!]));
  };

  const updateEducation = (id: string, updates: Partial<Education>) => {
    const updatedEducations = educations.map(edu => 
      edu.id === id ? { ...edu, ...updates } : edu
    );
    onChange(updatedEducations);
    
    // Revalidate
    const education = updatedEducations.find(e => e.id === id);
    if (education) {
      const validationErrors = validateEducation(education);
      setErrors(prev => ({
        ...prev,
        [id]: validationErrors
      }));
    }
  };

  const removeEducation = (id: string) => {
    onChange(educations.filter(edu => edu.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const addActivity = (eduId: string) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu) {
      updateEducation(eduId, { 
        activities: [...(edu.activities || []), ''] 
      });
    }
  };

  const updateActivity = (eduId: string, index: number, value: string) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu && edu.activities) {
      const newActivities = [...edu.activities];
      newActivities[index] = value;
      updateEducation(eduId, { activities: newActivities });
    }
  };

  const removeActivity = (eduId: string, index: number) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu && edu.activities) {
      updateEducation(eduId, { 
        activities: edu.activities.filter((_, i) => i !== index) 
      });
    }
  };

  const addHonor = (eduId: string) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu) {
      updateEducation(eduId, { 
        honors: [...(edu.honors || []), ''] 
      });
    }
  };

  const updateHonor = (eduId: string, index: number, value: string) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu && edu.honors) {
      const newHonors = [...edu.honors];
      newHonors[index] = value;
      updateEducation(eduId, { honors: newHonors });
    }
  };

  const removeHonor = (eduId: string, index: number) => {
    const edu = educations.find(e => e.id === eduId);
    if (edu && edu.honors) {
      updateEducation(eduId, { 
        honors: edu.honors.filter((_, i) => i !== index) 
      });
    }
  };

  // Sort educations: current first, then by date
  const sortedEducations = [...educations].sort((a, b) => {
    if (a.isPlanned && !b.isPlanned) return 1;
    if (!a.isPlanned && b.isPlanned) return -1;
    
    const dateA = a.startDate || a.targetStartDate || '';
    const dateB = b.startDate || b.targetStartDate || '';
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Education ({educations.length}/{maxEducations})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => addEducation(false)}
            disabled={educations.length >= maxEducations}
            className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Education
          </button>
          <button
            onClick={() => addEducation(true)}
            disabled={educations.length >= maxEducations}
            className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Target className="w-4 h-4" /> Plan Future
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {sortedEducations.map((education) => {
          const isExpanded = expandedIds.has(education.id!);
          const eduErrors = errors[education.id!] || [];
          
          return (
            <div
              key={education.id}
              className={`bg-gray-800 rounded-lg border-2 ${
                education.isPlanned 
                  ? 'border-purple-600' 
                  : education.isCurrent 
                    ? 'border-blue-600' 
                    : 'border-gray-700'
              }`}
            >
              {/* Header */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {education.isPlanned && (
                        <span className="text-xs bg-purple-600 px-2 py-1 rounded">Future Plan</span>
                      )}
                      {education.isCurrent && !education.isPlanned && (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">School</label>
                        <input
                          type="text"
                          value={education.school}
                          onChange={(e) => updateEducation(education.id!, { school: e.target.value })}
                          placeholder="University name"
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Degree</label>
                        <select
                          value={education.degree}
                          onChange={(e) => updateEducation(education.id!, { degree: e.target.value })}
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        >
                          <option value="">Select degree</option>
                          {COMMON_DEGREES.map(degree => (
                            <option key={degree} value={degree}>{degree}</option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                        {education.degree === 'other' && (
                          <input
                            type="text"
                            placeholder="Enter degree"
                            className="w-full bg-gray-700 px-3 py-2 rounded text-sm mt-2"
                            onChange={(e) => updateEducation(education.id!, { degree: e.target.value })}
                          />
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={education.field}
                          onChange={(e) => updateEducation(education.id!, { field: e.target.value })}
                          placeholder="e.g., Computer Science"
                          list={`fields-${education.id}`}
                          className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        />
                        <datalist id={`fields-${education.id}`}>
                          {COMMON_FIELDS.map(field => (
                            <option key={field} value={field} />
                          ))}
                        </datalist>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          {education.isPlanned ? 'Target Start Date' : 'Dates'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="month"
                            value={education.isPlanned ? education.targetStartDate : education.startDate}
                            onChange={(e) => updateEducation(education.id!, { 
                              [education.isPlanned ? 'targetStartDate' : 'startDate']: e.target.value 
                            })}
                            className="flex-1 bg-gray-700 px-3 py-2 rounded text-sm"
                          />
                          {!education.isPlanned && (
                            <>
                              <span className="text-gray-500">to</span>
                              <input
                                type="month"
                                value={education.endDate || ''}
                                onChange={(e) => updateEducation(education.id!, { endDate: e.target.value })}
                                disabled={education.isCurrent}
                                className="flex-1 bg-gray-700 px-3 py-2 rounded text-sm disabled:opacity-50"
                              />
                              <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={education.isCurrent || false}
                                  onChange={(e) => updateEducation(education.id!, { 
                                    isCurrent: e.target.checked,
                                    endDate: e.target.checked ? undefined : education.endDate
                                  })}
                                  className="rounded"
                                />
                                Current
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {eduErrors.length > 0 && (
                      <div className="mt-2 text-red-400 text-xs">
                        {eduErrors.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(education.id!)}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeEducation(education.id!)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
                  {/* GPA */}
                  {!education.isPlanned && (
                    <div className="pt-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={education.showGpa || false}
                          onChange={(e) => updateEducation(education.id!, { showGpa: e.target.checked })}
                          className="rounded"
                        />
                        Include GPA
                      </label>
                      {education.showGpa && (
                        <input
                          type="number"
                          value={education.gpa || ''}
                          onChange={(e) => updateEducation(education.id!, { gpa: parseFloat(e.target.value) })}
                          placeholder="3.5"
                          min="0"
                          max="4.0"
                          step="0.01"
                          className="mt-2 bg-gray-700 px-3 py-2 rounded text-sm w-24"
                        />
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {education.isPlanned ? 'Why this degree?' : 'Description'}
                    </label>
                    <textarea
                      value={education.isPlanned ? education.whyThisDegree : education.description}
                      onChange={(e) => updateEducation(education.id!, { 
                        [education.isPlanned ? 'whyThisDegree' : 'description']: e.target.value 
                      })}
                      placeholder={education.isPlanned 
                        ? "How does this align with your career goals?" 
                        : "Describe your studies, focus areas, thesis, etc."}
                      className="w-full bg-gray-700 px-3 py-2 rounded text-sm h-20"
                    />
                  </div>

                  {/* Activities */}
                  {!education.isPlanned && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400">Activities & Societies</label>
                        <button
                          onClick={() => addActivity(education.id!)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          <Plus className="w-3 h-3 inline" /> Add
                        </button>
                      </div>
                      {education.activities?.map((activity, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={activity}
                            onChange={(e) => updateActivity(education.id!, index, e.target.value)}
                            placeholder="e.g., Student Government, Chess Club"
                            className="flex-1 bg-gray-700 px-3 py-1 rounded text-sm"
                          />
                          <button
                            onClick={() => removeActivity(education.id!, index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Honors */}
                  {!education.isPlanned && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Honors & Awards
                        </label>
                        <button
                          onClick={() => addHonor(education.id!)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          <Plus className="w-3 h-3 inline" /> Add
                        </button>
                      </div>
                      {education.honors?.map((honor, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={honor}
                            onChange={(e) => updateHonor(education.id!, index, e.target.value)}
                            placeholder="e.g., Dean's List, Magna Cum Laude"
                            className="flex-1 bg-gray-700 px-3 py-1 rounded text-sm"
                          />
                          <button
                            onClick={() => removeHonor(education.id!, index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Career Link for Planned Education */}
                  {education.isPlanned && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Required for Career Goal
                      </label>
                      <input
                        type="text"
                        value={education.requiredForCareer || ''}
                        onChange={(e) => updateEducation(education.id!, { requiredForCareer: e.target.value })}
                        placeholder="e.g., Data Science Manager at Tech Company"
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {educations.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No education added yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your educational background or plan future degrees</p>
          </div>
        )}
      </div>
    </div>
  );
};