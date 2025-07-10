export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: 'percentage' | 'count' | 'currency' | 'boolean';
  status: 'not-started' | 'on-track' | 'at-risk' | 'achieved' | 'missed';
  lastUpdated?: string;
  notes?: string;
}

export interface ProfessionalOKR {
  id: string;
  objective: string;
  timeframe: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
  year: number;
  keyResults: KeyResult[];
  category?: 'career' | 'skill' | 'leadership' | 'impact' | 'personal';
  linkedToAspiration?: string; // Future role/goal connection
  visibility: 'private' | 'coach' | 'mentor' | 'accountability' | 'public';
  status: 'draft' | 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  reflection?: string; // End of period reflection
  nextSteps?: string; // What to do next based on results
}

export interface OKRCheckIn {
  id: string;
  okrId: string;
  date: string;
  keyResultUpdates: {
    keyResultId: string;
    previousValue: number;
    newValue: number;
    notes?: string;
  }[];
  overallNotes?: string;
  blockers?: string[];
  needsHelp?: boolean;
}

// Common OKR Templates
export const OKR_TEMPLATES = {
  'Career Growth': [
    {
      objective: 'Advance to [Role] by demonstrating leadership and technical excellence',
      keyResults: [
        { description: 'Lead X cross-functional projects', unit: 'count', targetValue: 3 },
        { description: 'Mentor X team members', unit: 'count', targetValue: 2 },
        { description: 'Complete advanced certification in [Area]', unit: 'boolean', targetValue: 1 },
        { description: 'Receive performance rating of X or higher', unit: 'percentage', targetValue: 90 }
      ]
    },
    {
      objective: 'Build expertise in [New Technology/Skill] to expand career opportunities',
      keyResults: [
        { description: 'Complete X hours of focused learning', unit: 'count', targetValue: 100 },
        { description: 'Build X production-ready projects', unit: 'count', targetValue: 3 },
        { description: 'Contribute to X open source projects', unit: 'count', targetValue: 2 },
        { description: 'Achieve certification score of X%', unit: 'percentage', targetValue: 85 }
      ]
    }
  ],
  'Leadership': [
    {
      objective: 'Develop strong leadership skills to prepare for management role',
      keyResults: [
        { description: 'Complete leadership training program', unit: 'boolean', targetValue: 1 },
        { description: 'Lead X team initiatives', unit: 'count', targetValue: 4 },
        { description: 'Improve team satisfaction score to X%', unit: 'percentage', targetValue: 85 },
        { description: 'Conduct X 1-on-1 mentoring sessions', unit: 'count', targetValue: 12 }
      ]
    }
  ],
  'Business Impact': [
    {
      objective: 'Drive significant business value through innovation and efficiency',
      keyResults: [
        { description: 'Increase revenue/efficiency metric by X%', unit: 'percentage', targetValue: 20 },
        { description: 'Launch X new features/products', unit: 'count', targetValue: 3 },
        { description: 'Reduce operational costs by $X', unit: 'currency', targetValue: 50000 },
        { description: 'Achieve customer satisfaction of X%', unit: 'percentage', targetValue: 90 }
      ]
    }
  ],
  'Skill Development': [
    {
      objective: 'Master [Skill Area] to become a recognized expert',
      keyResults: [
        { description: 'Complete X advanced courses', unit: 'count', targetValue: 3 },
        { description: 'Publish X articles/talks on the topic', unit: 'count', targetValue: 5 },
        { description: 'Answer X community questions', unit: 'count', targetValue: 50 },
        { description: 'Build portfolio of X projects', unit: 'count', targetValue: 4 }
      ]
    }
  ],
  'Network & Influence': [
    {
      objective: 'Build strong professional network and thought leadership',
      keyResults: [
        { description: 'Grow professional connections by X', unit: 'count', targetValue: 100 },
        { description: 'Speak at X industry events', unit: 'count', targetValue: 3 },
        { description: 'Achieve X social media followers', unit: 'count', targetValue: 1000 },
        { description: 'Get featured in X publications', unit: 'count', targetValue: 2 }
      ]
    }
  ]
};

// Helper functions
export function calculateOKRProgress(okr: ProfessionalOKR): number {
  if (okr.keyResults.length === 0) return 0;
  
  const totalProgress = okr.keyResults.reduce((sum, kr) => {
    const progress = kr.targetValue > 0 
      ? Math.min((kr.currentValue / kr.targetValue) * 100, 100)
      : 0;
    return sum + progress;
  }, 0);
  
  return Math.round(totalProgress / okr.keyResults.length);
}

export function getKeyResultStatus(kr: KeyResult): KeyResult['status'] {
  if (kr.currentValue === 0) return 'not-started';
  
  const progress = (kr.currentValue / kr.targetValue) * 100;
  const timeProgress = getTimeProgress(); // You'd calculate based on current date vs OKR timeframe
  
  if (progress >= 100) return 'achieved';
  if (progress >= timeProgress - 10) return 'on-track';
  if (progress >= timeProgress - 25) return 'at-risk';
  return 'missed';
}

export function getOKRStatus(okr: ProfessionalOKR): 'on-track' | 'at-risk' | 'achieved' | 'missed' {
  const progress = calculateOKRProgress(okr);
  const timeProgress = getTimeProgress();
  
  if (progress >= 100) return 'achieved';
  if (progress >= timeProgress - 10) return 'on-track';
  if (progress >= timeProgress - 25) return 'at-risk';
  return 'missed';
}

export function getTimeProgress(): number {
  // This is a simplified version - you'd calculate based on the actual OKR timeframe
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const monthInQuarter = now.getMonth() % 3;
  const dayInMonth = now.getDate();
  
  // Rough calculation of progress through the quarter
  const daysInQuarter = 90;
  const daysElapsed = monthInQuarter * 30 + dayInMonth;
  
  return Math.round((daysElapsed / daysInQuarter) * 100);
}

export function suggestKeyResults(objective: string): Partial<KeyResult>[] {
  const suggestions: Partial<KeyResult>[] = [];
  
  // Simple keyword-based suggestions
  const objectiveLower = objective.toLowerCase();
  
  if (objectiveLower.includes('learn') || objectiveLower.includes('skill')) {
    suggestions.push(
      { description: 'Complete courses or certifications', unit: 'count' },
      { description: 'Build practice projects', unit: 'count' },
      { description: 'Achieve proficiency score', unit: 'percentage' }
    );
  }
  
  if (objectiveLower.includes('lead') || objectiveLower.includes('manage')) {
    suggestions.push(
      { description: 'Lead team initiatives', unit: 'count' },
      { description: 'Improve team metrics', unit: 'percentage' },
      { description: 'Conduct 1-on-1 sessions', unit: 'count' }
    );
  }
  
  if (objectiveLower.includes('build') || objectiveLower.includes('create')) {
    suggestions.push(
      { description: 'Launch features or products', unit: 'count' },
      { description: 'Achieve user adoption', unit: 'percentage' },
      { description: 'Meet quality metrics', unit: 'percentage' }
    );
  }
  
  if (objectiveLower.includes('improve') || objectiveLower.includes('increase')) {
    suggestions.push(
      { description: 'Improve key metric by X%', unit: 'percentage' },
      { description: 'Reduce issues or errors', unit: 'count' },
      { description: 'Increase efficiency score', unit: 'percentage' }
    );
  }
  
  return suggestions;
}

export function getQuarterFromDate(date: Date): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const month = date.getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

export function getCurrentQuarter(): { quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'; year: number } {
  const now = new Date();
  return {
    quarter: getQuarterFromDate(now),
    year: now.getFullYear()
  };
}

export function formatOKRPeriod(timeframe: ProfessionalOKR['timeframe'], year: number): string {
  if (timeframe === 'Annual') {
    return `${year} Annual`;
  }
  return `${timeframe} ${year}`;
}