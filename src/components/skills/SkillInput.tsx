'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Plus, Check, AlertCircle } from 'lucide-react';
import { skillNormalizer } from '@/lib/skills/skillNormalization';

interface Skill {
  name: string;
  category: string;
}

interface Props {
  skills: (string | Skill)[];
  onSkillsChange: (skills: Skill[]) => void;
  placeholder?: string;
  maxSkills?: number;
}

export default function SkillInput({ 
  skills, 
  onSkillsChange, 
  placeholder = "Type to add skills...",
  maxSkills = 50 
}: Props) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Normalize only known skills on mount, preserve custom skills
  useEffect(() => {
    const processedSkills = skills.map(skill => {
      const skillName = typeof skill === 'string' ? skill : skill.name;
      if (skillNormalizer.isKnownSkill(skillName)) {
        const normalized = skillNormalizer.normalize(skillName);
        return { name: normalized, category: skillNormalizer.getCategory(normalized) };
      }
      // Keep custom skills as-is
      return typeof skill === 'string' 
        ? { name: skill, category: skillNormalizer.getCategory(skill) }
        : skill;
    });
    
    // Remove duplicates while preserving custom skills
    const seen = new Map<string, boolean>();
    const deduped = processedSkills.filter(skill => {
      const key = skill.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
    
    if (deduped.length !== skills.length) {
      onSkillsChange(deduped);
    }
  }, []);

  // Handle input changes
  const handleInputChange = (value: string) => {
    setInput(value);
    setDuplicateWarning(null);
    
    if (value.trim()) {
      const suggestions = skillNormalizer.getAutocompleteSuggestions(value);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Add a skill
  const addSkill = (skillName: string) => {
    // First check if it's a known skill - if so, use the normalized version
    const isKnownSkill = skillNormalizer.isKnownSkill(skillName);
    const finalSkillName = isKnownSkill ? skillNormalizer.normalize(skillName) : skillName.trim();
    const category = skillNormalizer.getCategory(finalSkillName);
    
    // Check for duplicates - compare normalized versions to catch variations
    const existingSkillNames = skills.map(s => typeof s === 'string' ? s : s.name);
    const isDuplicate = existingSkillNames.some(existing => {
      // If both are known skills, compare normalized versions
      if (skillNormalizer.isKnownSkill(existing) && isKnownSkill) {
        return skillNormalizer.normalize(existing) === skillNormalizer.normalize(skillName);
      }
      // Otherwise, do case-insensitive comparison
      return existing.toLowerCase() === finalSkillName.toLowerCase();
    });
    
    if (isDuplicate) {
      setDuplicateWarning(`"${finalSkillName}" is already in your skills`);
      return;
    }
    
    if (skills.length >= maxSkills) {
      setDuplicateWarning(`Maximum of ${maxSkills} skills allowed`);
      return;
    }
    
    const newSkill: Skill = { name: finalSkillName, category };
    const updatedSkills = [...skills, newSkill].map(s => {
      if (typeof s === 'string') {
        // Only normalize if it's a known skill
        const name = skillNormalizer.isKnownSkill(s) ? skillNormalizer.normalize(s) : s;
        return { name, category: skillNormalizer.getCategory(name) };
      }
      return s;
    });
    
    onSkillsChange(updatedSkills);
    setInput('');
    setShowSuggestions(false);
    setDuplicateWarning(null);
  };

  // Remove a skill
  const removeSkill = (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    onSkillsChange(updatedSkills.map(s => 
      typeof s === 'string' ? { name: skillNormalizer.normalize(s), category: skillNormalizer.getCategory(s) } : s
    ));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions[selectedIndex]) {
        addSkill(suggestions[selectedIndex]);
      } else if (input.trim()) {
        addSkill(input.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Group skills by category
  const groupedSkills = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const skillObj = typeof skill === 'string' 
      ? { 
          name: skillNormalizer.isKnownSkill(skill) ? skillNormalizer.normalize(skill) : skill,
          category: skillNormalizer.getCategory(skill) 
        }
      : skill;
    
    if (!acc[skillObj.category]) {
      acc[skillObj.category] = [];
    }
    acc[skillObj.category].push(skillObj);
    return acc;
  }, {});

  // Category colors
  const categoryColors: Record<string, string> = {
    'Programming Languages': 'bg-blue-100 text-blue-800',
    'Frontend': 'bg-purple-100 text-purple-800',
    'Backend': 'bg-green-100 text-green-800',
    'Databases': 'bg-yellow-100 text-yellow-800',
    'Cloud': 'bg-sky-100 text-sky-800',
    'DevOps': 'bg-orange-100 text-orange-800',
    'AI/ML': 'bg-pink-100 text-pink-800',
    'Leadership': 'bg-indigo-100 text-indigo-800',
    'Business': 'bg-gray-100 text-gray-800',
    'General': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="space-y-4">
      {/* Input with autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.trim() && handleInputChange(input)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={duplicateWarning ? 'border-red-500' : ''}
          />
          <Button
            onClick={() => input.trim() && addSkill(input.trim())}
            size="sm"
            disabled={!input.trim() || skills.length >= maxSkills}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {duplicateWarning && (
          <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {duplicateWarning}
          </p>
        )}
        
        {/* Autocomplete suggestions */}
        {showSuggestions && (
          <Card 
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 max-h-48 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                  index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => addSkill(suggestion)}
              >
                <span>{suggestion}</span>
                {skillNormalizer.isKnownSkill(suggestion) && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
            {/* Show option to add as custom skill if no exact match */}
            {input.trim() && !suggestions.some(s => s.toLowerCase() === input.toLowerCase()) && (
              <div
                className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-t"
                onClick={() => addSkill(input.trim())}
              >
                <span className="text-gray-600">Add "{input.trim()}" as custom skill</span>
                <p className="text-xs text-gray-400 mt-1">Not in our database, but that's okay!</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Skills grouped by category */}
      <div className="space-y-4">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-600 mb-2">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {categorySkills.map((skill, index) => {
                const globalIndex = skills.findIndex(s => 
                  (typeof s === 'string' ? s : s.name) === skill.name
                );
                const isCustom = !skillNormalizer.isKnownSkill(skill.name);
                return (
                  <Badge
                    key={`${category}-${skill.name}`}
                    className={`${categoryColors[category] || categoryColors.General} flex items-center gap-1 ${
                      isCustom ? 'border-dashed' : ''
                    }`}
                  >
                    {skill.name}
                    {isCustom && (
                      <span className="text-xs opacity-60" title="Custom skill">✨</span>
                    )}
                    <button
                      onClick={() => removeSkill(globalIndex)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500">
        {skills.length} skills • {Object.keys(groupedSkills).length} categories
        {(() => {
          const customCount = skills.filter(s => {
            const name = typeof s === 'string' ? s : s.name;
            return !skillNormalizer.isKnownSkill(name);
          }).length;
          return customCount > 0 ? ` • ${customCount} custom` : '';
        })()}
        {skills.length >= maxSkills && <span className="text-orange-500"> • Maximum reached</span>}
      </div>
    </div>
  );
}