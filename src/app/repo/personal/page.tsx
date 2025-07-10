'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Target, BookOpen, Brain, Heart, Lock, ArrowRight,
  TrendingUp, Users, Calendar, Star
} from 'lucide-react';

export default function PersonalRepoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Lock className="w-8 h-8 text-purple-500" />
            Personal Repository
          </h1>
          <p className="text-gray-400">
            Your private space for goals, reflections, and personal growth tracking
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-300 mb-1">Private by Default</h3>
              <p className="text-sm text-gray-300">
                Everything in your Personal Repository is private. You control what to share and with whom.
                Only share with trusted coaches, mentors, or accountability partners when you're ready.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* OKR System */}
          <Link href="/repo/personal/okr" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <Target className="w-8 h-8 text-blue-500" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-semibold mb-2">OKR Management</h2>
              <p className="text-gray-400 text-sm mb-4">
                Set quarterly objectives and track progress with measurable key results
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Progress tracking
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Quarterly reviews
                </span>
              </div>
            </div>
          </Link>

          {/* Goals & Tasks */}
          <Link href="/repo/personal/goals" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-green-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <Star className="w-8 h-8 text-yellow-500" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Goals & Tasks</h2>
              <p className="text-gray-400 text-sm mb-4">
                Break down your objectives into actionable goals and daily tasks
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Task management
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Accountability
                </span>
              </div>
            </div>
          </Link>

          {/* Personal Reflections (Coming Soon) */}
          <div className="opacity-50 cursor-not-allowed">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <Brain className="w-8 h-8 text-green-500" />
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Reflections & Insights</h2>
              <p className="text-gray-400 text-sm mb-4">
                Journal your learnings, challenges, and breakthrough moments
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Weekly reviews</span>
                <span>Growth insights</span>
              </div>
            </div>
          </div>

          {/* Values & Purpose (Coming Soon) */}
          <div className="opacity-50 cursor-not-allowed">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <Heart className="w-8 h-8 text-red-500" />
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Values & Purpose</h2>
              <p className="text-gray-400 text-sm mb-4">
                Define your core values and align your actions with your purpose
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Value alignment</span>
                <span>Purpose clarity</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3">What is the Personal Repository?</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              Your Personal Repository is the third layer of your Quest identity system. 
              It's where you track your inner journey - goals, reflections, and growth that 
              you may not be ready to share publicly.
            </p>
            <p>
              Unlike your Surface Repo (public profile) and Working Repo (professional details), 
              your Personal Repo is completely private by default. You choose what to share 
              and when.
            </p>
            <div className="pt-3 border-t border-gray-700">
              <p className="text-gray-300">
                <strong>Perfect for:</strong> OKRs, personal goals, career planning, 
                self-reflection, values exploration, and tracking your growth journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}