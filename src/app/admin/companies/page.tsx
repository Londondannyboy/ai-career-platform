'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Users, Clock, RefreshCw, Search, Calendar, Brain, Zap, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CompanyEnrichment {
  id: string;
  company_name: string;
  linkedin_url: string;
  employee_count: number;
  last_enriched: string;
  cache_status: 'fresh' | 'stale' | 'expired';
  days_since_enriched: number;
  enrichment_type: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyEnrichment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [intelligentQuery, setIntelligentQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalEmployees: 0,
    averageEmployeesPerCompany: 0,
    recentEnrichments: 0
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompany = async (companyId: string, companyName: string) => {
    setRefreshing(companyId);
    
    try {
      const response = await fetch('/api/admin/companies/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, companyName })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload companies to show updated data
        await loadCompanies();
      } else {
        alert(`Refresh failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Refresh failed');
    } finally {
      setRefreshing(null);
    }
  };

  const runIntelligentQuery = async () => {
    if (!intelligentQuery.trim()) return;
    
    setQueryLoading(true);
    setQueryResult(null);
    
    try {
      const response = await fetch('/api/admin/intelligent-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: intelligentQuery })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setQueryResult(data.result);
      } else {
        alert(`Query failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Intelligent query failed:', error);
      alert('Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const searchLower = searchTerm.toLowerCase();
    const companyLower = company.company_name.toLowerCase();
    
    // Direct match
    if (companyLower.includes(searchLower)) return true;
    
    // Handle "CK Delta" variations
    if (searchLower.includes('ck') && searchLower.includes('delta')) {
      return companyLower.includes('ckdelta') || companyLower.includes('ck') || companyLower.includes('delta');
    }
    
    // Handle "ckdelta" variations  
    if (companyLower.includes('ckdelta') && (searchLower.includes('ck') || searchLower.includes('delta'))) {
      return true;
    }
    
    return false;
  });

  const getCacheStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'stale': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading companies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Company Repository</h1>
        <p className="text-gray-600">Intelligent company intelligence with AI-powered insights and relationship mapping</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-2xl font-bold">{stats.totalCompanies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg per Company</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageEmployeesPerCompany)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Recent (7 days)</p>
                <p className="text-2xl font-bold">{stats.recentEnrichments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligent Query Interface */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI-Powered Company Intelligence</span>
          </CardTitle>
          <CardDescription>
            Ask intelligent questions like "Find sales people with SaaS experience" or "Who can introduce me to CK Delta's head of engineering?"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="e.g., Find experienced sales people who understand fintech..."
              value={intelligentQuery}
              onChange={(e) => setIntelligentQuery(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && runIntelligentQuery()}
            />
            <Button
              onClick={runIntelligentQuery}
              disabled={queryLoading || !intelligentQuery.trim()}
              className="whitespace-nowrap"
            >
              {queryLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Ask AI
                </>
              )}
            </Button>
          </div>
          
          {queryResult && (
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2 text-green-700">
                <Brain className="h-4 w-4" />
                <span className="font-medium">AI Analysis Results</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700">{queryResult.analysis}</p>
                {queryResult.recommendations && queryResult.recommendations.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-gray-900 mb-2">Recommended Contacts:</h4>
                    <div className="space-y-2">
                      {queryResult.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3">
                          <div className="font-medium">{rec.name}</div>
                          <div className="text-sm text-gray-600">{rec.title} at {rec.company}</div>
                          <div className="text-sm text-gray-500">{rec.reasoning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <div className="grid gap-4">
        {filteredCompanies.map((company) => (
          <Card key={company.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">{company.company_name}</h3>
                    <Badge className={getCacheStatusColor(company.cache_status)}>
                      {company.cache_status}
                    </Badge>
                    <Badge variant="outline">
                      {company.enrichment_type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{company.employee_count} employees</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Last enriched: {formatDate(company.last_enriched)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{company.days_since_enriched} days ago</span>
                    </div>
                  </div>
                  
                  {company.linkedin_url && (
                    <div className="mt-2">
                      <a 
                        href={company.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        View LinkedIn Company Page →
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Link href={`/company/${company.id}`}>
                    <Button variant="default" size="sm" className="whitespace-nowrap">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      View Company
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshCompany(company.id, company.company_name)}
                    disabled={refreshing === company.id}
                    className="whitespace-nowrap"
                  >
                    {refreshing === company.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by enriching some companies'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}