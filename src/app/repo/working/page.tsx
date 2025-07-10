'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Eye, Zap, GraduationCap, Award, ArrowRight,
  BookOpen, Target, Code, Languages
} from 'lucide-react';

export default function WorkingRepoPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Eye className="w-8 h-8 text-green-500" />
            Working Repository
          </h1>
          <p className="text-gray-400">
            Professional details visible to select connections and recruiters
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-300 mb-1">Selective Visibility</h3>
              <p className="text-sm text-gray-300">
                Working Repo content is visible to connections you approve, recruiters you engage with, 
                and when applying to opportunities. You control who sees your detailed professional information.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skills & Languages */}
          <Link href="/repo/working/skills" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-yellow-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <Zap className="w-8 h-8 text-yellow-500" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Skills & Languages</h2>
              <p className="text-gray-400 text-sm mb-4">
                Technical skills, programming languages, and proficiency levels
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  Categorized skills
                </span>
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  Language fluency
                </span>
              </div>
            </div>
          </Link>

          {/* Education */}
          <Link href="/repo/working/education" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-blue-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <GraduationCap className="w-8 h-8 text-blue-500" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Education</h2>
              <p className="text-gray-400 text-sm mb-4">
                Academic background, degrees, and ongoing learning
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Degrees & courses
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Future learning
                </span>
              </div>
            </div>
          </Link>

          {/* Certifications */}
          <Link href="/repo/working/certifications" className="group">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 hover:border-green-600 transition-all">
              <div className="flex items-start justify-between mb-4">
                <Award className="w-8 h-8 text-green-500" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-400 transform group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Certifications</h2>
              <p className="text-gray-400 text-sm mb-4">
                Professional certifications and credentials
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Active certifications</span>
                <span>In progress</span>
              </div>
            </div>
          </Link>

          {/* Projects (Coming Soon) */}
          <div className="opacity-50 cursor-not-allowed">
            <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <Code className="w-8 h-8 text-purple-500" />
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">Coming Soon</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Projects & Portfolio</h2>
              <p className="text-gray-400 text-sm mb-4">
                Showcase your best work and contributions
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Portfolio pieces</span>
                <span>Open source</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-3">What is the Working Repository?</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              Your Working Repository is the second layer of your Quest identity system. 
              It contains detailed professional information that you share selectively with 
              trusted connections, recruiters, and when applying to opportunities.
            </p>
            <p>
              Unlike your Surface Repo (always public), your Working Repo gives you control 
              over who sees your detailed skills, education, and certifications. This allows 
              you to maintain privacy while still showcasing your capabilities to the right people.
            </p>
            <div className="pt-3 border-t border-gray-700">
              <p className="text-gray-300">
                <strong>Perfect for:</strong> Detailed skill assessments, academic credentials, 
                professional certifications, project portfolios, and technical proficiencies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}