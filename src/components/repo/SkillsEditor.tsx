'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, GripVertical, Star, Clock, TrendingUp } from 'lucide-react';
import { 
  SkillWithMetadata, 
  SkillCategory, 
  SKILL_CATEGORIES, 
  COMMON_SKILLS 
} from '@/lib/repo/skillCategories';

interface SkillsEditorProps {
  skills: SkillWithMetadata[];
  onChange: (skills: SkillWithMetadata[]) => void;
  maxSkills?: number;
  showEndorsements?: boolean;
}

export const SkillsEditor: React.FC<SkillsEditorProps> = ({
  skills,
  onChange,
  maxSkills = 50,
  showEndorsements = true
}) => {
  const [newSkill, setNewSkill] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('Technical');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'manual' | 'alphabetical' | 'category' | 'endorsements'>('manual');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Filter suggestions based on input
    if (newSkill.length > 0) {
      const filtered = COMMON_SKILLS[selectedCategory]
        .filter(skill => 
          skill.toLowerCase().includes(newSkill.toLowerCase()) &&
          !skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [newSkill, selectedCategory, skills]);

  const addSkill = (skillName?: string) => {
    const name = skillName || newSkill.trim();
    if (name && skills.length < maxSkills && !skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      const newSkillObj: SkillWithMetadata = {
        id: Date.now().toString(),
        name,
        category: selectedCategory,
        endorsements: 0,
        level: 'Intermediate'
      };
      onChange([...skills, newSkillObj]);
      setNewSkill('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (id: string) => {
    onChange(skills.filter(s => s.id !== id));
  };

  const updateSkill = (id: string, updates: Partial<SkillWithMetadata>) => {
    onChange(skills.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const draggedSkill = skills[draggedIndex];
    const newSkills = [...skills];
    newSkills.splice(draggedIndex, 1);
    newSkills.splice(index, 0, draggedSkill);
    
    onChange(newSkills);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const sortSkills = (method: typeof sortBy) => {
    setSortBy(method);
    let sorted = [...skills];
    
    switch (method) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'category':
        sorted.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.name.localeCompare(b.name);
        });
        break;
      case 'endorsements':
        sorted.sort((a, b) => (b.endorsements || 0) - (a.endorsements || 0));
        break;
    }
    
    onChange(sorted);
  };

  const getCategoryStyle = (category: SkillCategory) => {
    return SKILL_CATEGORIES[category];
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<SkillCategory, SkillWithMetadata[]>);

  return (
    <div className="space-y-6">
      {/* Add Skill Input */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Skills ({skills.length}/{maxSkills})</h3>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => sortSkills(e.target.value as typeof sortBy)}
              className="bg-gray-700 px-3 py-1 rounded text-sm"
            >
              <option value="manual">Manual Order</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="category">By Category</option>
              {showEndorsements && <option value="endorsements">By Endorsements</option>}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as SkillCategory)}
            className="bg-gray-700 px-3 py-2 rounded"
          >
            {Object.keys(SKILL_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type a skill and press Enter"
              className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
              disabled={skills.length >= maxSkills}
            />
            
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addSkill(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => addSkill()}
            disabled={!newSkill.trim() || skills.length >= maxSkills}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Category Examples */}
        <div className="text-xs text-gray-400">
          Examples: {SKILL_CATEGORIES[selectedCategory].examples.slice(0, 3).join(', ')}...
        </div>
      </div>

      {/* Skills by Category */}
      {sortBy === 'category' ? (
        Object.entries(groupedSkills).map(([category, categorySkills]) => {
          const catStyle = getCategoryStyle(category as SkillCategory);
          return (
            <div key={category} className="bg-gray-800 p-4 rounded-lg">
              <h4 className={`text-sm font-semibold mb-3 ${catStyle.textColor}`}>
                {category} ({categorySkills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill, index) => (
                  <SkillTag
                    key={skill.id}
                    skill={skill}
                    onRemove={() => removeSkill(skill.id!)}
                    onUpdate={(updates) => updateSkill(skill.id!, updates)}
                    showEndorsements={showEndorsements}
                    categoryStyle={catStyle}
                  />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2">
            {skills.map((skill, index) => {
              const catStyle = getCategoryStyle(skill.category);
              return (
                <div
                  key={skill.id}
                  draggable={sortBy === 'manual'}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-gray-700 rounded-lg ${
                    sortBy === 'manual' ? 'cursor-move' : ''
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  {sortBy === 'manual' && (
                    <GripVertical className="w-4 h-4 text-gray-500" />
                  )}
                  
                  <div className={`w-2 h-8 rounded ${catStyle.bgColor}`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      <span className={`text-xs ${catStyle.textColor}`}>
                        {skill.category}
                      </span>
                    </div>
                    
                    {skill.level && (
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>{skill.level}</span>
                        {skill.yearsOfExperience && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {skill.yearsOfExperience}y
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {showEndorsements && (
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Star className="w-4 h-4" />
                      <span>{skill.endorsements || 0}</span>
                    </div>
                  )}

                  <button
                    onClick={() => removeSkill(skill.id!)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Skill Tag Component
const SkillTag: React.FC<{
  skill: SkillWithMetadata;
  onRemove: () => void;
  onUpdate: (updates: Partial<SkillWithMetadata>) => void;
  showEndorsements: boolean;
  categoryStyle: typeof SKILL_CATEGORIES[SkillCategory];
}> = ({ skill, onRemove, showEndorsements, categoryStyle }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${categoryStyle.borderColor} bg-gray-700`}>
      <span className="font-medium">{skill.name}</span>
      {showEndorsements && skill.endorsements && skill.endorsements > 0 && (
        <span className="text-xs text-gray-400">({skill.endorsements})</span>
      )}
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-400 ml-1"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};