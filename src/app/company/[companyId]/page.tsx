'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Building2, Globe, MapPin, Calendar, Users, Briefcase, 
  TrendingUp, Star, ChevronRight, Loader2, ArrowLeft,
  CheckCircle, AlertCircle, Eye, EyeOff, Edit
} from 'lucide-react';
import { CompanyProfile } from '@/types/company';
import { COUNTRIES } from '@/lib/constants/countries';

export default function CompanyProfilePage() {
  const params = useParams();
  const { user } = useUser();
  const companyId = params.companyId as string;
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'people' | 'culture'>('overview');
  const [showDeepInsights, setShowDeepInsights] = useState(false);

  useEffect(() => {
    // Load company data
    fetch(`/api/company/${companyId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.company) {
          setCompany(data.company);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load company:', err);
        setLoading(false);
      });
  }, [companyId]);

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
            <p className="text-gray-400 mb-4">This company profile doesn't exist yet.</p>
            <Link href="/companies" className="text-blue-400 hover:underline">
              Browse Companies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const countryName = company.headquarters?.country 
    ? COUNTRIES.find(c => c.code === company.headquarters?.country)?.name 
    : undefined;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link href="/companies" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>
          
          <div className="flex items-start gap-6">
            {/* Company Logo */}
            <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-20 h-20 object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-gray-500" />
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                {company.isVerified && (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm">Verified</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                {company.industry && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{company.industry}</span>
                  </div>
                )}
                {countryName && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{countryName}</span>
                  </div>
                )}
                {company.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Founded {company.founded}</span>
                  </div>
                )}
                {company.size && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{company.size}</span>
                  </div>
                )}
              </div>

              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {company.stats?.questMembers !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{company.stats.questMembers}</div>
                  <div className="text-sm text-gray-400">Quest Members</div>
                </div>
              )}
              {company.stats?.activeJobPostings !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{company.stats.activeJobPostings}</div>
                  <div className="text-sm text-gray-400">Open Roles</div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Button for authenticated users */}
          {user && (
            <Link
              href={`/company/${companyId}/edit`}
              className="absolute top-6 right-6 bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            {['overview', 'jobs', 'people', 'culture'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 px-1 border-b-2 transition-colors capitalize ${
                  activeTab === tab 
                    ? 'border-blue-500 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {/* Description */}
            {company.description && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-3">About {company.name}</h2>
                <p className="text-gray-300 leading-relaxed">{company.description}</p>
              </div>
            )}

            {/* Mission & Values */}
            <div className="grid md:grid-cols-2 gap-6">
              {company.mission && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Mission
                  </h3>
                  <p className="text-gray-300">{company.mission}</p>
                </div>
              )}
              
              {company.values && company.values.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3">Core Values</h3>
                  <ul className="space-y-2">
                    {company.values.map((value, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-300">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Deep Insights Toggle */}
            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Quest Deep Insights</h3>
                  <p className="text-sm text-gray-400">
                    Community-sourced insights from Quest members who work here
                  </p>
                </div>
                <button
                  onClick={() => setShowDeepInsights(!showDeepInsights)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
                >
                  {showDeepInsights ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showDeepInsights ? 'Hide' : 'Show'} Insights
                </button>
              </div>
              
              {showDeepInsights && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-800/50 rounded p-4">
                    <h4 className="font-medium mb-2">Work-Life Balance</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                      <span className="text-sm">4.2/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 italic">
                    More insights available to Quest members
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Open Positions</h2>
            <div className="text-center py-12 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No open positions listed yet</p>
              <p className="text-sm mt-2">Check back later or visit their website</p>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">People at {company.name}</h2>
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No Quest members from this company yet</p>
              <p className="text-sm mt-2">Be the first to represent {company.name} on Quest</p>
            </div>
          </div>
        )}

        {activeTab === 'culture' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Company Culture</h2>
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Culture insights coming soon</p>
              <p className="text-sm mt-2">Quest members will share their experiences</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}