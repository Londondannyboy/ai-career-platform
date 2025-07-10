'use client';

import React, { useState } from 'react';
import { X, Plus, Globe, CheckCircle } from 'lucide-react';
import { Language, COMMON_LANGUAGES } from '@/lib/repo/skillCategories';

interface LanguageSelectorProps {
  languages: Language[];
  onChange: (languages: Language[]) => void;
  maxLanguages?: number;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  onChange,
  maxLanguages = 10
}) => {
  const [newLanguage, setNewLanguage] = useState('');
  const [proficiency, setProficiency] = useState<Language['proficiency']>('Professional');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  React.useEffect(() => {
    if (newLanguage.length > 0) {
      const filtered = COMMON_LANGUAGES
        .filter(lang => 
          lang.toLowerCase().includes(newLanguage.toLowerCase()) &&
          !languages.some(l => l.name.toLowerCase() === lang.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [newLanguage, languages]);

  const addLanguage = (langName?: string) => {
    const name = langName || newLanguage.trim();
    if (name && languages.length < maxLanguages && !languages.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      const newLang: Language = {
        id: Date.now().toString(),
        name,
        proficiency,
        certified: false
      };
      onChange([...languages, newLang]);
      setNewLanguage('');
      setShowSuggestions(false);
    }
  };

  const removeLanguage = (id: string) => {
    onChange(languages.filter(l => l.id !== id));
  };

  const updateLanguage = (id: string, updates: Partial<Language>) => {
    onChange(languages.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const getProficiencyColor = (proficiency: Language['proficiency']) => {
    const colors = {
      Native: 'text-green-500',
      Fluent: 'text-blue-500',
      Professional: 'text-indigo-500',
      Conversational: 'text-yellow-500',
      Basic: 'text-gray-500'
    };
    return colors[proficiency];
  };

  const getProficiencyLevel = (proficiency: Language['proficiency']) => {
    const levels = {
      Native: 5,
      Fluent: 4,
      Professional: 3,
      Conversational: 2,
      Basic: 1
    };
    return levels[proficiency];
  };

  return (
    <div className="space-y-6">
      {/* Add Language Input */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Languages ({languages.length}/{maxLanguages})
          </h3>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            value={proficiency}
            onChange={(e) => setProficiency(e.target.value as Language['proficiency'])}
            className="bg-gray-700 px-3 py-2 rounded"
          >
            <option value="Native">Native</option>
            <option value="Fluent">Fluent</option>
            <option value="Professional">Professional</option>
            <option value="Conversational">Conversational</option>
            <option value="Basic">Basic</option>
          </select>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLanguage();
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type a language and press Enter"
              className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
              disabled={languages.length >= maxLanguages}
            />
            
            {showSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => addLanguage(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => addLanguage()}
            disabled={!newLanguage.trim() || languages.length >= maxLanguages}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="space-y-3">
          {languages.map((language) => (
            <div
              key={language.id}
              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Globe className="w-5 h-5 text-gray-400" />
                
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{language.name}</span>
                    {language.certified && (
                      <span title="Certified">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <select
                      value={language.proficiency}
                      onChange={(e) => updateLanguage(language.id!, { 
                        proficiency: e.target.value as Language['proficiency'] 
                      })}
                      className={`bg-gray-600 px-2 py-1 rounded text-sm ${getProficiencyColor(language.proficiency)}`}
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Professional">Professional</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Basic">Basic</option>
                    </select>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < getProficiencyLevel(language.proficiency)
                              ? getProficiencyColor(language.proficiency).replace('text-', 'bg-')
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    <label className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={language.certified || false}
                        onChange={(e) => updateLanguage(language.id!, { certified: e.target.checked })}
                        className="rounded"
                      />
                      Certified
                    </label>
                  </div>

                  {language.certified && (
                    <input
                      type="text"
                      value={language.certificationName || ''}
                      onChange={(e) => updateLanguage(language.id!, { certificationName: e.target.value })}
                      placeholder="Certification name"
                      className="mt-2 bg-gray-600 px-2 py-1 rounded text-sm w-full"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={() => removeLanguage(language.id!)}
                className="text-gray-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {languages.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No languages added yet</p>
              <p className="text-sm mt-1">Add languages you speak professionally</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};