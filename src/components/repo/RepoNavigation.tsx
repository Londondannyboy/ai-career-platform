'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, Lock, Eye, Brain, Home, BarChart3,
  Briefcase, Zap, GraduationCap, Award, Target, 
  CheckSquare, Menu, X, ChevronRight, AlertCircle,
  TrendingUp, Lightbulb
} from 'lucide-react';
import { calculateProfileCompleteness, getNavigationSuggestions } from '@/lib/repo/relationshipService';

interface RepoNavigationProps {
  userData?: any;
  className?: string;
}

export const RepoNavigation: React.FC<RepoNavigationProps> = ({
  userData,
  className = ''
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [completeness, setCompleteness] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);

  useEffect(() => {
    if (userData) {
      const comp = calculateProfileCompleteness(userData);
      setCompleteness(comp);
      
      const sugg = getNavigationSuggestions(pathname, userData);
      setSuggestions(sugg);
    }
  }, [userData, pathname]);

  const repoLayers = [
    {
      name: 'Surface Repo',
      icon: User,
      path: '/repo/surface/edit',
      description: 'Public profile & work experience',
      color: 'text-blue-500',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-700',
      sections: [
        { name: 'Profile & Experience', path: '/repo/surface/edit', icon: Briefcase },
        { name: 'Future Aspirations', path: '/repo/surface/edit#future', icon: Target }
      ]
    },
    {
      name: 'Working Repo',
      icon: Eye,
      path: '/repo/working',
      description: 'Skills & professional details',
      color: 'text-green-500',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700',
      sections: [
        { name: 'Skills & Languages', path: '/repo/working/skills', icon: Zap },
        { name: 'Education', path: '/repo/working/education', icon: GraduationCap },
        { name: 'Certifications', path: '/repo/working/certifications', icon: Award }
      ]
    },
    {
      name: 'Personal Repo',
      icon: Lock,
      path: '/repo/personal',
      description: 'Private goals & growth tracking',
      color: 'text-purple-500',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-700',
      sections: [
        { name: 'OKR Management', path: '/repo/personal/okr', icon: BarChart3 },
        { name: 'Goals & Tasks', path: '/repo/personal/goals', icon: CheckSquare }
      ]
    },
    {
      name: 'Deep Repo',
      icon: Brain,
      path: '/repo/deep',
      description: 'AI insights & deep analysis',
      color: 'text-red-500',
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700',
      sections: [
        { name: 'Trinity Identity', path: '/trinity/create', icon: Brain },
        { name: 'View All Repos', path: '/repo/edit', icon: Eye }
      ]
    }
  ];

  const getCompletionBadge = (section: string) => {
    if (!completeness) return null;
    
    let score = 0;
    switch (section) {
      case 'Surface Repo':
        score = Math.round((completeness.sections.basicInfo + 
                           completeness.sections.workExperience + 
                           completeness.sections.futureAspirations) / 3);
        break;
      case 'Working Repo':
        score = Math.round((completeness.sections.skills + 
                           completeness.sections.education + 
                           completeness.sections.certifications) / 3);
        break;
      case 'Personal Repo':
        score = Math.round((completeness.sections.okrs + 
                           completeness.sections.goals) / 2);
        break;
    }
    
    if (score === 0) return null;
    
    const color = score >= 80 ? 'bg-green-600' : 
                  score >= 60 ? 'bg-yellow-600' : 
                  score >= 40 ? 'bg-orange-600' : 'bg-red-600';
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${color} text-white`}>
        {score}%
      </span>
    );
  };

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 p-2 rounded-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Navigation Sidebar */}
      <nav className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${className}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Home className="w-6 h-6" />
              Quest Repository
            </Link>
            {completeness && (
              <div className="mt-2 text-sm text-gray-400">
                Profile: {completeness.overall}% complete
              </div>
            )}
          </div>

          {/* Repo Layers */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {repoLayers.map((layer) => {
              const layerActive = isActive(layer.path);
              
              return (
                <div key={layer.name} className="space-y-2">
                  <Link
                    href={layer.path}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      layerActive 
                        ? `${layer.bgColor} ${layer.borderColor} border` 
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <layer.icon className={`w-5 h-5 ${layer.color}`} />
                      <div>
                        <div className="font-medium">{layer.name}</div>
                        <div className="text-xs text-gray-400">
                          {layer.description}
                        </div>
                      </div>
                    </div>
                    {getCompletionBadge(layer.name)}
                  </Link>
                  
                  {/* Sub-sections */}
                  {layerActive && layer.sections && (
                    <div className="ml-4 space-y-1">
                      {layer.sections.map((section) => (
                        <Link
                          key={section.path}
                          href={section.path}
                          className={`flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                            pathname === section.path
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <section.icon className="w-4 h-4" />
                          {section.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Suggestions */}
          {suggestions?.suggested.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h4 className="text-sm font-medium">Suggested Next</h4>
              </div>
              <div className="space-y-2">
                {suggestions.suggested.slice(0, 2).map((sugg: any, index: number) => (
                  <Link
                    key={index}
                    href={sugg.path}
                    className="block p-2 bg-gray-800 rounded text-xs hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>{sugg.reason}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {suggestions?.quickActions.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <h4 className="text-sm font-medium mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.quickActions.slice(0, 4).map((action: any, index: number) => (
                  <button
                    key={index}
                    className="p-2 bg-gray-800 rounded text-xs hover:bg-gray-700 transition-colors text-center"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};