'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Loader2, Plus, X, Building2, 
  Globe, MapPin, Calendar, Users, Briefcase,
  Star, TrendingUp, Shield, MessageSquare
} from 'lucide-react';
import { CompanyProfile } from '@/types/company';
import { COUNTRIES } from '@/lib/constants/countries';
import { Toast } from '@/components/ui/toast';

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const companyId = params.companyId as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    mission: '',
    values: [] as string[],
    industry: '',
    size: '',
    founded: '',
    headquarters: {
      country: '',
      city: '',
      address: ''
    },
    culture: {
      workStyle: 'hybrid' as 'remote' | 'hybrid' | 'onsite',
      benefits: [] as string[],
      perks: [] as string[]
    },
    social: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    }
  });
  const [newValue, setNewValue] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load company data
    fetch(`/api/company/${companyId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.company) {
          const c = data.company;
          setCompany(c);
          setFormData({
            description: c.description || '',
            mission: c.mission || '',
            values: c.values || [],
            industry: c.industry || '',
            size: c.size || '',
            founded: c.founded?.toString() || '',
            headquarters: {
              country: c.headquarters?.country || '',
              city: c.headquarters?.city || '',
              address: c.headquarters?.address || ''
            },
            culture: {
              workStyle: c.culture?.workStyle || 'hybrid',
              benefits: c.culture?.benefits || [],
              perks: c.culture?.perks || []
            },
            social: {
              linkedin: c.social?.linkedin || '',
              twitter: c.social?.twitter || '',
              facebook: c.social?.facebook || '',
              instagram: c.social?.instagram || ''
            }
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load company:', err);
        setLoading(false);
      });
  }, [companyId, isLoaded]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Update enrichment data
      const enrichmentData = {
        ...(company?.enrichmentData || {}),
        description: formData.description,
        mission: formData.mission,
        values: formData.values,
        industry: formData.industry,
        size: formData.size,
        founded: formData.founded ? parseInt(formData.founded) : undefined,
        country: formData.headquarters.country,
        city: formData.headquarters.city,
        address: formData.headquarters.address,
        culture: formData.culture,
        social: formData.social,
        updatedBy: user?.id,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/company/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          enrichmentData
        })
      });

      if (response.ok) {
        setShowToast({ message: 'Company profile updated successfully!', type: 'success' });
        setTimeout(() => router.push(`/company/${companyId}`), 1500);
      } else {
        const error = await response.json();
        setShowToast({ message: error.error || 'Failed to save', type: 'error' });
      }
    } catch (error) {
      setShowToast({ message: 'Network error. Please try again.', type: 'error' });
    }
    
    setSaving(false);
  };

  const addValue = () => {
    if (newValue.trim() && !formData.values.includes(newValue.trim())) {
      setFormData(prev => ({
        ...prev,
        values: [...prev.values, newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const removeValue = (value: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v !== value)
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !formData.culture.benefits.includes(newBenefit.trim())) {
      setFormData(prev => ({
        ...prev,
        culture: {
          ...prev.culture,
          benefits: [...prev.culture.benefits, newBenefit.trim()]
        }
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      culture: {
        ...prev.culture,
        benefits: prev.culture.benefits.filter(b => b !== benefit)
      }
    }));
  };

  const addPerk = () => {
    if (newPerk.trim() && !formData.culture.perks.includes(newPerk.trim())) {
      setFormData(prev => ({
        ...prev,
        culture: {
          ...prev.culture,
          perks: [...prev.culture.perks, newPerk.trim()]
        }
      }));
      setNewPerk('');
    }
  };

  const removePerk = (perk: string) => {
    setFormData(prev => ({
      ...prev,
      culture: {
        ...prev.culture,
        perks: prev.culture.perks.filter(p => p !== perk)
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
            <Link href="/companies" className="text-blue-400 hover:underline">
              Browse Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href={`/company/${companyId}`} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Link>
            <h1 className="text-3xl font-bold">Edit {company.name}</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

        {/* Basic Information */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Describe what the company does..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1001-5000">1001-5000 employees</option>
                  <option value="5001-10000">5001-10000 employees</option>
                  <option value="10000+">10000+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Founded Year</label>
              <input
                type="number"
                value={formData.founded}
                onChange={(e) => setFormData(prev => ({ ...prev, founded: e.target.value }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2010"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Headquarters
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select
                value={formData.headquarters.country}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  headquarters: { ...prev.headquarters, country: e.target.value }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={formData.headquarters.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, city: e.target.value }
                  }))}
                  className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., San Francisco"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={formData.headquarters.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    headquarters: { ...prev.headquarters, address: e.target.value }
                  }))}
                  className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Values */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Mission & Values
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mission Statement</label>
              <textarea
                value={formData.mission}
                onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What is the company's mission?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Core Values</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                  className="flex-1 bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a core value"
                />
                <button
                  onClick={addValue}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.values.map((value, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{value}</span>
                    <button
                      onClick={() => removeValue(value)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Culture */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Culture & Benefits
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Work Style</label>
              <select
                value={formData.culture.workStyle}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  culture: { ...prev.culture, workStyle: e.target.value as any }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="remote">Fully Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Benefits</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  className="flex-1 bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Health insurance, 401k"
                />
                <button
                  onClick={addBenefit}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.culture.benefits.map((benefit, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{benefit}</span>
                    <button
                      onClick={() => removeBenefit(benefit)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Perks</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPerk}
                  onChange={(e) => setNewPerk(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerk())}
                  className="flex-1 bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Free lunch, Gym membership"
                />
                <button
                  onClick={addPerk}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.culture.perks.map((perk, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{perk}</span>
                    <button
                      onClick={() => removePerk(perk)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Social Media
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">LinkedIn</label>
              <input
                type="url"
                value={formData.social.linkedin}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social: { ...prev.social, linkedin: e.target.value }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Twitter</label>
              <input
                type="url"
                value={formData.social.twitter}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social: { ...prev.social, twitter: e.target.value }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Facebook</label>
              <input
                type="url"
                value={formData.social.facebook}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social: { ...prev.social, facebook: e.target.value }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Instagram</label>
              <input
                type="url"
                value={formData.social.instagram}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  social: { ...prev.social, instagram: e.target.value }
                }))}
                className="w-full bg-gray-700 px-4 py-2 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}