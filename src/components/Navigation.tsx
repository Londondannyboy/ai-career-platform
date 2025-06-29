'use client'

import Link from 'next/link'
import { UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { 
  Mic, 
  Users, 
  Briefcase, 
  Bell,
  Compass
} from 'lucide-react'

export default function Navigation() {
  const { user, isLoaded } = useUser()

  if (!isLoaded || !user) {
    return null
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-blue-600 p-2">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Quest</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/quest"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Compass className="h-4 w-4" />
                <span>Start Quest</span>
              </Link>
              
              <Link
                href="/quest-test"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Mic className="h-4 w-4" />
                <span>Quest Test</span>
              </Link>
              
              <Link
                href="/graph-test"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Users className="h-4 w-4" />
                <span>Graph 3D</span>
              </Link>
              
              <div className="relative group">
                <button className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  <Mic className="h-4 w-4" />
                  <span>My Repo</span>
                  <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/repo/surface"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📄 Surface Repo
                    </Link>
                    <Link
                      href="/repo/mid"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💼 Mid Repo
                    </Link>
                    <Link
                      href="/repo/deep"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🎯 Deep Repo
                    </Link>
                    <Link
                      href="/repo/full"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      🌟 Full Repo
                    </Link>
                  </div>
                </div>
              </div>
              
              <Link
                href="/network"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Users className="h-4 w-4" />
                <span>Network</span>
              </Link>
              
              <Link
                href="/jobs"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Briefcase className="h-4 w-4" />
                <span>Jobs</span>
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonPopoverCard: "shadow-lg border",
                  userButtonPopoverActions: "flex-col space-y-1"
                }
              }}
              userProfileMode="navigation"
              userProfileUrl="/profile"
              afterSignOutUrl="/"
            />
          </div>
        </div>
      </div>
    </nav>
  )
}