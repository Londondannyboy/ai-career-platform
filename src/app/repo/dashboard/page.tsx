'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  Loader2, BarChart3, TrendingUp, Users, 
  Calendar, AlertCircle, CheckCircle, Target,
  Zap, Award, Clock, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { RepoNavigation } from '@/components/repo/RepoNavigation';
import { ProfileCompleteness } from '@/components/repo/ProfileCompleteness';
import { 
  calculateProfileCompleteness, 
  validateDataIntegrity,
  getSkillCrossReferences,
  findRelatedEntities
} from '@/lib/repo/relationshipService';
import { getTaskStats, getOverdueTasks, getUpcomingTasks } from '@/lib/repo/goalService';
import { calculateOKRProgress } from '@/lib/repo/okrService';

export default function RepoDashboard() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [completeness, setCompleteness] = useState<any>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load all repo data
    Promise.all([
      fetch('/api/surface-repo/load-simple').then(r => r.json()),
      fetch('/api/deep-repo/working/skills').then(r => r.json()),
      fetch('/api/deep-repo/working/education').then(r => r.json()),
      fetch('/api/deep-repo/personal/okr').then(r => r.json()),
      fetch('/api/deep-repo/personal/goals').then(r => r.json())
    ])
      .then(([surface, skills, education, okr, goals]) => {
        const data = {
          surfaceRepo: surface.data || {},
          workingRepo: {
            skills: skills.data?.skills || [],
            education: education.data?.items || [],
            certifications: education.data?.certifications || []
          },
          personalRepo: {
            okrs: okr.data?.okrs || [],
            goals: goals.data?.goals || [],
            dailyPlans: goals.data?.dailyPlans || []
          }
        };
        
        setUserData(data);
        
        // Calculate metrics
        const comp = calculateProfileCompleteness(data);
        setCompleteness(comp);
        
        const integ = validateDataIntegrity(data);
        setIntegrity(integ);
        
        // Calculate stats
        const allTasks = data.personalRepo.goals.flatMap((g: any) => g.tasks || []);
        const taskStats = getTaskStats(allTasks);
        const overdueTasks = getOverdueTasks(allTasks);
        const upcomingTasks = getUpcomingTasks(allTasks, 7);
        
        const activeOKRs = data.personalRepo.okrs.filter((o: any) => o.status === 'active');
        const avgOKRProgress = activeOKRs.length > 0
          ? Math.round(activeOKRs.reduce((sum: number, okr: any) => 
              sum + calculateOKRProgress(okr), 0) / activeOKRs.length)
          : 0;
        
        setStats({
          taskStats,
          overdueTasks,
          upcomingTasks,
          activeOKRs: activeOKRs.length,
          avgOKRProgress,
          totalSkills: data.workingRepo.skills.length,
          futureRoles: data.surfaceRepo.experience?.filter((e: any) => e.isFuture).length || 0
        });
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load repo data:', err);
        setLoading(false);
      });
  }, [isLoaded]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Get skill cross-references
  const skillCrossRefs = userData ? getSkillCrossReferences(
    userData.workingRepo.skills,
    userData.surfaceRepo.experience || [],
    userData.workingRepo.certifications
  ) : new Map();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Navigation Sidebar */}
      <RepoNavigation userData={userData} />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-72">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Repository Dashboard</h1>
            <p className="text-gray-400">
              Your complete professional identity and growth tracking system
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold">{stats?.activeOKRs || 0}</span>
              </div>
              <div className="text-sm text-gray-400">Active OKRs</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.avgOKRProgress || 0}% avg progress
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold">
                  {stats?.taskStats.completed || 0}/{stats?.taskStats.total || 0}
                </span>
              </div>
              <div className="text-sm text-gray-400">Tasks Complete</div>
              <div className="text-xs text-gray-500 mt-1">
                {stats?.taskStats.completionRate || 0}% done
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold">{stats?.totalSkills || 0}</span>
              </div>
              <div className="text-sm text-gray-400">Skills Listed</div>
              <div className="text-xs text-gray-500 mt-1">
                {skillCrossRefs.size} connected
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-bold">{stats?.futureRoles || 0}</span>
              </div>
              <div className="text-sm text-gray-400">Future Roles</div>
              <div className="text-xs text-gray-500 mt-1">
                Career aspirations
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Completeness */}
            <div className="md:col-span-2">
              {completeness && (
                <ProfileCompleteness completeness={completeness} />
              )}
            </div>

            {/* Alerts & Notifications */}
            <div className="space-y-4">
              {/* Data Integrity */}
              {integrity && !integrity.valid && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h3 className="font-medium">Data Issues</h3>
                  </div>
                  <ul className="text-sm space-y-1">
                    {integrity.issues.slice(0, 3).map((issue: string, i: number) => (
                      <li key={i} className="text-red-400">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Overdue Tasks */}
              {stats?.overdueTasks.length > 0 && (
                <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <h3 className="font-medium">Overdue Tasks</h3>
                  </div>
                  <ul className="text-sm space-y-1">
                    {stats.overdueTasks.slice(0, 3).map((task: any) => (
                      <li key={task.id} className="flex justify-between">
                        <span className="truncate">{task.title}</span>
                        <span className="text-gray-500 text-xs">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/repo/personal/goals"
                    className="text-xs text-orange-400 hover:text-orange-300 mt-2 inline-flex items-center gap-1"
                  >
                    View all tasks <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Upcoming Tasks */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">This Week</h3>
                </div>
                {stats?.upcomingTasks.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {stats.upcomingTasks.slice(0, 5).map((task: any) => (
                      <li key={task.id} className="flex justify-between">
                        <span className="truncate">{task.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.priority === 'urgent' ? 'bg-red-900 text-red-200' :
                          task.priority === 'high' ? 'bg-orange-900 text-orange-200' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {task.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming tasks</p>
                )}
              </div>
            </div>
          </div>

          {/* Cross-References Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Data Connections</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Skills Usage */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Top Skills by Usage
                </h3>
                <div className="space-y-2">
                  {Array.from(skillCrossRefs.entries())
                    .filter(([_, refs]) => refs.length > 0)
                    .sort((a, b) => b[1].length - a[1].length)
                    .slice(0, 5)
                    .map(([skillId, refs]) => {
                      const skill = userData.workingRepo.skills.find((s: any) => 
                        s.id === skillId || s.name === skillId
                      );
                      return (
                        <div key={skillId} className="flex justify-between items-center">
                          <span className="text-sm">{skill?.name || skillId}</span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                            Used in {refs.length} place{refs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* OKR-Goal Connections */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  OKR to Goal Alignment
                </h3>
                <div className="space-y-2">
                  {userData?.personalRepo.okrs
                    .filter((okr: any) => okr.status === 'active')
                    .slice(0, 3)
                    .map((okr: any) => {
                      const linkedGoals = userData.personalRepo.goals.filter(
                        (g: any) => g.linkedOKRId === okr.id
                      );
                      return (
                        <div key={okr.id} className="space-y-1">
                          <div className="text-sm font-medium truncate">
                            {okr.objective}
                          </div>
                          <div className="text-xs text-gray-400">
                            {linkedGoals.length} goal{linkedGoals.length !== 1 ? 's' : ''} supporting
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}