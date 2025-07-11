'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, ExternalLink, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TestUrl {
  path: string;
  title: string;
  description: string;
  category: 'repo' | 'visualization' | 'admin' | 'auth';
  status?: 'working' | 'broken' | 'untested';
}

export default function TestUrlsPage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const testUrls: TestUrl[] = [
    // Repository Pages
    {
      path: '/repo/dashboard',
      title: 'Repository Dashboard',
      description: 'Main dashboard with profile completeness',
      category: 'repo',
      status: 'working'
    },
    {
      path: '/repo/surface/edit',
      title: 'Surface Repo Editor',
      description: 'Edit work experience with future aspirations',
      category: 'repo',
      status: 'working'
    },
    {
      path: '/repo/working/skills',
      title: 'Skills & Languages',
      description: 'Manage technical and professional skills',
      category: 'repo',
      status: 'working'
    },
    {
      path: '/repo/personal/okr',
      title: 'OKR Management',
      description: 'Set objectives and key results',
      category: 'repo',
      status: 'working'
    },
    {
      path: '/repo/personal/goals',
      title: 'Goals & Tasks',
      description: 'Manage personal goals and daily tasks',
      category: 'repo',
      status: 'working'
    },
    // Visualization Pages
    {
      path: '/visualization',
      title: 'Visualization Hub',
      description: 'Central hub for all 3D visualizations',
      category: 'visualization',
      status: 'working'
    },
    {
      path: '/visualization/career-timeline',
      title: 'Career Timeline 3D',
      description: 'Your career journey past, present, and future',
      category: 'visualization',
      status: 'working'
    },
    {
      path: '/visualization/skills-universe',
      title: 'Skills Universe 3D',
      description: 'Skills clustered by category in 3D space',
      category: 'visualization',
      status: 'working'
    },
    {
      path: '/visualization/demo/career-timeline',
      title: 'Demo Career Timeline',
      description: 'Sample career timeline (no auth required)',
      category: 'visualization',
      status: 'working'
    },
    {
      path: '/visualization/demo/skills-universe',
      title: 'Demo Skills Universe',
      description: 'Sample skills visualization (no auth required)',
      category: 'visualization',
      status: 'working'
    },
    // Admin/Setup Pages
    {
      path: '/profile/quick-setup',
      title: 'Quick Profile Setup',
      description: 'One-click to populate profile with sample data',
      category: 'admin',
      status: 'working'
    },
    {
      path: '/admin/test-data',
      title: 'Test Data Generator',
      description: 'Generate comprehensive test data',
      category: 'admin',
      status: 'working'
    },
    // Authentication Pages
    {
      path: '/sign-in',
      title: 'Sign In',
      description: 'Clerk authentication sign in',
      category: 'auth',
      status: 'working'
    },
    {
      path: '/sign-up',
      title: 'Sign Up',
      description: 'Clerk authentication sign up',
      category: 'auth',
      status: 'working'
    }
  ];

  const copyToClipboard = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'broken':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'repo':
        return 'bg-blue-100 text-blue-800';
      case 'visualization':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-orange-100 text-orange-800';
      case 'auth':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = ['repo', 'visualization', 'admin', 'auth'] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quest Platform - Test URLs</h1>
          <p className="text-gray-600">
            Complete list of working pages for testing the Repo UI Sprint and Visualization features
          </p>
        </div>

        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Testing Instructions</h2>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Start with <Link href="/profile/quick-setup" className="text-blue-600 hover:underline">Quick Setup</Link> to populate your profile with sample data</li>
            <li>2. Edit your profile at <Link href="/repo/surface/edit" className="text-blue-600 hover:underline">Surface Repo Editor</Link></li>
            <li>3. View your data in 3D at <Link href="/visualization/career-timeline" className="text-blue-600 hover:underline">Career Timeline</Link></li>
            <li>4. If visualizations are empty, try the demo versions (no auth required)</li>
          </ol>
        </div>

        {categories.map(category => {
          const categoryUrls = testUrls.filter(url => url.category === category);
          return (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {category === 'repo' ? 'Repository' : category} Pages
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryUrls.map(url => (
                  <Card key={url.path} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getStatusIcon(url.status)}
                            {url.title}
                          </CardTitle>
                          <div className="mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getCategoryColor(url.category)}`}>
                              {url.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-3">
                        {url.description}
                      </CardDescription>
                      <div className="flex gap-2">
                        <Link href={url.path}>
                          <Button size="sm" variant="default">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(url.path)}
                        >
                          {copiedUrl === url.path ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <div className="mt-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {url.path}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Known Issues</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Save functionality at /repo/surface/edit may require page refresh to see changes</li>
            <li>• Visualizations show empty state if no data exists in profile</li>
            <li>• Some TypeScript warnings in older components</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <Link href="/">
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}