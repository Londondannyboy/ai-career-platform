'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Users, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const Neo4jGraphVisualization = dynamic(() => import('@/components/Neo4jGraphVisualization').catch(() => {
  // Fallback component if Neo4j fails to load
  return {
    default: ({ data, height }: any) => (
      <div className="h-96 flex items-center justify-center border rounded bg-red-50">
        <div className="text-center">
          <Network className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-red-600">Neo4j visualization failed to load</p>
          <p className="text-sm text-red-500 mt-2">
            {data?.employees?.length || 0} employees • {Object.keys(data?.relationships?.departments || {}).length || 0} departments
          </p>
        </div>
      </div>
    )
  };
}), {
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
      if (!employees || employees.length === 0) {
        setError('No employee data available');
        return;
      }

      console.log('Converting employees to Neo4j format:', employees.length, 'employees');

      // Convert HarvestAPI employee data to Neo4j format with rich relationships
      const validEmployees = employees
        .map(emp => {
          const name = emp.name || emp.full_name || 
            `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown';
          
          // Ensure profile image is a valid URL or null
          let profileImage = emp.photo_url || emp.profileImage;
          
          if (profileImage && !profileImage.startsWith('http')) {
            profileImage = null; // Invalid URL format
          }
          
          return {
            name,
            title: emp.title || emp.currentPosition || emp.headline || 'No Title',
            department: emp.departments?.[0] || emp.department || 'Other',
            seniority: emp.seniority || 'entry',
            profileImage,
            linkedinUrl: emp.linkedin_url || emp.linkedinUrl,
            // Add recommendation data for relationship mapping
            recommendations: emp.recommendations || [],
            connections: emp.connections || [],
            // Add relationship data if available
            relationships: emp.relationships || []
          };
        })
        .filter(emp => emp.name && emp.name !== 'Unknown' && emp.name.length > 1);

      console.log('Valid employees after filtering:', validEmployees.length);

      // Build rich relationship network from HarvestAPI data
      const recommendationEdges: any[] = [];
      const internalConnections: any[] = [];
      
      validEmployees.forEach(emp => {
        // Process recommendations (internal connections)
        if (emp.recommendations && emp.recommendations.length > 0) {
          emp.recommendations.forEach((rec: any) => {
            // Check if recommender is also in this company
            const recommender = validEmployees.find(e => 
              e.name.toLowerCase().includes(rec.recommenderName?.toLowerCase() || '') ||
              rec.recommenderName?.toLowerCase().includes(e.name.toLowerCase())
            );
            
            if (recommender) {
              recommendationEdges.push({
                from: recommender.name,
                to: emp.name,
                type: 'recommendation',
                strength: rec.strength || 0.8,
                context: rec.recommendationText || 'LinkedIn recommendation'
              });
              
              internalConnections.push({
                source: recommender.name,
                target: emp.name,
                relationship: 'recommended',
                context: rec.recommendationText || ''
              });
            }
          });
        }
        
        // Process direct relationships if available
        if (emp.relationships && emp.relationships.length > 0) {
          emp.relationships.forEach((rel: any) => {
            const target = validEmployees.find(e => 
              e.name.toLowerCase().includes(rel.targetName?.toLowerCase() || '')
            );
            
            if (target) {
              recommendationEdges.push({
                from: emp.name,
                to: target.name,
                type: rel.relationshipType || 'connection',
                strength: rel.strength || 0.6,
                context: rel.context || ''
              });
            }
          });
        }
      });

      console.log(`🔗 Built ${recommendationEdges.length} recommendation edges and ${internalConnections.length} internal connections`);

      const neo4jFormat = {
        company: {
          name: companyName,
          industry: 'Technology',
          employees: validEmployees.length,
          totalRecommendations: recommendationEdges.length
        },
        employees: validEmployees,
        relationships: {
          // Keep departmental groupings for fallback
          departments: validEmployees.reduce((depts: any, emp: any) => {
            const dept = emp.department || 'Other';
            if (!depts[dept]) depts[dept] = [];
            depts[dept].push({
              name: emp.name,
              title: emp.title,
              seniority: emp.seniority
            });
            return depts;
          }, {}),
          // Add rich recommendation network
          recommendations: recommendationEdges,
          internalConnections: internalConnections,
          // Add network metrics
          networkMetrics: {
            totalNodes: validEmployees.length,
            totalEdges: recommendationEdges.length,
            averageConnections: recommendationEdges.length > 0 ? 
              (recommendationEdges.length * 2) / validEmployees.length : 0,
            mostConnectedPerson: validEmployees.reduce((mostConnected, emp) => {
              const connections = recommendationEdges.filter(edge => 
                edge.from === emp.name || edge.to === emp.name
              ).length;
              return connections > (mostConnected.connections || 0) ? 
                { name: emp.name, connections } : mostConnected;
            }, { name: '', connections: 0 })
          }
        }
      };

      console.log('Neo4j format created:', neo4jFormat);
      setNeo4jData(neo4jFormat);

    } catch (error) {
      console.error('Error converting to Neo4j format:', error);
      setError(`Failed to convert graph data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Generating graph visualization...</p>
                  </div>
                </div>
              ) : neo4jData ? (
                <div className="relative">
                  <Neo4jGraphVisualization 
                    data={neo4jData} 
                    height="500px"
                  />
                  {/* Debug info overlay */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                      {neo4jData.employees?.length || 0} employees
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Network className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">No graph data available</p>
                  </div>
                </div>
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
                      {stats.people + stats.departments} Edges
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