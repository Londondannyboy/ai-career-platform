'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, CheckSquare, Calendar, AlertCircle, Plus, X, 
  ChevronDown, ChevronUp, Clock, Flag, Lightbulb, 
  BarChart3, Link2, Filter, Archive, Play, Pause
} from 'lucide-react';
import {
  Goal, Task, DailyPlan,
  calculateGoalProgress, getOverdueTasks, getUpcomingTasks,
  suggestTasksFromGoal, prioritizeTasks, getTaskStats,
  GOAL_TEMPLATES
} from '@/lib/repo/goalService';

interface GoalsTasksEditorProps {
  goals: Goal[];
  dailyPlans: DailyPlan[];
  linkedOKRs?: { id: string; objective: string; keyResults: { id: string; description: string }[] }[];
  onChange: (goals: Goal[], dailyPlans: DailyPlan[]) => void;
}

export const GoalsTasksEditor: React.FC<GoalsTasksEditorProps> = ({
  goals,
  dailyPlans,
  linkedOKRs = [],
  onChange
}) => {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showTemplates, setShowTemplates] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDailyView, setShowDailyView] = useState(false);

  // Get all tasks from all goals
  const allTasks = goals.flatMap(g => g.tasks);
  const taskStats = getTaskStats(allTasks);
  const overdueTasks = getOverdueTasks(allTasks);
  const upcomingTasks = getUpcomingTasks(allTasks);

  const createGoal = (template?: any): Goal => {
    const now = new Date().toISOString();
    return {
      id: Date.now().toString(),
      title: template?.title || '',
      description: template?.description || '',
      type: template?.type || 'project',
      status: 'planning',
      progress: 0,
      tasks: [],
      successCriteria: template?.successCriteria || [],
      visibility: 'private',
      createdAt: now,
      updatedAt: now
    };
  };

  const createTask = (goalId: string, template?: Partial<Task>): Task => {
    const now = new Date().toISOString();
    return {
      id: Date.now().toString() + Math.random(),
      title: template?.title || '',
      description: template?.description,
      status: 'todo',
      priority: template?.priority || 'medium',
      linkedGoalId: goalId,
      createdAt: now,
      updatedAt: now,
      ...template
    };
  };

  const addGoal = (template?: any) => {
    const newGoal = createGoal(template);
    onChange([...goals, newGoal], dailyPlans);
    setExpandedGoals(new Set([...expandedGoals, newGoal.id]));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id 
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    );
    
    // Recalculate progress if tasks were updated
    if (updates.tasks) {
      const goal = updatedGoals.find(g => g.id === id);
      if (goal) {
        goal.progress = calculateGoalProgress(goal);
      }
    }
    
    onChange(updatedGoals, dailyPlans);
  };

  const removeGoal = (id: string) => {
    onChange(goals.filter(g => g.id !== id), dailyPlans);
  };

  const addTask = (goalId: string, template?: Partial<Task>) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newTask = createTask(goalId, template);
      updateGoal(goalId, {
        tasks: [...goal.tasks, newTask]
      });
    }
  };

  const updateTask = (goalId: string, taskId: string, updates: Partial<Task>) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const updatedTasks = goal.tasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      updateGoal(goalId, { tasks: updatedTasks });
    }
  };

  const removeTask = (goalId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      updateGoal(goalId, {
        tasks: goal.tasks.filter(t => t.id !== taskId)
      });
    }
  };

  const suggestTasks = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const suggestions = suggestTasksFromGoal(goal);
      suggestions.forEach(suggestion => {
        addTask(goalId, suggestion);
      });
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGoals(newExpanded);
  };

  const getStatusIcon = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'active':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-900/20 border-red-700';
      case 'high': return 'text-orange-500 bg-orange-900/20 border-orange-700';
      case 'medium': return 'text-yellow-500 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-gray-500 bg-gray-900/20 border-gray-700';
    }
  };

  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done': return 'bg-green-900 text-green-200';
      case 'in-progress': return 'bg-blue-900 text-blue-200';
      case 'blocked': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return goal.status === 'active' || goal.status === 'planning';
    if (filter === 'completed') return goal.status === 'completed';
    return true;
  });

  // Get daily tasks
  const dailyTasks = allTasks.filter(task => {
    const plan = dailyPlans.find(p => p.date === selectedDate);
    return plan?.tasks.includes(task.id) || task.dueDate === selectedDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goals & Tasks
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Break down your OKRs into actionable goals and daily tasks
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowDailyView(!showDailyView)}
            className={`px-3 py-1 rounded text-sm ${
              showDailyView 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-700 hover:bg-gray-600'
            } flex items-center gap-1`}
          >
            <Calendar className="w-4 h-4" />
            Daily View
          </button>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-700 px-3 py-1 rounded text-sm"
          >
            <option value="all">All Goals</option>
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
            onClick={() => addGoal()}
            className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{taskStats.total}</div>
          <div className="text-xs text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{taskStats.completed}</div>
          <div className="text-xs text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{taskStats.inProgress}</div>
          <div className="text-xs text-gray-400">In Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{taskStats.overdue}</div>
          <div className="text-xs text-gray-400">Overdue</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{taskStats.completionRate}%</div>
          <div className="text-xs text-gray-400">Completion Rate</div>
        </div>
      </div>

      {/* Alerts */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h4 className="font-medium">Overdue Tasks ({overdueTasks.length})</h4>
          </div>
          <div className="space-y-1">
            {overdueTasks.slice(0, 3).map(task => {
              const goal = goals.find(g => g.tasks.some(t => t.id === task.id));
              return (
                <div key={task.id} className="text-sm flex justify-between">
                  <span>{task.title}</span>
                  <span className="text-gray-400">from {goal?.title}</span>
                </div>
              );
            })}
            {overdueTasks.length > 3 && (
              <div className="text-sm text-gray-400">...and {overdueTasks.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">Goal Templates</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(GOAL_TEMPLATES).map(([category, templates]) => (
              <div key={category}>
                <h5 className="text-sm font-medium text-gray-400 mb-2">{category}</h5>
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      addGoal(template);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded mb-2 text-sm"
                  >
                    <div className="font-medium mb-1">{template.title}</div>
                    <div className="text-xs text-gray-400">
                      {template.type} • {template.estimatedWeeks} weeks
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily View */}
      {showDailyView && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Tasks for {selectedDate}
            </h4>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 px-3 py-1 rounded text-sm"
            />
          </div>
          
          <div className="space-y-2">
            {prioritizeTasks(dailyTasks).map(task => {
              const goal = goals.find(g => g.tasks.some(t => t.id === task.id));
              return (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) => {
                      if (goal) {
                        updateTask(goal.id, task.id, {
                          status: e.target.checked ? 'done' : 'todo',
                          completedDate: e.target.checked ? new Date().toISOString() : undefined
                        });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm">{task.title}</div>
                    <div className="text-xs text-gray-400">{goal?.title}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              );
            })}
            
            {dailyTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks scheduled for this day
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const isExpanded = expandedGoals.has(goal.id);
          const progress = calculateGoalProgress(goal);
          const goalTasks = prioritizeTasks(goal.tasks);
          
          return (
            <div
              key={goal.id}
              className={`bg-gray-800 rounded-lg border-2 ${
                goal.status === 'active' 
                  ? 'border-blue-600' 
                  : goal.status === 'completed'
                    ? 'border-green-600'
                    : 'border-gray-700'
              }`}
            >
              {/* Goal Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(goal.status)}
                      
                      <span className={`text-xs px-2 py-1 rounded ${
                        goal.status === 'active' 
                          ? 'bg-blue-900 text-blue-200'
                          : goal.status === 'completed'
                            ? 'bg-green-900 text-green-200'
                            : 'bg-gray-700 text-gray-300'
                      }`}>
                        {goal.status}
                      </span>
                      
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {goal.type}
                      </span>
                      
                      {goal.linkedOKRId && (
                        <span className="text-xs text-blue-400 flex items-center gap-1">
                          <Link2 className="w-3 h-3" />
                          Linked to OKR
                        </span>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={goal.title}
                      onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
                      placeholder="Enter goal title..."
                      className="w-full bg-transparent text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 -ml-2"
                    />
                    
                    <textarea
                      value={goal.description}
                      onChange={(e) => updateGoal(goal.id, { description: e.target.value })}
                      placeholder="Describe your goal..."
                      className="w-full bg-transparent text-sm text-gray-400 focus:outline-none mt-1 resize-none"
                      rows={1}
                    />
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">
                          Progress ({goal.tasks.filter(t => t.status === 'done').length}/{goal.tasks.length} tasks)
                        </span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleExpanded(goal.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => removeGoal(goal.id)}
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
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select
                        value={goal.type}
                        onChange={(e) => updateGoal(goal.id, { type: e.target.value as Goal['type'] })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      >
                        <option value="milestone">Milestone</option>
                        <option value="habit">Habit</option>
                        <option value="project">Project</option>
                        <option value="learning">Learning</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={goal.targetDate || ''}
                        onChange={(e) => updateGoal(goal.id, { targetDate: e.target.value })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Linked OKR</label>
                      <select
                        value={goal.linkedOKRId || ''}
                        onChange={(e) => updateGoal(goal.id, { linkedOKRId: e.target.value })}
                        className="w-full bg-gray-700 px-3 py-2 rounded text-sm"
                      >
                        <option value="">Not linked</option>
                        {linkedOKRs.map(okr => (
                          <option key={okr.id} value={okr.id}>{okr.objective}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Success Criteria */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Success Criteria</label>
                    <div className="space-y-1">
                      {goal.successCriteria?.map((criteria, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={criteria}
                            onChange={(e) => {
                              const updated = [...(goal.successCriteria || [])];
                              updated[index] = e.target.value;
                              updateGoal(goal.id, { successCriteria: updated });
                            }}
                            className="flex-1 bg-gray-700 px-2 py-1 rounded text-sm"
                            placeholder="Define success criterion..."
                          />
                          <button
                            onClick={() => {
                              const updated = goal.successCriteria?.filter((_, i) => i !== index) || [];
                              updateGoal(goal.id, { successCriteria: updated });
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const updated = [...(goal.successCriteria || []), ''];
                          updateGoal(goal.id, { successCriteria: updated });
                        }}
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        + Add criterion
                      </button>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">Tasks</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => suggestTasks(goal.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Lightbulb className="w-3 h-3" />
                          Suggest Tasks
                        </button>
                        <button
                          onClick={() => addTask(goal.id)}
                          className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Task
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {goalTasks.map((task) => (
                        <div key={task.id} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={task.status === 'done'}
                              onChange={(e) => updateTask(goal.id, task.id, {
                                status: e.target.checked ? 'done' : 'todo',
                                completedDate: e.target.checked ? new Date().toISOString() : undefined
                              })}
                              className="mt-1"
                            />
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={task.title}
                                  onChange={(e) => updateTask(goal.id, task.id, { title: e.target.value })}
                                  placeholder="Task title..."
                                  className={`flex-1 bg-transparent focus:outline-none text-sm ${
                                    task.status === 'done' ? 'line-through text-gray-500' : ''
                                  }`}
                                />
                                
                                <select
                                  value={task.priority}
                                  onChange={(e) => updateTask(goal.id, task.id, { 
                                    priority: e.target.value as Task['priority'] 
                                  })}
                                  className={`text-xs px-2 py-1 rounded border bg-gray-800 ${getPriorityColor(task.priority)}`}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                                
                                <span className={`text-xs px-2 py-1 rounded ${getTaskStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs">
                                <input
                                  type="date"
                                  value={task.dueDate || ''}
                                  onChange={(e) => updateTask(goal.id, task.id, { dueDate: e.target.value })}
                                  className="bg-gray-600 px-2 py-1 rounded"
                                />
                                
                                <select
                                  value={task.status}
                                  onChange={(e) => updateTask(goal.id, task.id, { 
                                    status: e.target.value as Task['status'] 
                                  })}
                                  className="bg-gray-600 px-2 py-1 rounded"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="done">Done</option>
                                  <option value="blocked">Blocked</option>
                                </select>
                                
                                {task.estimatedHours && (
                                  <span className="text-gray-400">
                                    Est: {task.estimatedHours}h
                                  </span>
                                )}
                              </div>
                              
                              {task.blockers && task.blockers.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-red-400">
                                  <AlertCircle className="w-3 h-3" />
                                  {task.blockers.join(', ')}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => removeTask(goal.id, task.id)}
                              className="text-gray-400 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {goal.tasks.length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No tasks yet. Break down your goal into actionable steps.
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 pt-2">
                    {goal.status === 'planning' && (
                      <button
                        onClick={() => updateGoal(goal.id, { status: 'active' })}
                        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                      >
                        Start Goal
                      </button>
                    )}
                    {goal.status === 'active' && (
                      <>
                        <button
                          onClick={() => updateGoal(goal.id, { status: 'paused' })}
                          className="px-3 py-1 bg-yellow-600 rounded text-sm hover:bg-yellow-700"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => updateGoal(goal.id, { 
                            status: 'completed',
                            completedDate: new Date().toISOString()
                          })}
                          className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    {goal.status === 'paused' && (
                      <button
                        onClick={() => updateGoal(goal.id, { status: 'active' })}
                        className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-700"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 mb-1">No goals yet</p>
            <p className="text-sm text-gray-500">
              Break down your OKRs into actionable goals and tasks
            </p>
          </div>
        )}
      </div>
    </div>
  );
};