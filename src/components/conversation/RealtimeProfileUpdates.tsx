'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Zap, 
  Brain,
  Target,
  Award,
  Briefcase 
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the skill graph to avoid SSR issues
const SkillGraph = dynamic(() => import('./MiniSkillGraph'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-gray-800 rounded animate-pulse" />
});

interface ProfileUpdate {
  id: string;
  type: 'skill' | 'experience' | 'goal' | 'achievement';
  data: any;
  confidence: number;
  reason: string;
  timestamp: Date;
  applied: boolean;
}

interface Props {
  userId: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  className?: string;
}

export default function RealtimeProfileUpdates({ 
  userId, 
  isVisible, 
  onToggleVisibility,
  className = ''
}: Props) {
  const [updates, setUpdates] = useState<ProfileUpdate[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!userId || !isVisible) return;

    // Set up real-time connection for profile updates
    const eventSource = new EventSource(`/api/conversation/updates-stream?userId=${userId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'analysis_start') {
          setIsAnalyzing(true);
        } else if (data.type === 'analysis_complete') {
          setIsAnalyzing(false);
        } else if (data.type === 'profile_update') {
          const update: ProfileUpdate = {
            id: Date.now().toString(),
            type: data.updateType,
            data: data.updateData,
            confidence: data.confidence,
            reason: data.reason,
            timestamp: new Date(),
            applied: false
          };
          
          setUpdates(prev => [update, ...prev.slice(0, 4)]); // Keep last 5 updates
          
          // If it's a skill update, refresh the graph
          if (data.updateType === 'skill') {
            refreshSkillsData();
          }
        }
      } catch (error) {
        console.error('Error parsing update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setIsAnalyzing(false);
    };

    return () => {
      eventSource.close();
    };
  }, [userId, isVisible]);

  const refreshSkillsData = async () => {
    try {
      const response = await fetch(`/api/deep-repo?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const skills = data.profile?.surfaceRepo?.skills || [];
        setSkillsData(skills);
      }
    } catch (error) {
      console.error('Error refreshing skills:', error);
    }
  };

  const applyUpdate = async (updateId: string) => {
    const update = updates.find(u => u.id === updateId);
    if (!update) return;

    try {
      const response = await fetch('/api/conversation/apply-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          update: {
            type: update.type,
            data: update.data,
            layer: getLayerForUpdateType(update.type)
          }
        })
      });

      if (response.ok) {
        setUpdates(prev => 
          prev.map(u => u.id === updateId ? { ...u, applied: true } : u)
        );
        
        if (update.type === 'skill') {
          refreshSkillsData();
        }
      }
    } catch (error) {
      console.error('Error applying update:', error);
    }
  };

  const getLayerForUpdateType = (type: string) => {
    switch (type) {
      case 'skill':
      case 'experience':
        return 'surface';
      case 'achievement':
        return 'surfacePrivate';
      case 'goal':
        return 'personal';
      default:
        return 'surface';
    }
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'skill':
        return <Brain className="h-4 w-4" />;
      case 'experience':
        return <Briefcase className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      case 'achievement':
        return <Award className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'skill':
        return 'bg-blue-500';
      case 'experience':
        return 'bg-green-500';
      case 'goal':
        return 'bg-purple-500';
      case 'achievement':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggleVisibility}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Live Updates
      </Button>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle Button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Live Profile Updates</h3>
          {isAnalyzing && (
            <div className="flex items-center gap-1 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm">Analyzing...</span>
            </div>
          )}
        </div>
        <Button
          onClick={onToggleVisibility}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </div>

      {/* Real-time Graph */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-400">Skill Network</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillGraph skills={skillsData} height={200} />
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-gray-400">Recent Detections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Start talking to see real-time profile updates...
            </p>
          ) : (
            updates.map((update) => (
              <div 
                key={update.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  update.applied 
                    ? 'bg-green-900/20 border-green-700/50' 
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-1 rounded ${getUpdateColor(update.type)}`}>
                      {getUpdateIcon(update.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium capitalize">
                          {update.type}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(update.confidence * 100)}% confident
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        {update.type === 'skill' && `Detected: ${update.data.name} (${update.data.proficiency})`}
                        {update.type === 'experience' && `${update.data.title} at ${update.data.company}`}
                        {update.type === 'goal' && update.data.description}
                        {update.type === 'achievement' && update.data.title}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        {update.reason}
                      </p>
                    </div>
                  </div>
                  
                  {!update.applied && (
                    <Button
                      onClick={() => applyUpdate(update.id)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                  )}
                  
                  {update.applied && (
                    <div className="flex items-center gap-1 text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs">Applied</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}