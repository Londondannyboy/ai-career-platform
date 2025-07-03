'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Users, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Network,
  Brain
} from 'lucide-react';

interface Employee {
  name: string;
  title: string;
  skills: string[];
  education: any[];
  experience: any[];
  recommendations: any[];
}

interface CompanyDataVisualizationProps {
  employees: Employee[];
  companyName: string;
}

export default function CompanyDataVisualization({ 
  employees, 
  companyName 
}: CompanyDataVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'skills' | 'education' | 'experience' | 'network'>('skills');

  // Process skills data for heat map
  const skillsAnalysis = employees.reduce((acc: any, emp) => {
    if (emp.skills && Array.isArray(emp.skills)) {
      emp.skills.forEach(skill => {
        if (typeof skill === 'string' && skill.trim()) {
          const normalizedSkill = skill.trim().toLowerCase();
          if (!acc[normalizedSkill]) {
            acc[normalizedSkill] = {
              name: skill.trim(),
              count: 0,
              employees: []
            };
          }
          acc[normalizedSkill].count++;
          acc[normalizedSkill].employees.push(emp.name);
        }
      });
    }
    return acc;
  }, {});

  const topSkills = Object.values(skillsAnalysis)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 20) as any[];

  // Process education data
  const educationAnalysis = employees.reduce((acc: any, emp) => {
    if (emp.education && Array.isArray(emp.education)) {
      emp.education.forEach(edu => {
        if (edu.school || edu.schoolName) {
          const school = edu.school || edu.schoolName;
          if (!acc[school]) {
            acc[school] = {
              name: school,
              count: 0,
              employees: [],
              degrees: new Set()
            };
          }
          acc[school].count++;
          acc[school].employees.push(emp.name);
          if (edu.degree) acc[school].degrees.add(edu.degree);
        }
      });
    }
    return acc;
  }, {});

  const topSchools = Object.values(educationAnalysis)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 15) as any[];

  // Process experience/companies
  const companyExperience = employees.reduce((acc: any, emp) => {
    if (emp.experience && Array.isArray(emp.experience)) {
      emp.experience.forEach(exp => {
        if (exp.company || exp.companyName) {
          const company = exp.company || exp.companyName;
          if (company && company !== companyName) { // Exclude current company
            if (!acc[company]) {
              acc[company] = {
                name: company,
                count: 0,
                employees: [],
                roles: new Set()
              };
            }
            acc[company].count++;
            acc[company].employees.push(emp.name);
            if (exp.title || exp.position) {
              acc[company].roles.add(exp.title || exp.position);
            }
          }
        }
      });
    }
    return acc;
  }, {});

  const topCompanies = Object.values(companyExperience)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 15) as any[];

  // Network analysis
  const networkAnalysis = {
    totalRecommendations: employees.reduce((sum, emp) => 
      sum + (emp.recommendations?.length || 0), 0),
    mostRecommended: employees
      .filter(emp => emp.recommendations && emp.recommendations.length > 0)
      .sort((a, b) => (b.recommendations?.length || 0) - (a.recommendations?.length || 0))
      .slice(0, 5),
    averageRecommendations: employees.length > 0 ? 
      employees.reduce((sum, emp) => sum + (emp.recommendations?.length || 0), 0) / employees.length : 0
  };

  const getSkillColor = (count: number, maxCount: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-red-500 text-white';
    if (intensity > 0.6) return 'bg-orange-500 text-white';
    if (intensity > 0.4) return 'bg-yellow-500 text-black';
    if (intensity > 0.2) return 'bg-green-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const maxSkillCount = topSkills.length > 0 ? topSkills[0].count : 1;
  const maxSchoolCount = topSchools.length > 0 ? topSchools[0].count : 1;
  const maxCompanyCount = topCompanies.length > 0 ? topCompanies[0].count : 1;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <span>Company Intelligence Dashboard</span>
          </CardTitle>
          <CardDescription>
            Deep analytics on skills, education, experience, and network connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button
              variant={activeTab === 'skills' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('skills')}
            >
              <Award className="h-4 w-4 mr-2" />
              Skills Distribution
            </Button>
            <Button
              variant={activeTab === 'education' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('education')}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Education Networks
            </Button>
            <Button
              variant={activeTab === 'experience' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('experience')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Experience Analysis
            </Button>
            <Button
              variant={activeTab === 'network' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('network')}
            >
              <Network className="h-4 w-4 mr-2" />
              Network Intelligence
            </Button>
          </div>

          {/* Skills Bar Chart */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Skills Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">
                Most common skills across {employees.length} employees, ranked by prevalence.
              </p>
              <div className="space-y-3">
                {topSkills.map((skill, index) => {
                  const percentage = (skill.count / maxSkillCount) * 100;
                  const color = index < 5 ? 'bg-blue-500' : index < 10 ? 'bg-green-500' : 'bg-gray-400';
                  
                  return (
                    <div key={skill.name} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{skill.name}</span>
                        <span className="text-xs text-gray-500">{skill.count} people</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div 
                          className={`h-6 ${color} rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs text-white font-medium">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Employees: {skill.employees.slice(0, 3).join(', ')}{skill.employees.length > 3 && ` +${skill.employees.length - 3} more`}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {topSkills.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No skills data available. Skills will appear after enriching employee profiles.</p>
                </div>
              )}
            </div>
          )}

          {/* Education Networks */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Education Networks</h3>
              <p className="text-sm text-gray-600 mb-4">
                Educational backgrounds creating potential networks and shared connections.
              </p>
              <div className="space-y-3">
                {topSchools.map((school, index) => (
                  <div key={school.name} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{school.name}</h4>
                        <p className="text-sm text-gray-600">
                          {school.count} alumni{school.degrees.size > 0 && ` • ${Array.from(school.degrees).join(', ')}`}
                        </p>
                      </div>
                      <Badge variant="secondary">{school.count}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      <strong>Alumni:</strong> {school.employees.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              
              {topSchools.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No education data available. Education networks will appear after enriching profiles.</p>
                </div>
              )}
            </div>
          )}

          {/* Experience Analysis */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Previous Company Experience</h3>
              <p className="text-sm text-gray-600 mb-4">
                Companies where multiple employees previously worked - valuable for understanding industry connections.
              </p>
              <div className="space-y-3">
                {topCompanies.map((company, index) => (
                  <div key={company.name} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-sm text-gray-600">
                          {company.count} former employees
                          {company.roles.size > 0 && ` • Roles: ${Array.from(company.roles).slice(0, 3).join(', ')}`}
                        </p>
                      </div>
                      <Badge variant="outline">{company.count}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      <strong>Former employees:</strong> {company.employees.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              
              {topCompanies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No company experience data available. Experience analysis will appear after enriching profiles.</p>
                </div>
              )}
            </div>
          )}

          {/* Network Intelligence */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Network Intelligence</h3>
                <p className="text-sm text-gray-600 mb-4">
                  LinkedIn recommendation patterns and network connectivity analysis.
                </p>
              </div>

              {/* Network Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{networkAnalysis.totalRecommendations}</div>
                    <div className="text-sm text-gray-600">Total Recommendations</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {networkAnalysis.averageRecommendations.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Avg per Employee</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {networkAnalysis.mostRecommended.length}
                    </div>
                    <div className="text-sm text-gray-600">Well-Connected People</div>
                  </CardContent>
                </Card>
              </div>

              {/* Most Recommended People */}
              {networkAnalysis.mostRecommended.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Most Connected Employees</h4>
                  <div className="space-y-3">
                    {networkAnalysis.mostRecommended.map((emp, index) => (
                      <div key={emp.name} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium">{emp.name}</h5>
                            <p className="text-sm text-gray-600">{emp.title}</p>
                          </div>
                          <Badge variant="secondary">
                            {emp.recommendations?.length || 0} recommendations
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Strong network indicates influence and potential for introductions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {networkAnalysis.totalRecommendations === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No network data available. Network intelligence will appear after enriching with HarvestAPI.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}