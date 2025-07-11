/**
 * Rich Experience Data Types
 * Captures impact, team dynamics, and actual achievements
 */

export interface Experience {
  id?: string;
  title: string;
  company: string;
  companyId?: string; // For future company pages
  location?: string;
  locationType?: 'onsite' | 'remote' | 'hybrid';
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  current: boolean;
  type?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  
  // Rich description with impact
  description: string;
  impact?: ImpactMetric[];
  
  // Team and reporting
  teamSize?: number;
  directReports?: number;
  reportingTo?: string; // e.g., "CTO", "VP Engineering"
  
  // Technologies and methodologies
  technologies?: string[];
  methodologies?: string[]; // Agile, Scrum, Kanban, etc.
  
  // Skills utilized and developed
  skillsUsed?: string[];
  skillsDeveloped?: string[];
  
  // Achievements and recognition
  achievements?: Achievement[];
  
  // For future experiences
  isFuture?: boolean;
  targetDate?: string;
  requirements?: string[]; // What's needed to get there
}

export interface ImpactMetric {
  description: string;
  metric: string; // "47%", "$2M", "3x", etc.
  category: 'revenue' | 'cost' | 'efficiency' | 'quality' | 'scale' | 'team' | 'other';
}

export interface Achievement {
  title: string;
  description: string;
  date?: string;
  recognition?: 'company' | 'industry' | 'peer';
}

// Common job titles with seniority levels
export const JOB_LEVELS = {
  'Engineering': [
    'Intern',
    'Junior Engineer',
    'Engineer',
    'Senior Engineer',
    'Staff Engineer',
    'Principal Engineer',
    'Distinguished Engineer',
    'Engineering Manager',
    'Director of Engineering',
    'VP Engineering',
    'CTO'
  ],
  'Product': [
    'Product Intern',
    'Associate Product Manager',
    'Product Manager',
    'Senior Product Manager',
    'Principal Product Manager',
    'Group Product Manager',
    'Director of Product',
    'VP Product',
    'CPO'
  ],
  'Design': [
    'Design Intern',
    'Junior Designer',
    'Designer',
    'Senior Designer',
    'Lead Designer',
    'Principal Designer',
    'Design Manager',
    'Director of Design',
    'VP Design'
  ],
  'Business': [
    'Business Analyst',
    'Senior Analyst',
    'Manager',
    'Senior Manager',
    'Director',
    'Senior Director',
    'VP',
    'SVP',
    'EVP',
    'CEO'
  ]
};

// Common methodologies
export const METHODOLOGIES = [
  'Agile',
  'Scrum',
  'Kanban',
  'Waterfall',
  'Lean',
  'Six Sigma',
  'DevOps',
  'CI/CD',
  'Test-Driven Development',
  'Pair Programming',
  'Design Thinking'
];

// Impact metric templates
export const IMPACT_TEMPLATES = {
  'revenue': [
    'Increased revenue by {X}%',
    'Generated ${X} in new revenue',
    'Grew user base by {X}%',
    'Improved conversion rate by {X}%'
  ],
  'cost': [
    'Reduced costs by {X}%',
    'Saved ${X} annually',
    'Cut infrastructure costs by {X}%',
    'Decreased time to market by {X}%'
  ],
  'efficiency': [
    'Improved performance by {X}%',
    'Reduced load time by {X}%',
    'Increased productivity by {X}%',
    'Automated {X} hours of manual work'
  ],
  'quality': [
    'Reduced bugs by {X}%',
    'Improved customer satisfaction by {X}%',
    'Achieved {X}% test coverage',
    'Reduced error rate by {X}%'
  ],
  'scale': [
    'Scaled to {X} users',
    'Handled {X} requests per second',
    'Grew team from {X} to {Y}',
    'Expanded to {X} new markets'
  ],
  'team': [
    'Mentored {X} engineers',
    'Built team of {X} people',
    'Improved team velocity by {X}%',
    'Reduced turnover by {X}%'
  ]
};

// Company size categories
export const COMPANY_SIZES = {
  'startup': '1-50 employees',
  'small': '51-200 employees',
  'medium': '201-1000 employees',
  'large': '1001-5000 employees',
  'enterprise': '5000+ employees'
};

// Helper function to analyze experience level
export function getExperienceLevel(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('intern') || lowerTitle.includes('junior')) return 'Entry Level';
  if (lowerTitle.includes('senior') || lowerTitle.includes('lead')) return 'Senior';
  if (lowerTitle.includes('staff') || lowerTitle.includes('principal')) return 'Staff+';
  if (lowerTitle.includes('manager') || lowerTitle.includes('director')) return 'Management';
  if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 'Executive';
  if (lowerTitle.includes('cto') || lowerTitle.includes('ceo') || lowerTitle.includes('cpo')) return 'C-Level';
  
  return 'Mid Level';
}