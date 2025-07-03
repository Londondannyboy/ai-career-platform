'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Clock, RefreshCw, Brain, Zap, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Neo4jGraphVisualization from '@/components/Neo4jGraphVisualization';
import CompanyDataVisualization from '@/components/CompanyDataVisualization';

interface CompanyData {
  id: string;
  company_name: string;
  employee_count: number;
  last_enriched: string;
  enrichment_data: any;
  canonical_identifier: string;
  cache_status: string;
  days_since_enriched: number;
}

export default function CompanyPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [intelligentQuery, setIntelligentQuery] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setCompany(data.company);
      } else {
        console.error('Failed to load company:', data.error);
      }
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompany = async () => {
    if (!company) return;
    
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/companies/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: company.id, 
          companyName: company.company_name 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadCompany(); // Reload fresh data
      } else {
        alert(`Refresh failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      alert('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const runIntelligentQuery = async () => {
    if (!intelligentQuery.trim() || !company) return;
    
    setQueryLoading(true);
    setQueryResult(null);
    
    try {
      const response = await fetch('/api/admin/intelligent-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: intelligentQuery,
          companyFilter: company.company_name // Filter to this company only
        })
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading company data...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-gray-600 mb-4">The company you're looking for doesn't exist or hasn't been enriched yet.</p>
          <Link href="/admin/companies">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Company Repository
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const employees = company.enrichment_data?.employees || [];

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Company Repository
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{company.company_name}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <Badge className={getCacheStatusColor(company.cache_status)}>
                {company.cache_status}
              </Badge>
              <span className="text-sm text-gray-600">
                {company.employee_count} employees • Last enriched {company.days_since_enriched} days ago
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {company.canonical_identifier && (
            <Button variant="outline" size="sm" asChild>
              <a href={company.canonical_identifier} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                LinkedIn
              </a>
            </Button>
          )}
          <Button
            onClick={refreshCompany}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? (
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

      {/* Company-Specific AI Query */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>AI Analysis for {company.company_name}</span>
          </CardTitle>
          <CardDescription>
            Ask specific questions about this company: "Who are the senior engineers?" or "Find people with AI experience"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder={`e.g., Who are the key decision makers at ${company.company_name}?`}
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
                          <div className="text-sm text-gray-600">{rec.title}</div>
                          <div className="text-sm text-gray-500">{rec.reasoning}</div>
                          {rec.linkedinUrl && (
                            <a 
                              href={rec.linkedinUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              View LinkedIn Profile →
                            </a>
                          )}
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

      {/* Company Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold">{company.employee_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Last Enriched</p>
                <p className="text-lg font-semibold">{formatDate(company.last_enriched)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Relationships</p>
                <p className="text-2xl font-bold">
                  {company.enrichment_data?.networkAnalysis?.totalRelationships || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Graph Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Company Network & Relationships</CardTitle>
          <CardDescription>
            Interactive visualization showing employee connections, recommendations, and organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Neo4jGraphVisualization
            data={{
              company: {
                name: company.company_name,
                employees: employees.length,
                totalRecommendations: company.enrichment_data?.networkAnalysis?.totalRelationships || 0
              },
              employees: employees.map((emp: any) => ({
                name: emp.name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                title: emp.title || emp.currentPosition || emp.headline || 'No Title',
                department: emp.departments?.[0] || emp.department || 'Other',
                seniority: emp.seniority || 'entry',
                profileImage: emp.photo_url || emp.profileImage,
                linkedinUrl: emp.linkedin_url || emp.linkedinUrl
              })),
              relationships: {
                departments: employees.reduce((depts: any, emp: any) => {
                  const dept = emp.departments?.[0] || emp.department || 'Other';
                  if (!depts[dept]) depts[dept] = [];
                  depts[dept].push(emp);
                  return depts;
                }, {}),
                recommendations: company.enrichment_data?.relationships?.recommendations || []
              }
            }}
            height="500px"
          />
        </CardContent>
      </Card>

      {/* Rich Data Visualizations */}
      {employees.length > 0 && (
        <CompanyDataVisualization 
          employees={employees} 
          companyName={company.company_name}
        />
      )}
    </div>
  );
}