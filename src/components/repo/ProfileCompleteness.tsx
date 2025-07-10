'use client';

import React from 'react';
import { 
  User, Briefcase, Target, Zap, GraduationCap, 
  Award, BarChart3, CheckSquare, TrendingUp,
  AlertCircle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { ProfileCompleteness as ProfileCompletenessType } from '@/lib/repo/relationshipService';

interface ProfileCompletenessProps {
  completeness: ProfileCompletenessType;
  onNavigate?: (path: string) => void;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({
  completeness,
  onNavigate
}) => {
  const getColorClass = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500';
    if (score >= 40) return 'text-orange-500 bg-orange-500';
    return 'text-red-500 bg-red-500';
  };

  const getIcon = (section: string) => {
    switch (section) {
      case 'basicInfo': return User;
      case 'workExperience': return Briefcase;
      case 'futureAspirations': return Target;
      case 'skills': return Zap;
      case 'education': return GraduationCap;
      case 'certifications': return Award;
      case 'okrs': return BarChart3;
      case 'goals': return CheckSquare;
      default: return User;
    }
  };

  const getPath = (section: string) => {
    switch (section) {
      case 'basicInfo': return '/repo/surface/edit';
      case 'workExperience': return '/repo/surface/edit';
      case 'futureAspirations': return '/repo/surface/edit';
      case 'skills': return '/repo/working/skills';
      case 'education': return '/repo/working/education';
      case 'certifications': return '/repo/working/certifications';
      case 'okrs': return '/repo/personal/okr';
      case 'goals': return '/repo/personal/goals';
      default: return '/repo/edit';
    }
  };

  const sectionNames = {
    basicInfo: 'Basic Information',
    workExperience: 'Work Experience',
    futureAspirations: 'Future Aspirations',
    skills: 'Skills & Languages',
    education: 'Education',
    certifications: 'Certifications',
    okrs: 'OKRs',
    goals: 'Goals & Tasks'
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Profile Completeness</h3>
            <p className="text-sm text-gray-400 mt-1">
              Complete your profile to unlock Quest's full potential
            </p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getColorClass(completeness.overall)}`}>
              {completeness.overall}%
            </div>
            <div className="text-xs text-gray-400">Overall</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
          <div 
            className={`h-3 rounded-full transition-all ${getColorClass(completeness.overall)}`}
            style={{ width: `${completeness.overall}%` }}
          />
        </div>

        {/* Section Breakdown */}
        <div className="grid md:grid-cols-2 gap-3">
          {Object.entries(completeness.sections).map(([section, score]) => {
            const Icon = getIcon(section);
            const path = getPath(section);
            const name = sectionNames[section as keyof typeof sectionNames];
            
            return (
              <Link
                key={section}
                href={path}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${getColorClass(score)}`} />
                  <div>
                    <div className="text-sm font-medium">{name}</div>
                    <div className="text-xs text-gray-400">{score}% complete</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      {completeness.recommendations.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            <h4 className="font-medium">Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {completeness.recommendations.map((rec, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps */}
      {completeness.nextSteps.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium">Next Steps</h4>
          </div>
          <div className="space-y-2">
            {completeness.nextSteps.map((step, index) => (
              <div key={index} className="text-sm flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-blue-600' : 'bg-gray-700'
                }`}>
                  {index + 1}
                </div>
                <span className={index === 0 ? 'text-white' : 'text-gray-400'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};