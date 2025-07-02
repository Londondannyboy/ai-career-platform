'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Users, Building2, Eye, EyeOff, Loader2 } from 'lucide-react';

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
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employees.length > 0 && showGraph) {
      generateGraphData();
    }
  }, [employees, showGraph]);

  const generateGraphData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate nodes and edges from employee data
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      // Add company node
      nodes.push({
        id: `company_${companyName.toLowerCase().replace(/\s+/g, '_')}`,
        label: companyName,
        type: 'company',
        properties: {
          employeeCount: employees.length,
          color: '#2563eb',
          size: 30
        }
      });

      // Add department nodes
      const departments = new Map<string, number>();
      employees.forEach(emp => {
        if (emp.departments) {
          emp.departments.forEach((dept: string) => {
            departments.set(dept, (departments.get(dept) || 0) + 1);
          });
        }
      });

      // Create department nodes
      departments.forEach((count, deptName) => {
        const deptId = `dept_${deptName.toLowerCase().replace(/\s+/g, '_')}`;
        nodes.push({
          id: deptId,
          label: deptName.replace('master_', '').replace(/_/g, ' '),
          type: 'department',
          properties: {
            employeeCount: count,
            color: '#7c3aed',
            size: Math.min(20 + count * 2, 40)
          }
        });

        // Connect department to company
        edges.push({
          from: `company_${companyName.toLowerCase().replace(/\s+/g, '_')}`,
          to: deptId,
          type: 'HAS_DEPARTMENT',
          label: `${count} employees`
        });
      });

      // Add key people (decision makers and notable profiles)
      const keyPeople = employees
        .filter(emp => 
          ['c_suite', 'vp', 'director'].includes(emp.seniority) || 
          emp.linkedin_url
        )
        .slice(0, 15); // Limit to avoid overcrowding

      keyPeople.forEach(person => {
        const personId = `person_${person.id || person.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        nodes.push({
          id: personId,
          label: person.name,
          type: 'person',
          properties: {
            title: person.title,
            seniority: person.seniority,
            hasLinkedIn: !!person.linkedin_url,
            color: person.seniority === 'c_suite' ? '#dc2626' : 
                   person.seniority === 'vp' ? '#ea580c' :
                   person.seniority === 'director' ? '#ca8a04' : '#059669',
            size: person.seniority === 'c_suite' ? 25 : 
                  person.seniority === 'vp' ? 20 : 15
          }
        });

        // Connect person to company
        edges.push({
          from: `company_${companyName.toLowerCase().replace(/\s+/g, '_')}`,
          to: personId,
          type: 'WORKS_AT',
          label: person.title
        });

        // Connect person to departments
        if (person.departments) {
          person.departments.forEach((dept: string) => {
            const deptId = `dept_${dept.toLowerCase().replace(/\s+/g, '_')}`;
            if (departments.has(dept)) {
              edges.push({
                from: personId,
                to: deptId,
                type: 'MEMBER_OF'
              });
            }
          });
        }
      });

      setGraphData({ nodes, edges });

      // If we have actual Neo4j integration, we could send data there
      // await sendToNeo4j({ nodes, edges });

    } catch (err) {
      console.error('Error generating graph data:', err);
      setError('Failed to generate graph visualization');
    } finally {
      setIsLoading(false);
    }
  };

  const getGraphStats = () => {
    if (!graphData) return null;

    const companies = graphData.nodes.filter(n => n.type === 'company').length;
    const people = graphData.nodes.filter(n => n.type === 'person').length;
    const departments = graphData.nodes.filter(n => n.type === 'department').length;
    const linkedInProfiles = graphData.nodes.filter(n => 
      n.type === 'person' && n.properties.hasLinkedIn
    ).length;

    return { companies, people, departments, linkedInProfiles, total: graphData.nodes.length };
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

            {/* Graph Visualization Preview */}
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
              <Network className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Neo4j Graph Visualization
              </h3>
              <p className="text-gray-600 mb-4">
                {stats.total} nodes and {graphData?.edges.length} relationships ready for visualization
              </p>
              
              {/* Show sample data structure */}
              <div className="text-left bg-white p-4 rounded border max-w-md mx-auto">
                <p className="font-medium text-sm mb-2">Sample Relationships:</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>• {companyName} → HAS_DEPARTMENT → {stats.departments} departments</p>
                  <p>• {stats.people} people → WORKS_AT → {companyName}</p>
                  <p>• {stats.linkedInProfiles} LinkedIn profiles for outreach</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <Badge variant="outline">Ready for Neo4j</Badge>
                <Badge variant="outline">LinkedIn URLs Available</Badge>
                <Badge variant="outline">Hierarchy Mapped</Badge>
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