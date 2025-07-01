'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { Database, Upload, Check, AlertCircle, Loader2 } from 'lucide-react'

export default function NeonMigratePage() {
  const [status, setStatus] = useState<any>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/migrate-to-neon')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  const startMigration = async (dataType: string) => {
    setMigrating(true)
    setMigrationResult(null)
    try {
      const res = await fetch('/api/migrate-to-neon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataType })
      })
      const data = await res.json()
      setMigrationResult(data)
      
      // Refresh status after migration
      if (data.success) {
        await checkStatus()
      }
    } catch (error) {
      setMigrationResult({ error: 'Migration failed' })
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Upload className="h-8 w-8 text-blue-600" />
            Migrate Data to Neon.tech
          </h1>
          <p className="text-gray-600">
            Import your Neo4j data into Neon.tech with vector embeddings for intelligent search
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Current Database Status
              <Button 
                onClick={checkStatus} 
                disabled={loading}
                size="sm"
                variant="outline"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status && (
              <div className="space-y-3">
                {status.counts ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {status.counts.companies}
                        </div>
                        <div className="text-sm text-gray-600">Companies</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {status.counts.people}
                        </div>
                        <div className="text-sm text-gray-600">People</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {status.counts.documents}
                        </div>
                        <div className="text-sm text-gray-600">Documents</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-red-600">
                    {status.error || 'Failed to load status'}
                  </div>
                )}
              </div>
            )}
            
            {!status && (
              <div className="text-gray-500 text-center py-4">
                Click refresh to check current database status
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Options */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Migration Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Migrate All Data</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Import all companies and people from Neo4j with generated embeddings
                </p>
                <Button 
                  onClick={() => startMigration('all')} 
                  disabled={migrating}
                  className="w-full"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migrating...
                    </>
                  ) : (
                    'Migrate All Data'
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Companies Only</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Import company profiles
                  </p>
                  <Button 
                    onClick={() => startMigration('companies')} 
                    disabled={migrating}
                    variant="outline"
                    className="w-full"
                  >
                    Migrate Companies
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">People Only</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Import person profiles
                  </p>
                  <Button 
                    onClick={() => startMigration('people')} 
                    disabled={migrating}
                    variant="outline"
                    className="w-full"
                  >
                    Migrate People
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Results */}
        {migrationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {migrationResult.success ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    Migration Completed
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Migration Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {migrationResult.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Companies</h4>
                      <div className="space-y-1 text-sm">
                        <div>Total: {migrationResult.results.companies.total}</div>
                        <div className="text-green-600">
                          Migrated: {migrationResult.results.companies.migrated}
                        </div>
                        {migrationResult.results.companies.errors.length > 0 && (
                          <div className="text-red-600">
                            Errors: {migrationResult.results.companies.errors.length}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">People</h4>
                      <div className="space-y-1 text-sm">
                        <div>Total: {migrationResult.results.people.total}</div>
                        <div className="text-green-600">
                          Migrated: {migrationResult.results.people.migrated}
                        </div>
                        {migrationResult.results.people.errors.length > 0 && (
                          <div className="text-red-600">
                            Errors: {migrationResult.results.people.errors.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Badge variant="default" className="text-sm">
                      Total migrated: {migrationResult.summary.totalCompanies + migrationResult.summary.totalPeople} records
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  {migrationResult.error || 'Migration failed'}
                  {migrationResult.details && (
                    <div className="text-sm mt-2">{migrationResult.details}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Seed Test Data */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Seed Test Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Add sample companies and people for testing semantic search capabilities.
            </p>
            <Button 
              onClick={async () => {
                setLoading(true)
                try {
                  const res = await fetch('/api/seed-test-data', { method: 'POST' })
                  const data = await res.json()
                  alert(data.success ? 'Test data added successfully!' : 'Failed to add test data')
                  if (data.success) await checkStatus()
                } catch (error) {
                  alert('Error adding test data')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              variant="secondary"
            >
              Add Test Companies & People
            </Button>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">About Vector Embeddings</h3>
          <p className="text-sm text-blue-800">
            This migration process generates semantic embeddings for each record using OpenAI's text-embedding-ada-002 model. 
            These embeddings enable intelligent similarity search, allowing you to find related companies and people based on 
            their descriptions, skills, and other attributes.
          </p>
        </div>
      </div>
    </div>
  )
}