'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, CheckCircle, AlertCircle, Plus, Building2, Loader2, ExternalLink } from 'lucide-react';
import { CompanyReference, normalizeCompany } from '@/types/work-experience';
import { CreateCompanyModal } from '@/components/company/create-company-modal';

interface CompanyTagInputProps {
  value: string | CompanyReference;
  onChange: (company: CompanyReference) => void;
  onRemove?: () => void;
  placeholder?: string;
  className?: string;
  experienceId: string;
}

export const CompanyTagInput: React.FC<CompanyTagInputProps> = ({
  value,
  onChange,
  onRemove,
  placeholder = "Press Enter to add company",
  className = "",
  experienceId
}) => {
  const [isEditing, setIsEditing] = useState(!value || (typeof value === 'string' && !value));
  const [inputValue, setInputValue] = useState(typeof value === 'string' ? value : value?.name || '');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<CompanyReference[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const company = normalizeCompany(value);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const searchCompany = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/surface-repo/search-companies?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.companies || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Company search error:', error);
    }
    setIsSearching(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    searchCompany(value);
  };

  const handleSubmit = (selectedCompany?: CompanyReference) => {
    if (selectedCompany) {
      onChange(selectedCompany);
      setIsEditing(false);
      setShowSuggestions(false);
      setSuggestions([]);
    } else if (inputValue.trim()) {
      // Check if it's in suggestions (validated company)
      const matchedSuggestion = suggestions.find(
        s => s.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      
      if (matchedSuggestion) {
        onChange(matchedSuggestion);
        setIsEditing(false);
        setShowSuggestions(false);
      } else {
        // Unknown company - show create modal
        setShowCreateModal(true);
      }
    }
  };

  const handleCompanyCreated = (company: CompanyReference) => {
    onChange(company);
    setIsEditing(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setShowCreateModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setShowSuggestions(false);
      setInputValue(company.name);
    }
  };

  const handleSelectSuggestion = (suggestion: CompanyReference) => {
    setInputValue(suggestion.name);
    handleSubmit(suggestion);
  };

  if (!isEditing && company.name) {
    return (
      <div className={`inline-flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-full ${className}`}>
        {company.isValidated && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
        {!company.isValidated && <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <span 
          className="cursor-pointer hover:underline"
          onClick={() => {
            setIsEditing(true);
            setInputValue(company.name);
          }}
        >
          {company.name}
        </span>
        {company.location && (
          <span className="text-sm text-gray-400">• {company.location}</span>
        )}
        {company.id && (
          <Link 
            href={`/company/${company.id}`}
            className="text-gray-400 hover:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-400 ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow click on suggestions
            setTimeout(() => {
              setShowSuggestions(false);
              if (!inputValue.trim()) {
                setIsEditing(false);
              }
            }, 200);
          }}
          placeholder={placeholder}
          className={`bg-gray-600 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        {isSearching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id || suggestion.name + index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-600 flex items-center gap-2"
            >
              {suggestion.isValidated ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-medium">{suggestion.name}</div>
                {suggestion.location && (
                  <div className="text-sm text-gray-400">{suggestion.location}</div>
                )}
              </div>
            </button>
            ))
          ) : inputValue.trim().length > 1 && !isSearching ? (
            <div className="p-3 text-center text-gray-400">
              <p className="text-sm">Company not found</p>
              <p className="text-xs mt-1">Press Enter to create "{inputValue.trim()}"</p>
            </div>
          ) : null}
        </div>
      )}

      <CreateCompanyModal
        companyName={inputValue.trim()}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
};