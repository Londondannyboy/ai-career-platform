'use client';

import { useState, useEffect } from 'react';

interface AgentState {
  agentId: string;
  name: string;
  icon: string;
  relevance: number; // 0-100
  status: 'active' | 'relevant' | 'available' | 'dormant';
  pulseIntensity: number;
  lastTriggerWords: string[];
  description: string;
}

interface Props {
  currentAgent: string;
  availableAgents: any[];
  onRequestHandover: (agentId: string) => void;
  className?: string;
}

const AGENT_CONFIGS: Record<string, Omit<AgentState, 'relevance' | 'status' | 'pulseIntensity' | 'lastTriggerWords'>> = {
  quest: {
    agentId: 'quest',
    name: 'Quest',
    icon: '👤',
    description: 'Main conversation agent for career coaching and guidance'
  },
  productivity: {
    agentId: 'productivity',
    name: 'Tasks',
    icon: '⚡',
    description: 'Task management, todo lists, and productivity optimization'
  },
  goal: {
    agentId: 'goal',
    name: 'Goals',
    icon: '🎯',
    description: 'Goal setting, OKRs, and strategic planning'
  },
  calendar: {
    agentId: 'calendar',
    name: 'Calendar',
    icon: '📅',
    description: 'Schedule management and meeting coordination'
  },
  learning: {
    agentId: 'learning',
    name: 'Learning',
    icon: '📚',
    description: 'Learning paths, skill development, and knowledge management'
  }
};

export default function AgentSidebar({ currentAgent, availableAgents, onRequestHandover, className = '' }: Props) {
  const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});

  useEffect(() => {
    // Initialize agent states
    const initialStates: Record<string, AgentState> = {};
    
    Object.values(AGENT_CONFIGS).forEach(config => {
      initialStates[config.agentId] = {
        ...config,
        relevance: 0,
        status: config.agentId === currentAgent ? 'active' : 'available',
        pulseIntensity: 0,
        lastTriggerWords: []
      };
    });

    setAgentStates(initialStates);
  }, [currentAgent]);

  // Update agent relevance based on external data
  useEffect(() => {
    setAgentStates(prev => {
      const updated = { ...prev };
      
      // Update statuses based on current agent
      Object.keys(updated).forEach(agentId => {
        if (agentId === currentAgent) {
          updated[agentId].status = 'active';
        } else if (updated[agentId].relevance > 70) {
          updated[agentId].status = 'relevant';
          updated[agentId].pulseIntensity = Math.min(100, updated[agentId].relevance);
        } else if (updated[agentId].relevance > 30) {
          updated[agentId].status = 'available';
        } else {
          updated[agentId].status = 'dormant';
        }
      });

      return updated;
    });
  }, [currentAgent, availableAgents]);

  const updateAgentRelevance = (agentId: string, relevance: number, triggerWords: string[] = []) => {
    setAgentStates(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        relevance,
        lastTriggerWords: triggerWords,
        pulseIntensity: relevance > 50 ? Math.min(100, relevance * 1.2) : 0
      }
    }));
  };

  // Expose method for parent component to trigger relevance updates
  useEffect(() => {
    (window as any).updateAgentRelevance = updateAgentRelevance;
    return () => {
      delete (window as any).updateAgentRelevance;
    };
  }, []);

  const getAgentClassName = (agent: AgentState) => {
    const base = "group relative p-3 rounded-lg border transition-all duration-300 cursor-pointer";
    
    switch (agent.status) {
      case 'active':
        return `${base} bg-blue-500 text-white border-blue-600 shadow-lg ring-2 ring-blue-300`;
      case 'relevant':
        return `${base} bg-orange-50 border-orange-300 hover:bg-orange-100 animate-pulse shadow-md`;
      case 'available':
        return `${base} bg-gray-50 border-gray-200 hover:bg-gray-100`;
      case 'dormant':
        return `${base} bg-gray-25 border-gray-100 opacity-60 hover:opacity-80`;
      default:
        return base;
    }
  };

  const getIconClassName = (agent: AgentState) => {
    const base = "text-2xl transition-all duration-300";
    
    switch (agent.status) {
      case 'active':
        return `${base} scale-110`;
      case 'relevant':
        return `${base} scale-105`;
      case 'available':
        return base;
      case 'dormant':
        return `${base} scale-90 grayscale`;
      default:
        return base;
    }
  };

  const handleAgentClick = (agentId: string) => {
    if (agentId !== currentAgent && agentStates[agentId]?.status !== 'dormant') {
      onRequestHandover(agentId);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-sm font-semibold text-gray-700 mb-4">AI Agents</div>
      
      {Object.values(agentStates).map(agent => (
        <div
          key={agent.agentId}
          className={getAgentClassName(agent)}
          onClick={() => handleAgentClick(agent.agentId)}
          title={agent.description}
        >
          <div className="flex items-center space-x-3">
            <div className={getIconClassName(agent)}>
              {agent.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {agent.name}
              </div>
              
              {agent.status === 'relevant' && (
                <div className="text-xs text-orange-600 mt-1">
                  {agent.relevance}% relevant
                  {agent.lastTriggerWords.length > 0 && (
                    <div className="text-xs text-orange-500 mt-1">
                      "{agent.lastTriggerWords[0]}"
                    </div>
                  )}
                </div>
              )}
              
              {agent.status === 'active' && (
                <div className="text-xs text-blue-200 mt-1">
                  Currently active
                </div>
              )}
            </div>
            
            {/* Relevance indicator */}
            {agent.status === 'relevant' && (
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
            )}
            
            {agent.status === 'active' && (
              <div className="w-2 h-2 bg-blue-300 rounded-full" />
            )}
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute left-full ml-2 top-0 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
            {agent.description}
            {agent.status === 'relevant' && (
              <div className="mt-1 text-orange-300">
                Click to request handover
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>Active agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping" />
            <span>Relevant (click to switch)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span>Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}