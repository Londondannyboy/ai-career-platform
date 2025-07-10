'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, Plus, X, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, ChevronDown, ChevronUp, Lightbulb, Calendar,
  BarChart3, Users, Lock, Globe, Eye
} from 'lucide-react';
import { 
  ProfessionalOKR, 
  KeyResult,
  calculateOKRProgress,
  getKeyResultStatus,
  getOKRStatus,
  suggestKeyResults,
  getCurrentQuarter,
  formatOKRPeriod,
  OKR_TEMPLATES
} from '@/lib/repo/okrService';

interface OKREditorProps {
  okrs: ProfessionalOKR[];
  onChange: (okrs: ProfessionalOKR[]) => void;
  linkedAspirations?: { id: string; title: string }[]; // Future roles from work experience
}

export const OKREditor: React.FC<OKREditorProps> = ({
  okrs,
  onChange,
  linkedAspirations = []
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const currentQuarter = getCurrentQuarter();

  const createOKR = (template?: any): ProfessionalOKR => {
    const now = new Date().toISOString();
    const newOKR: ProfessionalOKR = {
      id: Date.now().toString(),
      objective: template?.objective || '',
      timeframe: currentQuarter.quarter,
      year: currentQuarter.year,
      keyResults: template?.keyResults?.map((kr: any) => ({
        id: Date.now().toString() + Math.random(),
        description: kr.description || '',
        targetValue: kr.targetValue || 0,
        currentValue: 0,
        unit: kr.unit || 'count',
        status: 'not-started',
        lastUpdated: now
      })) || [],
      category: 'career',
      visibility: 'private',
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };
    
    return newOKR;
  };

  const addOKR = (template?: any) => {
    const newOKR = createOKR(template);
    onChange([...okrs, newOKR]);
    setExpandedIds(new Set([...expandedIds, newOKR.id]));
  };

  const updateOKR = (id: string, updates: Partial<ProfessionalOKR>) => {
    onChange(okrs.map(okr => 
      okr.id === id 
        ? { ...okr, ...updates, updatedAt: new Date().toISOString() }
        : okr
    ));
  };

  const removeOKR = (id: string) => {
    onChange(okrs.filter(okr => okr.id !== id));
    const newExpanded = new Set(expandedIds);
    newExpanded.delete(id);
    setExpandedIds(newExpanded);
  };

  const addKeyResult = (okrId: string) => {
    const okr = okrs.find(o => o.id === okrId);
    if (okr && okr.keyResults.length < 5) {
      const newKR: KeyResult = {
        id: Date.now().toString(),
        description: '',
        targetValue: 100,
        currentValue: 0,
        unit: 'percentage',
        status: 'not-started',
        lastUpdated: new Date().toISOString()
      };
      updateOKR(okrId, {
        keyResults: [...okr.keyResults, newKR]
      });
    }
  };

  const updateKeyResult = (okrId: string, krId: string, updates: Partial<KeyResult>) => {
    const okr = okrs.find(o => o.id === okrId);
    if (okr) {
      const updatedKRs = okr.keyResults.map(kr =>
        kr.id === krId 
          ? { ...kr, ...updates, lastUpdated: new Date().toISOString() }
          : kr
      );
      updateOKR(okrId, { keyResults: updatedKRs });
    }
  };

  const removeKeyResult = (okrId: string, krId: string) => {
    const okr = okrs.find(o => o.id === okrId);
    if (okr) {
      updateOKR(okrId, {
        keyResults: okr.keyResults.filter(kr => kr.id !== krId)
      });
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'on-track':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'at-risk':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'missed':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getVisibilityIcon = (visibility: ProfessionalOKR['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'accountability':
        return <Users className="w-4 h-4" />;
      case 'mentor':
      case 'coach':
        return <Eye className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const suggestKRs = (okrId: string) => {
    const okr = okrs.find(o => o.id === okrId);
    if (okr) {
      const suggestions = suggestKeyResults(okr.objective);
      suggestions.forEach(suggestion => {
        if (okr.keyResults.length < 5) {
          addKeyResult(okrId);
          const newKR = okr.keyResults[okr.keyResults.length - 1];
          if (newKR) {
            updateKeyResult(okrId, newKR.id, {
              description: suggestion.description || '',
              unit: suggestion.unit || 'count'
            });
          }
        }
      });
    }
  };

  // Filter OKRs
  const filteredOKRs = okrs.filter(okr => {
    if (filter === 'active') return okr.status === 'active' || okr.status === 'draft';
    if (filter === 'completed') return okr.status === 'completed' || okr.status === 'archived';
    return true;
  });

  // Sort OKRs by status and date
  const sortedOKRs = [...filteredOKRs].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            OKRs - Objectives & Key Results
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Set quarterly goals and track your progress
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-700 px-3 py-1 rounded text-sm"
          >
            <option value="all">All OKRs</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600 flex items-center gap-1"
          >
            <Lightbulb className="w-4 h-4" />
            Templates
          </button>
          
          <button
            onClick={() => addOKR()}
            className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New OKR
          </button>
        </div>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">OKR Templates</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(OKR_TEMPLATES).map(([category, templates]) => (
              <div key={category}>
                <h5 className="text-sm font-medium text-gray-400 mb-2">{category}</h5>
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      addOKR(template);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded mb-2 text-sm"
                  >
                    <div className="font-medium mb-1 line-clamp-2">{template.objective}</div>
                    <div className="text-xs text-gray-400">
                      {template.keyResults.length} key results
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OKRs List */}
      <div className="space-y-4">
        {sortedOKRs.map((okr) => {
          const isExpanded = expandedIds.has(okr.id);
          const progress = calculateOKRProgress(okr);
          const status = getOKRStatus(okr);
          
          return (
            <div
              key={okr.id}
              className={`bg-gray-800 rounded-lg border-2 ${
                okr.status === 'active' 
                  ? 'border-blue-600' 
                  : okr.status === 'completed'
                    ? 'border-green-600'
                    : 'border-gray-700'
              }`}
            >
              {/* OKR Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        okr.status === 'active' 
                          ? 'bg-blue-900 text-blue-200'
                          : okr.status === 'completed'
                            ? 'bg-green-900 text-green-200'
                            : okr.status === 'draft'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-700 text-gray-400'
                      }`}>
                        {okr.status}
                      </span>
                      
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatOKRPeriod(okr.timeframe, okr.year)}
                      </span>
                      
                      {okr.category && (
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {okr.category}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 text-gray-400">
                        {getVisibilityIcon(okr.visibility)}
                        <span className="text-xs">{okr.visibility}</span>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={okr.objective}
                      onChange={(e) => updateOKR(okr.id, { objective: e.target.value })}
                      placeholder="Enter your objective..."
                      className="w-full bg-transparent text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 -ml-2"
                    />
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">Overall Progress</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium">{progress}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            status === 'achieved' 
                              ? 'bg-green-500'
                              : status === 'on-track'
                                ? 'bg-blue-500'
                                : status === 'at-risk'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(okr.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeOKR(okr.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-700">
                  {/* Settings */}
                  <div className="pt-4 grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Timeframe</label>
                      <select
                        value={okr.timeframe}
                        onChange={(e) => updateOKR(okr.id, { 
                          timeframe: e.target.value as ProfessionalOKR['timeframe'] 
                        })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                        <option value="Annual">Annual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Year</label>
                      <input
                        type="number"
                        value={okr.year}
                        onChange={(e) => updateOKR(okr.id, { year: parseInt(e.target.value) })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                        min="2024"
                        max="2030"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Visibility</label>
                      <select
                        value={okr.visibility}
                        onChange={(e) => updateOKR(okr.id, { 
                          visibility: e.target.value as ProfessionalOKR['visibility'] 
                        })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      >
                        <option value="private">Private</option>
                        <option value="coach">Share with Coach</option>
                        <option value="mentor">Share with Mentor</option>
                        <option value="accountability">Accountability Group</option>
                        <option value="public">Public</option>
                      </select>
                    </div>
                  </div>

                  {/* Linked Aspiration */}
                  {linkedAspirations.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Linked to Future Role/Goal
                      </label>
                      <select
                        value={okr.linkedToAspiration || ''}
                        onChange={(e) => updateOKR(okr.id, { linkedToAspiration: e.target.value })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      >
                        <option value="">Not linked</option>
                        {linkedAspirations.map(asp => (
                          <option key={asp.id} value={asp.id}>{asp.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Key Results */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">
                        Key Results ({okr.keyResults.length}/5)
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => suggestKRs(okr.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3" />
                          Suggest KRs
                        </button>
                        <button
                          onClick={() => addKeyResult(okr.id)}
                          disabled={okr.keyResults.length >= 5}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                          Add KR
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {okr.keyResults.map((kr, index) => {
                        const krStatus = getKeyResultStatus(kr);
                        const krProgress = kr.targetValue > 0 
                          ? Math.min((kr.currentValue / kr.targetValue) * 100, 100)
                          : 0;
                        
                        return (
                          <div key={kr.id} className="bg-gray-700 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <span className="text-sm font-medium text-gray-400 mt-1">
                                {index + 1}.
                              </span>
                              
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={kr.description}
                                  onChange={(e) => updateKeyResult(okr.id, kr.id, { 
                                    description: e.target.value 
                                  })}
                                  placeholder="Describe the key result..."
                                  className="w-full bg-transparent focus:outline-none text-sm"
                                />
                                
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={kr.currentValue}
                                      onChange={(e) => updateKeyResult(okr.id, kr.id, { 
                                        currentValue: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-20 bg-gray-600 px-2 py-1 rounded text-sm"
                                    />
                                    <span className="text-sm text-gray-400">/</span>
                                    <input
                                      type="number"
                                      value={kr.targetValue}
                                      onChange={(e) => updateKeyResult(okr.id, kr.id, { 
                                        targetValue: parseFloat(e.target.value) || 0
                                      })}
                                      className="w-20 bg-gray-600 px-2 py-1 rounded text-sm"
                                    />
                                    <select
                                      value={kr.unit}
                                      onChange={(e) => updateKeyResult(okr.id, kr.id, { 
                                        unit: e.target.value as KeyResult['unit'] 
                                      })}
                                      className="bg-gray-600 px-2 py-1 rounded text-sm"
                                    >
                                      <option value="percentage">%</option>
                                      <option value="count">#</option>
                                      <option value="currency">$</option>
                                      <option value="boolean">✓</option>
                                    </select>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-400">{krProgress}%</span>
                                      {getStatusIcon(krStatus)}
                                    </div>
                                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          krStatus === 'achieved' 
                                            ? 'bg-green-500'
                                            : krStatus === 'on-track'
                                              ? 'bg-blue-500'
                                              : krStatus === 'at-risk'
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-500'
                                        }`}
                                        style={{ width: `${krProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Notes */}
                                <input
                                  type="text"
                                  value={kr.notes || ''}
                                  onChange={(e) => updateKeyResult(okr.id, kr.id, { 
                                    notes: e.target.value 
                                  })}
                                  placeholder="Add notes..."
                                  className="w-full bg-gray-600 px-2 py-1 rounded text-xs"
                                />
                              </div>
                              
                              <button
                                onClick={() => removeKeyResult(okr.id, kr.id)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {okr.keyResults.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No key results yet. Add 3-5 measurable results.
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 pt-2">
                    {okr.status === 'draft' && (
                      <button
                        onClick={() => updateOKR(okr.id, { status: 'active' })}
                        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                      >
                        Activate OKR
                      </button>
                    )}
                    {okr.status === 'active' && (
                      <button
                        onClick={() => updateOKR(okr.id, { 
                          status: 'completed',
                          completedAt: new Date().toISOString()
                        })}
                        className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedOKRs.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 mb-1">No OKRs yet</p>
            <p className="text-sm text-gray-500">
              Start setting objectives to track your professional growth
            </p>
          </div>
        )}
      </div>
    </div>
  );
};