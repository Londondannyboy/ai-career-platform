'use client';

import React, { useState } from 'react';
import { X, Loader2, Globe, Building2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/constants/countries';

interface CreateCompanyModalProps {
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: any) => void;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  companyName,
  isOpen,
  onClose,
  onCompanyCreated
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: companyName,
    website: '',
    country: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!formData.website) {
      setError('Website URL is required');
      return;
    }

    // Validate URL format
    try {
      new URL(formData.website.startsWith('http') ? formData.website : `https://${formData.website}`);
    } catch {
      setError('Please enter a valid website URL');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/surface-repo/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          website: formData.website,
          country: formData.country
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.company) {
          onCompanyCreated({
            ...data.company,
            isValidated: true,
            validatedBy: 'manual'
          });
          onClose();
        } else {
          setError('Failed to create company');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create company');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create Company Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-gray-400 text-sm">
            Help us build the company database by providing the company website.
          </p>
          <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
            <p className="text-yellow-400 text-xs">
              <strong>Note:</strong> This creates a basic company schema for reference only. 
              This is NOT an official company page and the company has not approved this information. 
              We're simply building a database to help connect professionals.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Website URL <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-gray-700 pl-10 pr-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="www.company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Headquarters Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full bg-gray-700 px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select country (optional)</option>
              {COUNTRIES.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-red-400 text-sm">{error}</div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !formData.website}
            className="flex-1 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Building Profile...
              </>
            ) : (
              'Create Company'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};