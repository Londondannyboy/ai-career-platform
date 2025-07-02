'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, RefreshCw, Clock, Users, Building2, AlertCircle, CheckCircle } from 'lucide-react';

interface EnrichedCompany {
  id: string;
  company_name: string;
  total_employees: number;
  profile_count: number;
  last_crawled_at: string;
  days_since_crawl: number;
  is_stale: boolean;
  crawled_by: string;
  canRefresh: boolean;
  status: 'fresh' | 'stale';
  lastCrawledFormatted: string;
  daysSinceCrawlFormatted: string;
}

interface CompanyProfiles {
  success: boolean;
  company: string;
  totalEmployees: number;
  profilesReturned: number;
  profiles: any[];
  fromCache: boolean;
  cacheInfo?: any;
  insights: any;
  adminInfo: any;
}

export default function CompanyEnrichmentPage() {
  const [companies, setCompanies] = useState<EnrichedCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<CompanyProfiles | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load enriched companies on mount
  useEffect(() => {
    loadEnrichedCompanies();
  }, []);

  const loadEnrichedCompanies = async () => {
    try {
      const response = await fetch('/api/enrich/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies);
        setIsAdmin(data.isAdmin);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchCompany = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/enrich/company-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: searchQuery.trim(),
          forceRefresh: false,
          searchOptions: {
            perPage: 25
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResult(data);
        // Reload companies list to show updated data
        await loadEnrichedCompanies();
      } else {
        alert(`Search failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const refreshCompany = async (companyName: string) => {
    setIsRefreshing(companyName);

    try {
      const response = await fetch('/api/enrich/company-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          forceRefresh: true,
          searchOptions: {
            perPage: 50
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`${companyName} data refreshed successfully!`);
        await loadEnrichedCompanies();
      } else {
        alert(`Refresh failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Refresh failed. Please try again.');
    } finally {
      setIsRefreshing(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading enriched companies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Enrichment</h1>
          <p className="text-muted-foreground">
            Search for company employee data using Apollo API
            {isAdmin && ' (Admin Mode)'}
          </p>
        </div>
        {isAdmin && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Admin Access
          </Badge>
        )}
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Company
          </CardTitle>
          <CardDescription>
            Enter a company name to search for employee data. If data exists and is fresh, 
            it will be loaded from cache to save API credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter company name (e.g., Microsoft, Google, Apple)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCompany()}
              className="flex-1"
            />
            <Button 
              onClick={searchCompany} 
              disabled={isSearching || !searchQuery.trim()}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {searchResult.company} Results
              {searchResult.fromCache && (
                <Badge variant="outline" className="ml-2">
                  From Cache
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">{searchResult.totalEmployees.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{searchResult.profilesReturned}</p>
                <p className="text-sm text-gray-600">Profiles Retrieved</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-600">{searchResult.insights.linkedinUrls}</p>
                <p className="text-sm text-gray-600">LinkedIn URLs</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold text-orange-600">{searchResult.adminInfo.apiCreditsUsed}</p>
                <p className="text-sm text-gray-600">API Credits Used</p>
              </div>
            </div>

            {searchResult.fromCache && searchResult.cacheInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Cache Information</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Last crawled {searchResult.cacheInfo.daysSinceCrawl} days ago 
                  ({searchResult.cacheInfo.profileCount} profiles stored)
                  {searchResult.cacheInfo.isStale && ' - Data is stale and may need refresh'}
                </p>
              </div>
            )}

            {/* Top profiles preview */}
            <div>
              <h4 className="font-medium mb-2">Sample Profiles</h4>
              <div className="space-y-2">
                {searchResult.profiles.slice(0, 5).map((profile, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-sm text-gray-600">{profile.headline || profile.currentPosition}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{profile.seniority}</Badge>
                      {profile.linkedinUrl && (
                        <p className="text-xs text-blue-600 mt-1">LinkedIn Available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Companies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Enriched Companies ({companies.length})
            </div>
            <Button variant="outline" size="sm" onClick={loadEnrichedCompanies}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh List
            </Button>
          </CardTitle>
          <CardDescription>
            Companies with cached employee data from Apollo API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies enriched yet</p>
              <p className="text-sm">Search for a company above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{company.company_name}</h3>
                      <Badge 
                        variant={company.status === 'fresh' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {company.status === 'fresh' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Fresh
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Stale
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>{company.total_employees.toLocaleString()} employees</span>
                      <span>{company.profile_count} profiles stored</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {company.daysSinceCrawlFormatted}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshCompany(company.company_name)}
                        disabled={isRefreshing === company.company_name}
                      >
                        {isRefreshing === company.company_name ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Apollo API Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• <strong>Fresh data:</strong> Less than 30 days old, no API credits used</p>
          <p>• <strong>Stale data:</strong> Older than 30 days, refresh recommended</p>
          <p>• <strong>API Credits:</strong> ~1 credit per profile retrieved from Apollo</p>
          <p>• <strong>LinkedIn URLs:</strong> Available for most profiles when present in Apollo</p>
          {isAdmin && (
            <p className="text-green-600">• <strong>Admin Access:</strong> You can force refresh any company data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}