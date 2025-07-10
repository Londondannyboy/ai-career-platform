'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, CheckCircle, Building2, Loader2 } from 'lucide-react';
import { CompanyReference } from '@/types/work-experience';
import debounce from 'lodash/debounce';

interface CompanyAutocompleteProps {
  value: string | CompanyReference;
  onChange: (company: CompanyReference) => void;
  placeholder?: string;
  className?: string;
  location?: string;
}

interface CompanySuggestion extends CompanyReference {
  description?: string;
  employeeCount?: string;
  industry?: string;
}

export const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Company name",
  className = "",
  location
}) => {
  const [inputValue, setInputValue] = useState(
    typeof value === 'string' ? value : value?.name || ''
  );
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for companies
  const searchCompanies = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ 
          query,
          ...(location && { location })
        });
        
        const response = await fetch(`/api/company/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.companies || []);
        }
      } catch (error) {
        console.error('Failed to search companies:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [location]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // Update parent with unvalidated company
    onChange({
      name: newValue,
      isValidated: false,
      location
    });
    
    searchCompanies(newValue);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: CompanySuggestion) => {
    setInputValue(suggestion.name);
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const currentCompany = typeof value === 'string' 
    ? { name: value, isValidated: false } 
    : value;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-gray-600 px-3 py-2 rounded pr-8 focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          {currentCompany?.isValidated && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || suggestion.name}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-600 transition-colors ${
                index === selectedIndex ? 'bg-gray-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{suggestion.name}</span>
                    {suggestion.isValidated && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {suggestion.location && (
                    <div className="text-sm text-gray-400">{suggestion.location}</div>
                  )}
                  {suggestion.description && (
                    <div className="text-sm text-gray-400 line-clamp-1">
                      {suggestion.description}
                    </div>
                  )}
                  {suggestion.industry && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.industry} · {suggestion.employeeCount}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};