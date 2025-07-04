'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Brain, 
  Target, 
  Users, 
  Lightbulb, 
  Zap, 
  Heart,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Settings,
  Mic,
  MicOff,
  Eye,
  Clock
} from 'lucide-react'

export interface CoachAgent {
  type: string
  name: string
  expertise: string[]
  personality: string
  isActive: boolean
  confidence: number
  weight: number
  status?: 'speaking' | 'listening' | 'thinking' | 'standby'
}

export interface CoachPresenceIndicatorProps {
  coaches: CoachAgent[]
  conversationState?: 'idle' | 'listening' | 'thinking' | 'speaking'
  className?: string
  layout?: 'horizontal' | 'vertical' | 'grid'
  showDetails?: boolean
}

const COACH_AVATARS: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  'career_coaching': {
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'marketing_coach': {
    icon: <Target className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'engineering_coach': {
    icon: <Brain className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'leadership_coaching': {
    icon: <Users className="h-4 w-4" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  'productivity_coach': {
    icon: <Zap className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  'communication_coach': {
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  'stress_management': {
    icon: <Heart className="h-4 w-4" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100'
  },
  'procrastination_coach': {
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  'delivery_coach': {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  'accountability_coach': {
    icon: <Settings className="h-4 w-4" />,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100'
  }
}

export function CoachPresenceIndicator({ 
  coaches, 
  conversationState = 'idle',
  className = "",
  layout = 'horizontal',
  showDetails = true
}: CoachPresenceIndicatorProps) {
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null)
  
  const activeCoaches = coaches.filter(coach => coach.isActive && coach.weight > 0)
  const primaryCoach = activeCoaches.reduce((prev, current) => 
    prev && prev.weight > current.weight ? prev : current, activeCoaches[0]
  )

  useEffect(() => {
    if (conversationState === 'speaking' && primaryCoach) {
      setCurrentSpeaker(primaryCoach.type)
    } else {
      setCurrentSpeaker(null)
    }
  }, [conversationState, primaryCoach])

  const getStatusIndicator = (coach: CoachAgent) => {
    const isPrimary = coach.type === primaryCoach?.type
    const isSpeaking = currentSpeaker === coach.type
    
    if (isSpeaking) {
      return <Mic className="h-3 w-3 text-green-500 animate-pulse" />
    } else if (conversationState === 'listening' && coach.isActive) {
      return <Eye className="h-3 w-3 text-blue-500" />
    } else if (conversationState === 'thinking' && isPrimary) {
      return <Brain className="h-3 w-3 text-purple-500 animate-pulse" />
    } else if (coach.isActive) {
      return <Clock className="h-3 w-3 text-gray-400" />
    } else {
      return <MicOff className="h-3 w-3 text-gray-300" />
    }
  }

  const getStatusText = (coach: CoachAgent) => {
    const isPrimary = coach.type === primaryCoach?.type
    const isSpeaking = currentSpeaker === coach.type
    
    if (isSpeaking) return 'Speaking'
    if (conversationState === 'listening' && coach.isActive) return 'Listening'
    if (conversationState === 'thinking' && isPrimary) return 'Thinking'
    if (coach.isActive) return 'On Standby'
    return 'Inactive'
  }

  const getCoachDisplayName = (coach: CoachAgent) => {
    return coach.name || coach.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const renderCoachAvatar = (coach: CoachAgent) => {
    const avatarData = COACH_AVATARS[coach.type] || COACH_AVATARS['career_coaching']
    const isPrimary = coach.type === primaryCoach?.type
    const isSpeaking = currentSpeaker === coach.type
    
    return (
      <TooltipProvider key={coach.type}>
        <Tooltip>
          <TooltipTrigger>
            <div className="relative">
              <Avatar 
                className={`${
                  coach.isActive ? 'ring-2' : 'ring-1'
                } ${
                  isPrimary ? 'ring-blue-500' : 'ring-gray-300'
                } ${
                  isSpeaking ? 'ring-green-500 ring-4' : ''
                } transition-all duration-300 ${
                  coach.isActive ? 'opacity-100' : 'opacity-50'
                }`}
                style={{ 
                  width: layout === 'grid' ? '48px' : '40px',
                  height: layout === 'grid' ? '48px' : '40px'
                }}
              >
                <AvatarFallback className={`${avatarData.bgColor} ${avatarData.color}`}>
                  {avatarData.icon}
                </AvatarFallback>
              </Avatar>
              
              {/* Status indicator */}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                {getStatusIndicator(coach)}
              </div>
              
              {/* Weight indicator */}
              {coach.weight > 0 && showDetails && (
                <div className="absolute -top-1 -left-1">
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1 py-0 h-5 min-w-6 justify-center"
                  >
                    {coach.weight}%
                  </Badge>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{getCoachDisplayName(coach)}</div>
              <div className="text-gray-600">{getStatusText(coach)}</div>
              {coach.weight > 0 && (
                <div className="text-gray-600">Weight: {coach.weight}%</div>
              )}
              {coach.expertise.length > 0 && (
                <div className="text-gray-600 text-xs mt-1">
                  Expertise: {coach.expertise.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (activeCoaches.length === 0) {
    return (
      <Card className={`${className} border-dashed`}>
        <CardContent className="p-4 text-center">
          <div className="text-gray-400 text-sm">
            No active coaches - adjust your focus settings to begin
          </div>
        </CardContent>
      </Card>
    )
  }

  if (layout === 'vertical') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Active Coaches</div>
            <div className="space-y-2">
              {activeCoaches.map(coach => (
                <div key={coach.type} className="flex items-center space-x-3">
                  {renderCoachAvatar(coach)}
                  {showDetails && (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {getCoachDisplayName(coach)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getStatusText(coach)} • {coach.weight}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (layout === 'grid') {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Coaching Team</div>
            <div className="grid grid-cols-3 gap-3">
              {activeCoaches.map(coach => (
                <div key={coach.type} className="text-center">
                  {renderCoachAvatar(coach)}
                  {showDetails && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {getCoachDisplayName(coach).split(' ')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coach.weight}%
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Horizontal layout (default)
  return (
    <div className={`${className} flex items-center space-x-2`}>
      {showDetails && (
        <div className="text-sm text-gray-600 mr-2">
          Coaching Team:
        </div>
      )}
      <div className="flex items-center space-x-2">
        {activeCoaches.map(renderCoachAvatar)}
      </div>
      {showDetails && primaryCoach && (
        <div className="ml-3 text-sm">
          <span className="text-gray-600">Leading:</span>
          <span className="font-medium text-gray-900 ml-1">
            {getCoachDisplayName(primaryCoach)}
          </span>
        </div>
      )}
    </div>
  )
}

// Component for conversation state visualization
export function ConversationStateIndicator({ 
  state, 
  primaryCoach 
}: { 
  state: 'idle' | 'listening' | 'thinking' | 'speaking'
  primaryCoach?: CoachAgent 
}) {
  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          color: 'text-green-600 bg-green-100',
          icon: <Mic className="h-4 w-4" />,
          text: 'Listening...',
          animation: 'animate-pulse'
        }
      case 'thinking':
        return {
          color: 'text-purple-600 bg-purple-100',
          icon: <Brain className="h-4 w-4" />,
          text: 'Thinking...',
          animation: 'animate-pulse'
        }
      case 'speaking':
        return {
          color: 'text-blue-600 bg-blue-100',
          icon: <MessageCircle className="h-4 w-4" />,
          text: primaryCoach ? `${primaryCoach.name} speaking...` : 'Speaking...',
          animation: 'animate-pulse'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-100',
          icon: <Clock className="h-4 w-4" />,
          text: 'Ready to start',
          animation: ''
        }
    }
  }

  const config = getStateConfig()

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${config.color} ${config.animation}`}>
      {config.icon}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  )
}