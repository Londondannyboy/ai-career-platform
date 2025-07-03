'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function EnrichPage() {
  const [companyName, setCompanyName] = useState('CK Delta');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  const enrichCompany = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/enrichment/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyIdentifier: companyName,
          options: {
            forceRefresh: forceRefresh,
            maxEmployees: 10
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        
        // Fetch the company ID for navigation
        try {
          const companiesResponse = await fetch('/api/admin/companies');
          const companiesData = await companiesResponse.json();
          if (companiesData.success) {
            const company = companiesData.companies.find((c: any) => 
              c.company_name.toLowerCase() === companyName.toLowerCase()
            );
            if (company) {
              setCompanyId(company.id);
            }
          }
        } catch (idError) {
          console.warn('Failed to fetch company ID:', idError);
        }
      } else {
        setError(data.error || 'Enrichment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/init-db');
      const data = await response.json();

      if (data.success) {
        setResult({ initDb: data });
      } else {
        setError(data.error || 'Database initialization failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Company Enrichment Tool</h1>

      {/* Database Initialization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>
            Initialize the database tables if this is your first time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={initDatabase} disabled={loading}>
            Initialize Database
          </Button>
        </CardContent>
      </Card>

      {/* Enrichment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Enrich Company</CardTitle>
          <CardDescription>
            Enter a company name to enrich with HarvestAPI data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Company name (e.g., CK Delta)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
            />
            <Button onClick={enrichCompany} disabled={loading || !companyName}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Enrich
                </>
              )}
            </Button>
          </div>
          
          {/* Cache Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="forceRefresh"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
            />
            <label htmlFor="forceRefresh" className="text-sm text-gray-600 cursor-pointer">
              Force refresh (bypass cache) - Only use if you need fresh data
            </label>
          </div>

          {/* Results */}
          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-green-900">
                      {result.initDb ? 'Database Initialized!' : 'Enrichment Successful!'}
                    </p>
                    {result.initDb ? (
                      <div className="text-sm text-green-700">
                        <p>Table exists: {result.initDb.tableExists ? 'Yes' : 'No'}</p>
                        <p>Companies in database: {result.initDb.companiesCount}</p>
                        <p>DATABASE_URL: {result.initDb.databaseUrl}</p>
                        <p>POSTGRES_URL: {result.initDb.postgresUrl}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-green-700">
                        <p>Company: {result.data?.companyName || 'Unknown'}</p>
                        <p>Employees found: {result.data?.profilesEnriched || 0}</p>
                        <p>Relationships: {result.data?.networkAnalysis?.totalRelationships || 0}</p>
                        <p>Intelligence score: {(result.data?.networkAnalysis?.averageInfluenceScore * 100)?.toFixed(1) || 'N/A'}</p>
                        <p>Cached: No (Force refresh)</p>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-gray-500">Show raw API response</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </details>
                        {companyId && (
                          <div className="mt-4">
                            <Link href={`/company/${companyId}`}>
                              <Button size="sm" className="w-full">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Company Page & Neo4j Graph
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}