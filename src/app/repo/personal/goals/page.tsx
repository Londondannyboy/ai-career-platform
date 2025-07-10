'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Save, Loader2, ArrowLeft, Target, CheckSquare, 
  Calendar, BarChart3, AlertCircle, TrendingUp,
  Clock, Lock
} from 'lucide-react';
import { GoalsTasksEditor } from '@/components/repo/GoalsTasksEditor';
import { Toast } from '@/components/ui/toast';
import { Goal, DailyPlan, getTaskStats, getOverdueTasks } from '@/lib/repo/goalService';

export default function PersonalGoalsPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [linkedOKRs, setLinkedOKRs] = useState<any[]>([]);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Load Goals from Personal Repo
    fetch('/api/deep-repo/personal/goals')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setGoals(data.data.goals || []);
          setDailyPlans(data.data.dailyPlans || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load goals:', err);
        setLoading(false);
      });

    // Load OKRs to link with goals
    fetch('/api/deep-repo/personal/okr')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.okrs) {
          setLinkedOKRs(data.data.okrs);
        }
      })
      .catch(err => {
        console.error('Failed to load OKRs:', err);
      });
  }, [isLoaded]);

  const save = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/deep-repo/personal/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals, dailyPlans })
      });
      
      if (response.ok) {
        setShowToast({ message: 'Goals saved successfully!', type: 'success' });
      } else {
        const error = await response.json();
        setShowToast({ message: error.error || 'Failed to save', type: 'error' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setShowToast({ message: 'Network error while saving', type: 'error' });
    }
    
    setSaving(false);
  };

  const handleChange = (newGoals: Goal[], newDailyPlans: DailyPlan[]) => {
    setGoals(newGoals);
    setDailyPlans(newDailyPlans);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Calculate stats
  const allTasks = goals.flatMap(g => g.tasks);
  const taskStats = getTaskStats(allTasks);
  const overdueTasks = getOverdueTasks(allTasks);
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/repo/personal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Personal Repo
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CheckSquare className="w-8 h-8 text-green-500" />
              Goals & Tasks
            </h1>
            <p className="text-gray-400 mt-1">Break down your OKRs into actionable goals and daily tasks</p>
          </div>
          
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-purple-300 mb-1">Personal Repo - Private by Default</h3>
            <p className="text-sm text-gray-300">
              Your goals and tasks are stored in your Personal Repository and are private by default. 
              Share specific goals with your accountability partners when you need support.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold">{activeGoals.length}</span>
            </div>
            <div className="text-sm text-gray-400">Active Goals</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold">{taskStats.completed}</span>
            </div>
            <div className="text-sm text-gray-400">Tasks Completed</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold">{taskStats.inProgress}</span>
            </div>
            <div className="text-sm text-gray-400">In Progress</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-bold">{overdueTasks.length}</span>
            </div>
            <div className="text-sm text-gray-400">Overdue</div>
          </div>
        </div>

        {/* Goals & Tasks Editor */}
        <GoalsTasksEditor
          goals={goals}
          dailyPlans={dailyPlans}
          linkedOKRs={linkedOKRs}
          onChange={handleChange}
        />

        {/* Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 Goal Management Best Practices</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Break down each OKR objective into 2-4 specific goals</li>
            <li>• Each goal should have 5-10 actionable tasks</li>
            <li>• Use priorities to focus on what matters most</li>
            <li>• Review and update task progress daily</li>
            <li>• Set realistic due dates and stick to them</li>
            <li>• Link goals to OKRs for better alignment</li>
            <li>• Use the daily view to plan your work</li>
          </ul>
        </div>
      </div>

      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}