'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Clock, Zap, Mountain, Network, ArrowRight,
  Sparkles, TrendingUp, Target
} from 'lucide-react';

export default function CareerVisualizationDashboard() {
  const visualizations = [
    {
      title: 'Career Timeline',
      description: 'Your professional journey through time',
      icon: Clock,
      path: '/visualization/career-timeline',
      color: 'from-blue-500 to-purple-500',
      features: ['Past experiences', 'Current role', 'Future aspirations', 'Skill connections']
    },
    {
      title: 'Skills Universe',
      description: 'Your skills as gravitational clusters',
      icon: Zap,
      path: '/visualization/skills-universe',
      color: 'from-yellow-500 to-orange-500',
      features: ['Category grouping', 'Proficiency sizing', 'Experience connections', '3D navigation']
    },
    {
      title: 'OKR Mountains',
      description: 'Climb your objectives to reach new heights',
      icon: Mountain,
      path: '/visualization/okr-mountains',
      color: 'from-green-500 to-teal-500',
      features: ['Progress elevation', 'Key result waypoints', 'Achievement peaks'],
      comingSoon: true
    },
    {
      title: 'Network Galaxy',
      description: 'Your professional connections as constellations',
      icon: Network,
      path: '/visualization/network-galaxy',
      color: 'from-purple-500 to-pink-500',
      features: ['Connection strength', 'Shared skills', 'Collaboration potential'],
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Career Visualizations
          </h1>
          <p className="text-xl text-gray-400">
            See your professional journey in stunning 3D
          </p>
        </div>

        {/* Visualization Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {visualizations.map((viz) => {
            const Icon = viz.icon;
            return (
              <div key={viz.path} className="relative group">
                {viz.comingSoon ? (
                  <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 opacity-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${viz.color}`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded">Coming Soon</span>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{viz.title}</h2>
                    <p className="text-gray-400 mb-4">{viz.description}</p>
                  </div>
                ) : (
                  <Link href={viz.path}>
                    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-600 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${viz.color}`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                      </div>
                      <h2 className="text-2xl font-semibold mb-2">{viz.title}</h2>
                      <p className="text-gray-400 mb-4">{viz.description}</p>
                      <div className="space-y-1">
                        {viz.features.map((feature, i) => (
                          <div key={i} className="text-sm text-gray-500 flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-600 rounded-full" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Quick Insights
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">Timeline</div>
              <div className="text-sm text-gray-400">Track your journey</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">Skills</div>
              <div className="text-sm text-gray-400">Visualize expertise</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">Goals</div>
              <div className="text-sm text-gray-400">Coming soon</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">Network</div>
              <div className="text-sm text-gray-400">Coming soon</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link 
            href="/repo/dashboard" 
            className="px-6 py-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Repository
          </Link>
          <Link 
            href="/visualization" 
            className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            All Visualizations
          </Link>
        </div>
      </div>
    </div>
  );
}