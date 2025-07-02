'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Users, TrendingUp, Brain, Network } from 'lucide-react';
import { CompanyGraphVisualization } from './CompanyGraphVisualization';

interface EnrichmentResult {
  companyName: string;
  enrichmentType: string;
  profilesEnriched: number;
  networkAnalysis: {
    totalRelationships: number;
    internalConnections: number;
    externalInfluencers: number;
    averageInfluenceScore: number;
    networkDensity: number;
    keyConnectors: Array<{
      name: string;
      connectionCount: number;
      influenceScore: number;
    }>;
  };
  socialIntelligence: {
    sentiment: 'positive' | 'neutral' | 'negative';
    buyingSignals: Array<{
      signal: string;
      source: string;
      confidence: number;
    }>;
    decisionMakerActivity: Array<{
      name: string;
      title: string;
      recentActivity: string;
      buyingSignals: string[];
    }>;
  };
  employees: Array<{
    name: string;
    title: string;
    linkedin_url?: string;
    profileImage?: string;
    relationships: Array<{
      targetName: string;
      relationshipType: string;
      strength: number;
      context: string;
    }>;
    socialIntelligence: {
      recentActivity: number;
      buyingSignals: string[];
      sentiment: string;
      influenceScore: number;
    };
  }>;
  lastEnriched: string;
}

export function ApifyCompanyEnrichment() {
  const [companyIdentifier, setCompanyIdentifier] = useState('');
  const [searchType, setSearchType] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnrichmentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [maxEmployees, setMaxEmployees] = useState(25);

  const handleEnrichment = async () => {
    if (!companyIdentifier.trim()) {
      setError('Please enter a company identifier');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🔥 Starting Apify-first enrichment...');
      
      const response = await fetch('/api/enrichment/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyIdentifier,
          searchType,
          options: {
            maxEmployees,
            prioritizeDecisionMakers: true,
            forceRefresh: false
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Enrichment failed');
      }

      if (data.success) {
        setResult(data.data);
        console.log('✅ Apify enrichment completed:', data.data);
      } else {
        throw new Error('Enrichment returned unsuccessful result');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('❌ Enrichment failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSearchTypeDescription = (type: string) => {
    switch (type) {
      case 'auto': return 'Automatically detect search type';
      case 'name': return 'Search by company name';
      case 'linkedin_url': return 'LinkedIn company URL';
      case 'company_id': return 'Internal company ID';
      default: return 'Unknown search type';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Apify Company Enrichment</h1>
        <p className="text-gray-600">Deep LinkedIn intelligence powered by HarvestAPI scraping</p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Discovery
          </CardTitle>
          <CardDescription>
            Enter a company name, LinkedIn company URL, or company identifier to start deep enrichment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="company">Company Identifier</Label>
              <Input
                id="company"
                placeholder="e.g., 'Tesla', 'https://linkedin.com/company/tesla', or company ID"
                value={companyIdentifier}
                onChange={(e) => setCompanyIdentifier(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchType">Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="name">Company Name</SelectItem>
                  <SelectItem value="linkedin_url">LinkedIn URL</SelectItem>
                  <SelectItem value="company_id">Company ID</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">{getSearchTypeDescription(searchType)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="maxEmployees" className="text-sm">Max Employees:</Label>
              <Input
                id="maxEmployees"
                type="number"
                min="5"
                max="100"
                value={maxEmployees}
                onChange={(e) => setMaxEmployees(parseInt(e.target.value) || 25)}
                className="w-20"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleEnrichment} 
              disabled={isLoading || !companyIdentifier.trim()}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Network className="h-4 w-4 mr-2" />
                  Start Enrichment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{result.profilesEnriched}</p>
                    <p className="text-xs text-gray-600">Profiles Enriched</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{result.networkAnalysis.internalConnections}</p>
                    <p className="text-xs text-gray-600">Internal Connections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{result.networkAnalysis.externalInfluencers}</p>
                    <p className="text-xs text-gray-600">External Influencers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Brain className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{result.socialIntelligence.buyingSignals.length}</p>
                    <p className="text-xs text-gray-600">Buying Signals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{result.companyName} - Company Intelligence</span>
                <Badge variant="outline" className="text-xs">
                  {result.enrichmentType.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Last enriched: {new Date(result.lastEnriched).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sentiment */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall Sentiment:</span>
                <Badge className={getSentimentColor(result.socialIntelligence.sentiment)}>
                  {result.socialIntelligence.sentiment}
                </Badge>
              </div>

              {/* Network Density */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Network Density:</span>
                <span className="text-sm">{(result.networkAnalysis.networkDensity * 100).toFixed(1)}%</span>
              </div>

              {/* Buying Signals */}
              {result.socialIntelligence.buyingSignals.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Buying Signals:</span>
                  <div className="flex flex-wrap gap-1">
                    {result.socialIntelligence.buyingSignals.slice(0, 10).map((signal, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {signal.signal.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Connectors */}
              {result.networkAnalysis.keyConnectors.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Key Connectors:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {result.networkAnalysis.keyConnectors.slice(0, 6).map((connector, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                        <div className="font-medium">{connector.name}</div>
                        <div className="text-gray-600">
                          {connector.connectionCount} connections • 
                          {(connector.influenceScore * 100).toFixed(0)}% influence
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Network Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Relationship Network
              </CardTitle>
              <CardDescription>
                Interactive visualization of employee relationships and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyGraphVisualization 
                employees={result.employees}
                companyName={result.companyName}
              />
            </CardContent>
          </Card>

          {/* Decision Maker Activity */}
          {result.socialIntelligence.decisionMakerActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Decision Maker Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.socialIntelligence.decisionMakerActivity.map((dm, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="font-medium">{dm.name}</div>
                      <div className="text-sm text-gray-600">{dm.title}</div>
                      <div className="text-sm mt-1">{dm.recentActivity}</div>
                      {dm.buyingSignals.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {dm.buyingSignals.map((signal, signalIndex) => (
                            <Badge key={signalIndex} variant="outline" className="text-xs">
                              {signal.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}