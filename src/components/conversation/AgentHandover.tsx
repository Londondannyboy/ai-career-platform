'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Users, 
  Brain,
  Target,
  Calendar,
  BookOpen,
  Zap
} from 'lucide-react';

interface HandoverSuggestion {
  shouldHandover: boolean;
  targetAgent: string;
  confidence: number;
  reason: string;
  suggestedMessage: string;
  urgency: 'low' | 'medium' | 'high';
}

interface Props {
  handoverSuggestion: HandoverSuggestion | null;
  currentAgent: string;
  onAcceptHandover: (targetAgent: string) => void;
  onRejectHandover: () => void;
  onManualHandover: (targetAgent: string) => void;
  availableAgents?: Array<{
    agentId: string;
    name: string;
    description: string;
    capabilities: string[];
  }>;
}

export default function AgentHandover({ 
  handoverSuggestion, 
  currentAgent,
  onAcceptHandover, 
  onRejectHandover,
  onManualHandover,
  availableAgents = []
}: Props) {
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [processingHandover, setProcessingHandover] = useState(false);

  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'quest': return <Users className="h-4 w-4" />;
      case 'productivity': return <Zap className="h-4 w-4" />;
      case 'goal': return <Target className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'learning': return <BookOpen className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getAgentColor = (agentId: string) => {
    switch (agentId) {
      case 'quest': return 'bg-blue-500';
      case 'productivity': return 'bg-green-500';
      case 'goal': return 'bg-purple-500';
      case 'calendar': return 'bg-orange-500';
      case 'learning': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-400 bg-red-50';
      case 'medium': return 'border-yellow-400 bg-yellow-50';
      case 'low': return 'border-blue-400 bg-blue-50';
      default: return 'border-gray-400 bg-gray-50';
    }
  };

  const handleAcceptHandover = async (targetAgent: string) => {
    setProcessingHandover(true);
    try {
      await onAcceptHandover(targetAgent);
    } finally {
      setProcessingHandover(false);
    }
  };

  const handleManualHandover = async (targetAgent: string) => {
    setProcessingHandover(true);
    try {
      await onManualHandover(targetAgent);
      setShowManualSelection(false);
    } finally {
      setProcessingHandover(false);
    }
  };

  // Show suggested handover
  if (handoverSuggestion && handoverSuggestion.shouldHandover) {
    const targetAgentData = availableAgents.find(a => a.agentId === handoverSuggestion.targetAgent);
    
    return (
      <Card className={`border-2 transition-all duration-300 ${getUrgencyColor(handoverSuggestion.urgency)}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-full ${getAgentColor(handoverSuggestion.targetAgent)}`}>
                {getAgentIcon(handoverSuggestion.targetAgent)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {handoverSuggestion.suggestedMessage}
                  </span>
                  <Badge 
                    variant={handoverSuggestion.confidence > 0.8 ? "default" : "outline"}
                    className="text-xs"
                  >
                    {Math.round(handoverSuggestion.confidence * 100)}% confident
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      handoverSuggestion.urgency === 'high' ? 'border-red-500 text-red-700' :
                      handoverSuggestion.urgency === 'medium' ? 'border-yellow-500 text-yellow-700' :
                      'border-blue-500 text-blue-700'
                    }`}
                  >
                    {handoverSuggestion.urgency} priority
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {handoverSuggestion.reason}
                </p>
                
                {targetAgentData && (
                  <div className="text-xs text-gray-500">
                    <strong>{targetAgentData.name}:</strong> {targetAgentData.description}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={() => handleAcceptHandover(handoverSuggestion.targetAgent)}
                disabled={processingHandover}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {processingHandover ? 'Switching...' : 'Yes, switch'}
              </Button>
              <Button
                onClick={onRejectHandover}
                disabled={processingHandover}
                variant="outline"
                size="sm"
              >
                <XCircle className="h-3 w-3 mr-1" />
                No thanks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show manual agent selection
  if (showManualSelection) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-medium text-gray-900 mb-2">Choose a specialized agent:</h3>
            <div className="grid grid-cols-1 gap-2">
              {availableAgents
                .filter(agent => agent.agentId !== currentAgent)
                .map(agent => (
                  <Button
                    key={agent.agentId}
                    onClick={() => handleManualHandover(agent.agentId)}
                    disabled={processingHandover}
                    variant="outline"
                    className="justify-start h-auto p-3 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${getAgentColor(agent.agentId)}`}>
                        {getAgentIcon(agent.agentId)}
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-gray-600">{agent.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {agent.capabilities.slice(0, 3).join(', ')}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={() => setShowManualSelection(false)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show current agent status with manual handover option
  const currentAgentData = availableAgents.find(a => a.agentId === currentAgent);
  
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${getAgentColor(currentAgent)}`}>
          {getAgentIcon(currentAgent)}
        </div>
        <div>
          <div className="font-medium text-sm">
            {currentAgentData?.name || 'Quest Career Coach'}
          </div>
          <div className="text-xs text-gray-600">
            {currentAgentData?.description || 'Your primary career development assistant'}
          </div>
        </div>
      </div>
      
      {availableAgents.length > 1 && (
        <Button
          onClick={() => setShowManualSelection(true)}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          <ArrowRight className="h-3 w-3 mr-1" />
          Switch Agent
        </Button>
      )}
    </div>
  );
}