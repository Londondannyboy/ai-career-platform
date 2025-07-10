export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  completedDate?: string;
  linkedGoalId?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
  blockers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'milestone' | 'habit' | 'project' | 'learning';
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  linkedOKRId?: string; // Links to OKR objective
  linkedKeyResultId?: string; // Links to specific key result
  targetDate?: string;
  completedDate?: string;
  progress: number; // 0-100
  tasks: Task[];
  successCriteria?: string[];
  learnings?: string[];
  visibility: 'private' | 'coach' | 'mentor' | 'accountability' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  tasks: string[]; // Task IDs for the day
  reflection?: {
    accomplishments: string[];
    challenges: string[];
    tomorrowPriorities: string[];
    energyLevel: 1 | 2 | 3 | 4 | 5;
    focusRating: 1 | 2 | 3 | 4 | 5;
  };
  createdAt: string;
  updatedAt: string;
}

// Goal Templates
export const GOAL_TEMPLATES = {
  'Career Milestone': [
    {
      title: 'Complete [Certification Name] certification',
      type: 'milestone',
      description: 'Achieve professional certification to advance career',
      successCriteria: [
        'Pass certification exam with score >= 80%',
        'Complete all required coursework',
        'Build portfolio project demonstrating skills'
      ],
      estimatedWeeks: 12
    },
    {
      title: 'Land [Target Role] position',
      type: 'milestone',
      description: 'Secure new role aligned with career aspirations',
      successCriteria: [
        'Update resume and portfolio',
        'Complete 20+ targeted applications',
        'Network with 10+ professionals in target field',
        'Receive and accept offer'
      ],
      estimatedWeeks: 16
    }
  ],
  'Skill Building': [
    {
      title: 'Master [Technology/Skill]',
      type: 'learning',
      description: 'Develop expertise in new technology or skill area',
      successCriteria: [
        'Complete comprehensive course or bootcamp',
        'Build 3+ projects using the technology',
        'Contribute to open source or write tutorials',
        'Use in production environment'
      ],
      estimatedWeeks: 8
    }
  ],
  'Habit Formation': [
    {
      title: 'Daily learning habit',
      type: 'habit',
      description: 'Establish consistent daily learning routine',
      successCriteria: [
        '30+ minutes of focused learning daily',
        'Track progress for 30 consecutive days',
        'Complete at least one course/book per month'
      ],
      estimatedWeeks: 4
    },
    {
      title: 'Professional networking habit',
      type: 'habit',
      description: 'Build and maintain professional relationships',
      successCriteria: [
        'Reach out to 2 new connections weekly',
        'Attend 1 professional event monthly',
        'Share insights/content weekly'
      ],
      estimatedWeeks: 12
    }
  ],
  'Project Delivery': [
    {
      title: 'Launch [Project Name]',
      type: 'project',
      description: 'Complete and launch significant project',
      successCriteria: [
        'Define clear project requirements',
        'Complete development/implementation',
        'Test thoroughly and fix issues',
        'Deploy to production',
        'Gather user feedback'
      ],
      estimatedWeeks: 8
    }
  ]
};

// Helper functions
export function calculateGoalProgress(goal: Goal): number {
  if (goal.tasks.length === 0) return 0;
  
  const completedTasks = goal.tasks.filter(t => t.status === 'done').length;
  return Math.round((completedTasks / goal.tasks.length) * 100);
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(task => 
    task.dueDate && 
    task.dueDate < today && 
    task.status !== 'done'
  );
}

export function getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
  return tasks.filter(task => 
    task.dueDate && 
    task.dueDate >= today.toISOString().split('T')[0] &&
    task.dueDate <= futureDateStr &&
    task.status !== 'done'
  ).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
}

export function suggestTasksFromGoal(goal: Goal): Partial<Task>[] {
  const suggestions: Partial<Task>[] = [];
  const goalLower = goal.title.toLowerCase();
  
  if (goal.type === 'learning' || goalLower.includes('learn') || goalLower.includes('master')) {
    suggestions.push(
      { title: 'Research learning resources and create study plan', priority: 'high' },
      { title: 'Complete foundational tutorials/courses', priority: 'high' },
      { title: 'Build practice project #1', priority: 'medium' },
      { title: 'Join community/forum for the topic', priority: 'low' },
      { title: 'Document learnings and create notes', priority: 'medium' }
    );
  }
  
  if (goal.type === 'milestone' || goalLower.includes('certification') || goalLower.includes('cert')) {
    suggestions.push(
      { title: 'Review certification requirements and register', priority: 'high' },
      { title: 'Create study schedule and gather materials', priority: 'high' },
      { title: 'Complete practice exams', priority: 'medium' },
      { title: 'Review weak areas identified in practice', priority: 'high' },
      { title: 'Schedule and take the exam', priority: 'urgent' }
    );
  }
  
  if (goal.type === 'project' || goalLower.includes('build') || goalLower.includes('launch')) {
    suggestions.push(
      { title: 'Define project requirements and scope', priority: 'high' },
      { title: 'Create technical design/architecture', priority: 'high' },
      { title: 'Set up development environment', priority: 'medium' },
      { title: 'Implement core features', priority: 'high' },
      { title: 'Test and debug', priority: 'high' },
      { title: 'Deploy and monitor', priority: 'medium' }
    );
  }
  
  if (goal.type === 'habit') {
    suggestions.push(
      { title: 'Set up tracking system/tools', priority: 'high' },
      { title: 'Define daily/weekly targets', priority: 'high' },
      { title: 'Create accountability check-ins', priority: 'medium' },
      { title: 'Review and adjust approach weekly', priority: 'low' }
    );
  }
  
  return suggestions;
}

export function getDailyTaskLoad(tasks: Task[], date: string): Task[] {
  return tasks.filter(task => 
    task.status !== 'done' && 
    (!task.dueDate || task.dueDate === date)
  );
}

export function prioritizeTasks(tasks: Task[]): Task[] {
  const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
  
  return [...tasks].sort((a, b) => {
    // First sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    // Finally by creation date
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function getTaskStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const overdue = getOverdueTasks(tasks).length;
  
  const byPriority = {
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    high: tasks.filter(t => t.priority === 'high' && t.status !== 'done').length,
    medium: tasks.filter(t => t.priority === 'medium' && t.status !== 'done').length,
    low: tasks.filter(t => t.priority === 'low' && t.status !== 'done').length
  };
  
  return {
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    inProgress,
    blocked,
    overdue,
    byPriority
  };
}