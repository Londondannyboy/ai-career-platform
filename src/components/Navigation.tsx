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
                href="/repo"
                className="flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Mic className="h-4 w-4" />
                <span>My Repo</span>
              </Link>
              
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