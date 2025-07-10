'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Building2, MapPin, Users, CheckCircle, Plus, Loader2 } from 'lucide-react';
import { CreateCompanyModal } from '@/components/company/create-company-modal';

interface CompanyListing {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  location?: string;
  size?: string;
  isVerified?: boolean;
  questMembers?: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingCompanyName, setPendingCompanyName] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async (query?: string) => {
    try {
      const url = query 
        ? `/api/neon-load?type=companies&q=${encodeURIComponent(query)}`
        : '/api/companies/list';
        
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.companies) {
        setCompanies(data.companies);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load companies:', error);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadCompanies(searchQuery);
  };

  const handleCreateCompany = () => {
    setPendingCompanyName(searchQuery);
    setShowCreateModal(true);
  };

  const handleCompanyCreated = (company: any) => {
    // Refresh the list
    loadCompanies(searchQuery);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Company Directory</h1>
          <p className="text-gray-400">
            Explore companies and discover where Quest members are building their careers
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search companies..."
                className="w-full bg-gray-800 pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleCreateCompany}
              className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>
        </form>

        {/* Company Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : companies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/company/${company.id}`}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-14 h-14 object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{company.name}</h3>
                      {company.isVerified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-400">
                      {company.industry && (
                        <div>{company.industry}</div>
                      )}
                      {company.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {company.location}
                        </div>
                      )}
                      {company.size && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {company.size}
                        </div>
                      )}
                    </div>

                    {company.questMembers !== undefined && company.questMembers > 0 && (
                      <div className="mt-2 text-xs text-blue-400">
                        {company.questMembers} Quest member{company.questMembers !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-xl mb-2">No companies found</p>
            <p className="text-gray-400 mb-4">
              {searchQuery ? `No results for "${searchQuery}"` : 'Be the first to add a company'}
            </p>
            <button
              onClick={handleCreateCompany}
              className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Add the first company
            </button>
          </div>
        )}
      </div>

      {/* Create Company Modal */}
      <CreateCompanyModal
        companyName={pendingCompanyName}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPendingCompanyName('');
        }}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
}