'use client';

import React from 'react';
import Link from 'next/link';
import { Database, User, Briefcase, Target, Network, TestTube, Sparkles, Clock, Zap } from 'lucide-react';

interface VisualizationItem {
  href: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  disabled?: boolean;
}

const visualizationPages: { title: string; items: VisualizationItem[] }[] = [
  {
    title: 'Test Pages',
    items: [
      {
        href: '/visualization/3d',
        title: 'Original 3D Test',
        description: 'Original Trinity visualization with hardcoded data',
        icon: TestTube,
        color: 'text-gray-400'
      },
      {
        href: '/visualization/3d/deep-repo',
        title: 'Deep Repo Test',
        description: 'Test Trinity visualization from Deep Repo (test-user-123)',
        icon: Database,
        color: 'text-purple-400'
      }
    ]
  },
  {
    title: 'Live User Data',
    items: [
      {
        href: '/visualization/3d/my-trinity',
        title: 'My Trinity (Live)',
        description: 'Your actual Trinity from Deep Repo - requires sign in',
        icon: User,
        color: 'text-blue-400'
      },
      {
        href: '/visualization/3d/surface-repo',
        title: 'Surface Repo (LinkedIn-style)',
        description: 'Professional profile with experience & skills',
        icon: Briefcase,
        color: 'text-green-400'
      }
    ]
  },
  {
    title: 'Career Visualizations 🎉 NEW',
    items: [
      {
        href: '/visualization/career',
        title: 'Career Dashboard',
        description: 'All career visualizations in one place',
        icon: Sparkles,
        color: 'text-yellow-400'
      },
      {
        href: '/visualization/career-timeline',
        title: 'Career Timeline',
        description: 'Your journey: past, present, and future',
        icon: Clock,
        color: 'text-blue-400'
      },
      {
        href: '/visualization/skills-universe',
        title: 'Skills Universe',
        description: 'Skills as gravitational clusters',
        icon: Zap,
        color: 'text-orange-400'
      }
    ]
  },
  {
    title: 'Coming Soon',
    items: [
      {
        href: '#',
        title: 'Personal OKR',
        description: 'Goals and objectives in 3D',
        icon: Target,
        color: 'text-yellow-400',
        disabled: true
      },
      {
        href: '#',
        title: 'Career Path',
        description: 'Role progression and skill bridges',
        icon: Network,
        color: 'text-red-400',
        disabled: true
      }
    ]
  }
];

const editPages = [
  {
    href: '/api/deep-repo/edit',
    title: 'Edit Deep Repo',
    description: 'Update all 4 repo layers via API'
  },
  {
    href: '/repo/edit',
    title: 'Repo Editor UI',
    description: 'Visual editor for all repo layers'
  }
];

export default function VisualizationDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Visualization Dashboard</h1>
        
        {/* Demo Banner */}
        <div className="mb-8 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-blue-300 mb-1">🎉 Try the Demos First!</h2>
              <p className="text-gray-400">See the visualizations in action with sample data - no login required</p>
            </div>
            <Link
              href="/visualization/demo"
              className="px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-white font-medium"
            >
              View Demos
            </Link>
          </div>
        </div>
        
        {/* Edit Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">🛠️ Edit Your Repo Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <h3 className="font-semibold mb-1">{page.title}</h3>
                <p className="text-sm text-gray-400">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Visualization Pages */}
        {visualizationPages.map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="bg-gray-800 p-6 rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Icon className={`w-8 h-8 ${item.color}`} />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-gray-400">{item.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Coming soon...</p>
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className={`w-8 h-8 ${item.color}`} />
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-gray-400">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Info Box */}
        <div className="mt-12 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-3">📊 How This Works</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• <strong>Test Pages</strong> use hardcoded or test user data (test-user-123)</li>
            <li>• <strong>Live User Data</strong> pages show YOUR actual data from Deep Repo</li>
            <li>• <strong>Edit Your Data</strong> using the editor or API endpoints above</li>
            <li>• Changes appear immediately in the 3D visualizations</li>
            <li>• All data is stored in PostgreSQL JSONB columns (surface_repo, working_repo, personal_repo, deep_repo)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}