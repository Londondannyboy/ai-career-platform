'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, Award, Briefcase, GraduationCap, Users, MessageSquare, Building2, Network } from 'lucide-react';
import Link from 'next/link';
import Neo4jGraphVisualization from '@/components/Neo4jGraphVisualization';

interface Employee {
  name: string;
  title: string;
  linkedinUrl: string;
  profilePicture?: string;
  about?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  recommendations: Array<{
    recommenderName: string;
    recommenderTitle?: string;
    relationship?: string;
    text?: string;
  }>;
}

export default function EmployeePage() {
  const params = useParams();
  const employeeId = params.id as string; // This will be the encoded LinkedIn URL
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData(decodeURIComponent(employeeId));
    }
  }, [employeeId]);

  const loadEmployeeData = async (linkedinUrl: string) => {
    try {
      // First, find which company this employee belongs to
      const companiesResponse = await fetch('/api/admin/companies');
      const companiesData = await companiesResponse.json();
      
      if (companiesData.success) {
        // Find the company that contains this employee
        for (const company of companiesData.companies) {
          const companyResponse = await fetch(`/api/admin/companies/${company.id}`);
          const companyDetails = await companyResponse.json();
          
          if (companyDetails.success && companyDetails.company.enrichment_data) {
            const employees = companyDetails.company.enrichment_data.employees || [];
            const foundEmployee = employees.find((emp: any) => 
              emp.linkedinUrl === linkedinUrl || 
              emp.linkedin_url === linkedinUrl
            );
            
            if (foundEmployee) {
              setEmployee(foundEmployee);
              setCompanyData(companyDetails.company);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create focused graph data for this employee
  const createEmployeeGraphData = () => {
    if (!employee || !companyData) return null;

    const allEmployees = companyData.enrichment_data?.employees || [];
    
    // Find employees connected to this person through recommendations
    const connectedEmployees: any[] = [];
    const relationships = { recommendations: [] as any[] };

    if (companyData.enrichment_data?.relationships?.recommendations) {
      for (const rec of companyData.enrichment_data.relationships.recommendations) {
        if (rec.from === employee.name || rec.to === employee.name) {
          relationships.recommendations.push(rec);
          
          // Find the connected employee
          const connectedName = rec.from === employee.name ? rec.to : rec.from;
          const connectedEmp = allEmployees.find((emp: any) => emp.name === connectedName);
          if (connectedEmp && !connectedEmployees.find((e: any) => e.name === connectedName)) {
            connectedEmployees.push(connectedEmp);
          }
        }
      }
    }

    // Also include employees from the same department
    const sameCompanyEmployees = allEmployees.filter((emp: any) => 
      emp.name !== employee.name && 
      (emp.department === employee.department || 
       emp.title?.toLowerCase().includes(employee.title?.toLowerCase().split(' ')[0] || ''))
    ).slice(0, 5); // Limit to 5 for clarity

    const finalEmployees = [
      employee,
      ...connectedEmployees,
      ...sameCompanyEmployees.filter((emp: any) => 
        !connectedEmployees.find((ce: any) => ce.name === emp.name)
      )
    ].slice(0, 8); // Limit total to 8 employees for readability

    return {
      company: {
        name: companyData.company_name,
        employees: finalEmployees.length,
        totalRecommendations: relationships.recommendations.length
      },
      employees: finalEmployees,
      relationships: {
        departments: {
          [employee.department || 'General']: finalEmployees.filter(emp => 
            emp.department === employee.department || !emp.department
          )
        },
        recommendations: relationships.recommendations
      }
    };
  };

  const employeeGraphData = createEmployeeGraphData();

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Employee not found</h2>
          <Link href="/admin/companies">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {companyData && (
            <Link href={`/company/${companyData.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {companyData.company_name}
              </Button>
            </Link>
          )}
        </div>
        
        {employee.linkedinUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={employee.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View LinkedIn
            </a>
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            {employee.profilePicture ? (
              <img 
                src={employee.profilePicture} 
                alt={employee.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className="text-lg text-gray-600">{employee.title}</p>
              {companyData && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Building2 className="h-4 w-4 mr-1" />
                  {companyData.company_name}
                </div>
              )}
              {employee.about && (
                <p className="mt-3 text-gray-700">{employee.about}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Network Graph */}
      {employeeGraphData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="h-5 w-5 mr-2" />
              Personal Network & Relationships
            </CardTitle>
            <CardDescription>
              {employee.name}'s professional connections and relationships within {companyData?.company_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Neo4jGraphVisualization
              data={employeeGraphData}
              height="400px"
            />
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {employee.skills && employee.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {employee.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {employee.experience && employee.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Professional Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-gray-600">{exp.company}</p>
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.endDate || 'Present'}
                    </p>
                  )}
                  {exp.description && (
                    <p className="mt-2 text-sm text-gray-700">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {employee.education && employee.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee.education.map((edu, index) => (
                <div key={index}>
                  <h4 className="font-semibold">{edu.school}</h4>
                  {edu.degree && <p className="text-gray-600">{edu.degree}</p>}
                  {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-sm text-gray-500">
                      {edu.startDate} - {edu.endDate}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {employee.recommendations && employee.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Recommendations ({employee.recommendations.length})
            </CardTitle>
            <CardDescription>
              Professional endorsements and testimonials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employee.recommendations.map((rec, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <div className="mb-2">
                    <p className="font-semibold">{rec.recommenderName}</p>
                    {rec.recommenderTitle && (
                      <p className="text-sm text-gray-600">{rec.recommenderTitle}</p>
                    )}
                    {rec.relationship && (
                      <p className="text-sm text-gray-500">{rec.relationship}</p>
                    )}
                  </div>
                  {rec.text && (
                    <p className="text-gray-700 italic">"{rec.text}"</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}