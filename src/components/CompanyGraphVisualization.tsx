'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Users, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const Neo4jGraphVisualization = dynamic(() => import('@/components/Neo4jGraphVisualization'), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center text-gray-500">Loading Neo4j graph...</div>
});

interface GraphNode {
  id: string;
  label: string;
  type: 'company' | 'person' | 'department';
  properties: Record<string, any>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  label?: string;
}

interface GraphVisualizationProps {
  companyName: string;
  employees?: any[];
  className?: string;
}

export default function CompanyGraphVisualization({ 
  companyName, 
  employees = [],
  className = "" 
}: GraphVisualizationProps) {
  const [neo4jData, setNeo4jData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employees.length > 0) {
      setShowGraph(true);
      convertToNeo4jFormat();
    }
  }, [employees]);

  const convertToNeo4jFormat = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert Apollo employee data to Neo4j format
      const neo4jFormat = {
        company: {
          name: companyName,
          industry: 'Technology', // Could be extracted from Apollo data
          employees: employees.length
        },
        employees: employees.map(emp => ({
          name: emp.name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
          title: emp.title || emp.currentPosition || emp.headline,
          department: emp.departments?.[0] || emp.department,
          seniority: emp.seniority,
          profileImage: emp.photo_url,
          linkedinUrl: emp.linkedin_url || emp.linkedinUrl
        })).filter(emp => emp.name && emp.name !== ''),
        relationships: {
          // Group employees by department for clustering
          departments: employees.reduce((depts: any, emp: any) => {
            const dept = emp.departments?.[0] || emp.department || 'Other';
            if (!depts[dept]) depts[dept] = [];
            depts[dept].push({
              name: emp.name || emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
              title: emp.title || emp.currentPosition,
              seniority: emp.seniority
            });
            return depts;
          }, {})
        }
      };

      setNeo4jData(neo4jFormat);

    } catch (error) {
      console.error('Error converting to Neo4j format:', error);
      setError('Failed to convert graph data');
    } finally {
      setIsLoading(false);
    }
  };

  const getGraphStats = () => {
    if (!neo4jData) return null;

    const companies = 1; // Always 1 company
    const people = neo4jData.employees?.length || 0;
    const departments = Object.keys(neo4jData.relationships?.departments || {}).length;
    const linkedInProfiles = neo4jData.employees?.filter((emp: any) => emp.linkedinUrl).length || 0;

    return { 
      companies, 
      people, 
      departments, 
      linkedInProfiles, 
      total: 1 + people + departments // Company + people + departments
    };
  };


  const stats = getGraphStats();

  if (employees.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Company Network Graph
          </CardTitle>
          <CardDescription>
            Network visualization will appear when employee data is available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Search for a company to see network visualization</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {companyName} Network Graph
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGraph(!showGraph)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : showGraph ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Generating...' : showGraph ? 'Hide Graph' : 'Show Graph'}
          </Button>
        </CardTitle>
        <CardDescription>
          Interactive network visualization of company structure and relationships
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {showGraph && stats && (
          <div className="space-y-4">
            {/* Graph Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold text-blue-600">{stats.companies}</p>
                <p className="text-xs text-gray-600">Companies</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold text-green-600">{stats.people}</p>
                <p className="text-xs text-gray-600">Key People</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Network className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                <p className="text-xl font-bold text-purple-600">{stats.departments}</p>
                <p className="text-xs text-gray-600">Departments</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Users className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xl font-bold text-orange-600">{stats.linkedInProfiles}</p>
                <p className="text-xs text-gray-600">LinkedIn URLs</p>
              </div>
            </div>

            {/* Neo4j Graph Visualization */}
            <div className="border rounded-lg bg-white">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🕸️ Neo4j Company Network
                </h3>
                <p className="text-sm text-gray-600">
                  Interactive graph visualization • {stats.total} nodes • Drag and explore relationships
                </p>
              </div>
              
              {/* Neo4j Network Component */}
              {neo4jData && (
                <Neo4jGraphVisualization 
                  data={neo4jData} 
                  height="500px"
                />
              )}
              
              {/* Network structure info */}
              <div className="p-4 border-t bg-gray-50">
                <div className="text-left">
                  <p className="font-medium text-sm mb-2">Network Structure:</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• {companyName} → EMPLOYS → {stats.people} people</p>
                    <p>• {stats.departments} departments with team clusters</p>
                    <p>• {stats.linkedInProfiles} LinkedIn profiles for outreach</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline">Neo4j Powered</Badge>
                  <Badge variant="outline">LinkedIn URLs Available</Badge>
                  <Badge variant="outline">Company Hierarchy</Badge>
                  <Badge variant="outline">Interactive Physics</Badge>
                </div>
              </div>
            </div>

            {/* Integration Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Network className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Neo4j Integration Ready</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This data structure is ready to be exported to Neo4j for interactive graph visualization, 
                    similar to the CK Delta network mapping you've seen before.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {stats.total} Nodes
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {graphData?.edges.length} Edges
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Company Hierarchy
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showGraph && (
          <div className="text-center py-8">
            <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Click "Show Graph" to visualize {companyName}'s network structure
            </p>
            <p className="text-sm text-gray-500">
              {employees.length} employees • Ready for Neo4j visualization
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}