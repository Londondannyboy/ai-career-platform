'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
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
  Settings
} from 'lucide-react'

export interface CoachWeights {
  [key: string]: number
}

export interface PlaybookWeightControllerProps {
  currentWeights: CoachWeights
  onWeightsChange: (weights: CoachWeights) => void
  isActive?: boolean
  className?: string
}

interface CoachDefinition {
  type: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'primary' | 'support' | 'execution'
  color: string
}

const COACH_DEFINITIONS: CoachDefinition[] = [
  // Primary Coaches
  {
    type: 'career_coaching',
    name: 'Career Development',
    description: 'Professional growth and career navigation',
    icon: <TrendingUp className="h-4 w-4" />,
    category: 'primary',
    color: 'bg-blue-500'
  },
  {
    type: 'marketing_coach',
    name: 'Marketing Strategy',
    description: 'Campaigns, branding, and customer acquisition',
    icon: <Target className="h-4 w-4" />,
    category: 'primary',
    color: 'bg-purple-500'
  },
  {
    type: 'engineering_coach',
    name: 'Technical Leadership',
    description: 'Architecture, code quality, and team scaling',
    icon: <Brain className="h-4 w-4" />,
    category: 'primary',
    color: 'bg-green-500'
  },
  {
    type: 'leadership_coaching',
    name: 'Leadership Skills',
    description: 'Team management and executive presence',
    icon: <Users className="h-4 w-4" />,
    category: 'primary',
    color: 'bg-indigo-500'
  },
  
  // Support Coaches
  {
    type: 'productivity_coach',
    name: 'Productivity',
    description: 'Time management and workflow optimization',
    icon: <Zap className="h-4 w-4" />,
    category: 'support',
    color: 'bg-orange-500'
  },
  {
    type: 'communication_coach',
    name: 'Communication',
    description: 'Presentation skills and difficult conversations',
    icon: <MessageCircle className="h-4 w-4" />,
    category: 'support',
    color: 'bg-teal-500'
  },
  {
    type: 'stress_management',
    name: 'Stress Management',
    description: 'Burnout prevention and resilience building',
    icon: <Heart className="h-4 w-4" />,
    category: 'support',
    color: 'bg-rose-500'
  },
  {
    type: 'procrastination_coach',
    name: 'Action Taking',
    description: 'Overcoming delays and building motivation',
    icon: <Lightbulb className="h-4 w-4" />,
    category: 'support',
    color: 'bg-yellow-500'
  },
  
  // Execution Coaches
  {
    type: 'delivery_coach',
    name: 'Execution',
    description: 'Project delivery and results achievement',
    icon: <CheckCircle className="h-4 w-4" />,
    category: 'execution',
    color: 'bg-emerald-500'
  },
  {
    type: 'accountability_coach',
    name: 'Accountability',
    description: 'Follow-through and progress monitoring',
    icon: <Settings className="h-4 w-4" />,
    category: 'execution',
    color: 'bg-slate-500'
  }
]

export function PlaybookWeightController({ 
  currentWeights, 
  onWeightsChange, 
  isActive = true,
  className = ""
}: PlaybookWeightControllerProps) {
  const [weights, setWeights] = useState<CoachWeights>(currentWeights)
  const [isExpanded, setIsExpanded] = useState(false)
  const [totalWeight, setTotalWeight] = useState(0)

  useEffect(() => {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
    setTotalWeight(total)
  }, [weights])

  useEffect(() => {
    setWeights(currentWeights)
  }, [currentWeights])

  const handleWeightChange = (coachType: string, newWeight: number) => {
    const updatedWeights = { ...weights, [coachType]: newWeight }
    setWeights(updatedWeights)
    onWeightsChange(updatedWeights)
  }

  const resetWeights = () => {
    const resetWeights: CoachWeights = {}
    COACH_DEFINITIONS.forEach(coach => {
      resetWeights[coach.type] = 0
    })
    setWeights(resetWeights)
    onWeightsChange(resetWeights)
  }

  const applyPreset = (preset: 'career_focus' | 'productivity_focus' | 'leadership_focus') => {
    let presetWeights: CoachWeights = {}
    
    switch (preset) {
      case 'career_focus':
        presetWeights = {
          career_coaching: 60,
          communication_coach: 25,
          productivity_coach: 15
        }
        break
      case 'productivity_focus':
        presetWeights = {
          productivity_coach: 50,
          procrastination_coach: 30,
          delivery_coach: 20
        }
        break
      case 'leadership_focus':
        presetWeights = {
          leadership_coaching: 50,
          communication_coach: 30,
          stress_management: 20
        }
        break
    }
    
    // Reset all weights to 0, then apply preset
    const fullWeights: CoachWeights = {}
    COACH_DEFINITIONS.forEach(coach => {
      fullWeights[coach.type] = presetWeights[coach.type] || 0
    })
    
    setWeights(fullWeights)
    onWeightsChange(fullWeights)
  }

  const getActiveCoaches = () => {
    return COACH_DEFINITIONS.filter(coach => weights[coach.type] > 0)
  }

  const getCategoryTotal = (category: 'primary' | 'support' | 'execution') => {
    return COACH_DEFINITIONS
      .filter(coach => coach.category === category)
      .reduce((sum, coach) => sum + (weights[coach.type] || 0), 0)
  }

  return (
    <Card className={`${className} ${!isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Coaching Focus</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={totalWeight === 100 ? "default" : "secondary"}>
              {totalWeight}%
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Current Active Coaches Summary */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {getActiveCoaches().map(coach => (
              <Badge
                key={coach.type}
                variant="outline"
                className="flex items-center space-x-1"
              >
                {coach.icon}
                <span>{coach.name}</span>
                <span className="text-xs font-mono">
                  {weights[coach.type]}%
                </span>
              </Badge>
            ))}
            {getActiveCoaches().length === 0 && (
              <span className="text-sm text-gray-500">
                No active coaching focus - select areas below
              </span>
            )}
          </div>
          
          {/* Visual Weight Distribution */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
            {getActiveCoaches().map((coach, index) => (
              <div
                key={coach.type}
                className={`${coach.color} h-full transition-all duration-300`}
                style={{ width: `${weights[coach.type]}%` }}
                title={`${coach.name}: ${weights[coach.type]}%`}
              />
            ))}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Quick Focus Presets:</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('career_focus')}
              className="text-xs"
            >
              Career Growth
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('productivity_focus')}
              className="text-xs"
            >
              Productivity
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset('leadership_focus')}
              className="text-xs"
            >
              Leadership
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetWeights}
              className="text-xs"
            >
              Reset All
            </Button>
          </div>
        </div>

        {/* Detailed Controls */}
        {isExpanded && (
          <div className="space-y-6">
            {/* Primary Coaches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Primary Coaches</h4>
                <Badge variant="outline">{getCategoryTotal('primary')}%</Badge>
              </div>
              <div className="space-y-3">
                {COACH_DEFINITIONS.filter(c => c.category === 'primary').map(coach => (
                  <div key={coach.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${coach.color} text-white`}>
                          {coach.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{coach.name}</div>
                          <div className="text-xs text-gray-500">{coach.description}</div>
                        </div>
                      </div>
                      <div className="text-sm font-mono w-12 text-right">
                        {weights[coach.type] || 0}%
                      </div>
                    </div>
                    <Slider
                      value={[weights[coach.type] || 0]}
                      onValueChange={(value) => handleWeightChange(coach.type, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Support Coaches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Support Coaches</h4>
                <Badge variant="outline">{getCategoryTotal('support')}%</Badge>
              </div>
              <div className="space-y-3">
                {COACH_DEFINITIONS.filter(c => c.category === 'support').map(coach => (
                  <div key={coach.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${coach.color} text-white`}>
                          {coach.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{coach.name}</div>
                          <div className="text-xs text-gray-500">{coach.description}</div>
                        </div>
                      </div>
                      <div className="text-sm font-mono w-12 text-right">
                        {weights[coach.type] || 0}%
                      </div>
                    </div>
                    <Slider
                      value={[weights[coach.type] || 0]}
                      onValueChange={(value) => handleWeightChange(coach.type, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Coaches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Execution Coaches</h4>
                <Badge variant="outline">{getCategoryTotal('execution')}%</Badge>
              </div>
              <div className="space-y-3">
                {COACH_DEFINITIONS.filter(c => c.category === 'execution').map(coach => (
                  <div key={coach.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${coach.color} text-white`}>
                          {coach.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{coach.name}</div>
                          <div className="text-xs text-gray-500">{coach.description}</div>
                        </div>
                      </div>
                      <div className="text-sm font-mono w-12 text-right">
                        {weights[coach.type] || 0}%
                      </div>
                    </div>
                    <Slider
                      value={[weights[coach.type] || 0]}
                      onValueChange={(value) => handleWeightChange(coach.type, value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Warning for over/under allocation */}
        {totalWeight !== 100 && (
          <div className={`mt-4 p-3 rounded-lg border text-sm ${
            totalWeight > 100 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            {totalWeight > 100 
              ? `Over-allocated by ${totalWeight - 100}%. Consider reducing some weights.`
              : totalWeight > 0 
                ? `Under-allocated by ${100 - totalWeight}%. You can add more focus areas.`
                : 'No coaching focus selected. Choose areas above to get started.'
            }
          </div>
        )}
      </CardContent>
    </Card>
  )
}