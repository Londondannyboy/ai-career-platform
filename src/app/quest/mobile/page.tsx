'use client'

// Mobile-first Quest launcher
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Home, Mic, Phone, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MobileQuestPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setIsReady(true)
    }
  }, [isLoaded])

  const startQuest = () => {
    router.push('/quest/enhanced')
  }

  const goToDashboard = () => {
    router.push('/')
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Mobile Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Quest</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={goToDashboard}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Home className="h-5 w-5 text-gray-600" />
            </button>
            {user ? (
              <img 
                src={user.imageUrl || '/default-avatar.png'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-blue-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start your Quest?
          </h1>
          <p className="text-gray-600 text-lg mb-2">
            Your AI-powered career coaching session
          </p>
          {user && (
            <p className="text-sm text-gray-500">
              Welcome back, {user.firstName}!
            </p>
          )}
        </div>

        {/* Voice Visualization Preview */}
        <div className="flex justify-center mb-12">
          <div className="flex items-end space-x-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-4 bg-blue-300 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 max-w-sm mx-auto">
          <Button
            onClick={startQuest}
            size="lg"
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold rounded-2xl shadow-lg"
          >
            <Phone className="mr-3 h-6 w-6" />
            Start Quest Session
          </Button>

          <Button
            onClick={goToDashboard}
            variant="outline"
            size="lg"
            className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl"
          >
            <Home className="mr-2 h-5 w-5" />
            Go to Dashboard
          </Button>
        </div>

        {/* Quick Info */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-2xl p-6 mx-auto max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-3">What to expect:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <Mic className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
              Voice-first coaching experience
            </li>
            <li className="flex items-center">
              <Brain className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
              AI coaches adapt to your goals
            </li>
            <li className="flex items-center">
              <Settings className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              Personalized coaching methodology
            </li>
          </ul>
        </div>

        {/* Bottom Spacing for Mobile */}
        <div className="h-16"></div>
      </div>
    </div>
  )
}