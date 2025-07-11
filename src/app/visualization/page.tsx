'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { 
  Clock, 
  Zap, 
  Mountain, 
  Network, 
  Play, 
  Lock,
  ArrowRight,
  Sparkles,
  Home
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VisualizationCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: 'available' | 'coming-soon' | 'locked';
  color: string;
  demoHref?: string;
}

const visualizations: VisualizationCard[] = [
  {
    id: 'career-timeline',
    title: 'Career Timeline',
    description: 'Your professional journey visualized in 3D space - past experiences, current role, and future aspirations',
    icon: <Clock className="w-6 h-6" />,
    href: '/visualization/career-timeline',
    demoHref: '/visualization/demo/career-timeline',
    status: 'available',
    color: 'from-blue-500 to-purple-600'
  },
  {
    id: 'skills-universe',
    title: 'Skills Universe',
    description: 'Your skills organized by category with gravitational clustering, showing proficiency and experience',
    icon: <Zap className="w-6 h-6" />,
    href: '/visualization/skills-universe',
    demoHref: '/visualization/demo/skills-universe',
    status: 'available',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'okr-mountains',
    title: 'OKR Progress Mountains',
    description: 'Topographical visualization of your objectives and key results, showing progress as elevation',
    icon: <Mountain className="w-6 h-6" />,
    href: '/visualization/3d/okr-mountains',
    demoHref: '/visualization/3d/okr-mountains',
    status: 'available',
    color: 'from-green-500 to-teal-600'
  },
  {
    id: 'network-galaxy',
    title: 'Network Galaxy',
    description: 'Your professional network as an interconnected galaxy of relationships and opportunities',
    icon: <Network className="w-6 h-6" />,
    href: '/visualization/network-galaxy',
    status: 'coming-soon',
    color: 'from-orange-500 to-red-600'
  }
];

export default function VisualizationHubPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">3D Visualizations</h1>
              <p className="text-gray-400">
                Experience your professional data in stunning three-dimensional visualizations
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
        
      {/* Quick Setup Banner */}
      {user && (
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    New to Quest?
                  </h2>
                  <p className="text-blue-100">
                    Quickly populate your profile with sample data to see the visualizations in action
                  </p>
                </div>
                <Link href="/profile/quick-setup">
                  <Button className="bg-white text-purple-600 hover:bg-gray-100">
                    Quick Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
        
      {/* Visualization Grid */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visualizations.map((viz) => (
              <Card 
                key={viz.id} 
                className={`bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:shadow-2xl transition-all ${
                  viz.status === 'available' ? 'hover:scale-105' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${viz.color} bg-opacity-20`}>
                      {viz.icon}
                    </div>
                    {viz.status === 'coming-soon' && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {viz.status === 'locked' && (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <CardTitle className="text-xl mt-4">{viz.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {viz.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {viz.status === 'available' ? (
                      <>
                        <Link href={viz.href} className="flex-1">
                          <Button className={`w-full bg-gradient-to-r ${viz.color}`}>
                            <Play className="w-4 h-4 mr-2" />
                            View Your Data
                          </Button>
                        </Link>
                        {viz.demoHref && (
                          <Link href={viz.demoHref}>
                            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              Demo
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : (
                      <Button 
                        disabled 
                        className="w-full bg-gray-700 text-gray-400 cursor-not-allowed"
                      >
                        {viz.status === 'coming-soon' ? 'Coming Soon' : 'Locked'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Demo Section */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold mb-4">Want to see examples first?</h3>
            <p className="text-gray-400 mb-6">
              Check out our demo visualizations with sample data - no login required
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/visualization/demo">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  View All Demos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}