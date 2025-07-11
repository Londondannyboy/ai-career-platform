'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Zap, Sparkles, ArrowRight } from 'lucide-react';

export default function VisualizationDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Visualization Demos
          </h1>
          <p className="text-xl text-gray-400">
            See the 3D visualizations in action with sample data
          </p>
          <p className="text-sm text-gray-500 mt-2">
            No authentication required - just click and explore!
          </p>
        </div>

        {/* Demo Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/visualization/demo/career-timeline" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Career Timeline Demo</h2>
              <p className="text-gray-400 mb-4">
                See a sample career journey from Junior Developer to VP of Engineering
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Past, present, and future roles
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Skill connections between roles
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Progress tracking for aspirations
                </div>
              </div>
            </div>
          </Link>

          <Link href="/visualization/demo/skills-universe" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-orange-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Skills Universe Demo</h2>
              <p className="text-gray-400 mb-4">
                Explore skills organized in gravitational clusters by category
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Technical, Business, Leadership skills
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Size based on experience level
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  Connections show related skills
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Like what you see?</h3>
          <p className="text-gray-400 mb-4">
            Create your account to build your own career visualizations with your real data.
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}