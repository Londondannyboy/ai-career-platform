'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Props {
  skills: string[];
  onSkillsChange: (skills: string[]) => void;
  placeholder?: string;
}

export default function SimpleSkillInput({ 
  skills, 
  onSkillsChange,
  placeholder = "Type a skill and press Enter..."
}: Props) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      // Add skill if not already present
      const newSkill = inputValue.trim();
      if (!skills.includes(newSkill)) {
        onSkillsChange([...skills, newSkill]);
      }
      
      setInputValue('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onSkillsChange(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="space-y-3">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-gray-700 border-gray-600 text-white"
      />
      
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="px-3 py-1 text-sm flex items-center gap-1"
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="ml-1 hover:text-red-400"
              aria-label={`Remove ${skill}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}