export const SKILL_CATEGORIES = {
  Technical: {
    color: 'blue',
    bgColor: 'bg-blue-600',
    borderColor: 'border-blue-600',
    textColor: 'text-blue-600',
    examples: ['JavaScript', 'Python', 'React', 'AWS', 'Docker', 'Machine Learning']
  },
  Business: {
    color: 'green',
    bgColor: 'bg-green-600',
    borderColor: 'border-green-600',
    textColor: 'text-green-600',
    examples: ['Strategy', 'Marketing', 'Sales', 'Finance', 'Analytics', 'Product Management']
  },
  Creative: {
    color: 'purple',
    bgColor: 'bg-purple-600',
    borderColor: 'border-purple-600',
    textColor: 'text-purple-600',
    examples: ['Design', 'Writing', 'Video Production', 'Photography', 'Illustration', 'UX/UI']
  },
  Leadership: {
    color: 'orange',
    bgColor: 'bg-orange-600',
    borderColor: 'border-orange-600',
    textColor: 'text-orange-600',
    examples: ['Team Management', 'Mentoring', 'Strategic Planning', 'Communication', 'Conflict Resolution']
  }
} as const;

export type SkillCategory = keyof typeof SKILL_CATEGORIES;

export interface SkillWithMetadata {
  id?: string;
  name: string;
  category: SkillCategory;
  endorsements?: number;
  lastUsed?: string; // Experience ID where last used
  yearsOfExperience?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Language {
  id?: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Professional' | 'Conversational' | 'Basic';
  certified?: boolean;
  certificationName?: string;
}

// Common skills database for autocomplete
export const COMMON_SKILLS: Record<SkillCategory, string[]> = {
  Technical: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
    'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'GraphQL',
    'Machine Learning', 'Data Science', 'AI/ML', 'TensorFlow', 'PyTorch',
    'DevOps', 'CI/CD', 'Git', 'Linux', 'Security', 'Blockchain'
  ],
  Business: [
    'Product Management', 'Project Management', 'Strategy', 'Business Development',
    'Marketing', 'Digital Marketing', 'SEO/SEM', 'Content Marketing',
    'Sales', 'B2B Sales', 'Enterprise Sales', 'Account Management',
    'Finance', 'Financial Analysis', 'Budgeting', 'Forecasting',
    'Analytics', 'Data Analysis', 'Business Intelligence', 'SQL',
    'Operations', 'Supply Chain', 'Logistics', 'Process Improvement'
  ],
  Creative: [
    'Graphic Design', 'UI/UX Design', 'Product Design', 'Web Design',
    'Photography', 'Video Production', 'Motion Graphics', '3D Modeling',
    'Content Writing', 'Copywriting', 'Technical Writing', 'Blogging',
    'Brand Strategy', 'Creative Direction', 'Art Direction',
    'Illustration', 'Animation', 'Game Design', 'Sound Design'
  ],
  Leadership: [
    'Team Leadership', 'People Management', 'Executive Leadership',
    'Strategic Planning', 'Change Management', 'Organizational Development',
    'Communication', 'Public Speaking', 'Presentation Skills',
    'Mentoring', 'Coaching', 'Training & Development',
    'Conflict Resolution', 'Negotiation', 'Decision Making',
    'Cross-functional Collaboration', 'Stakeholder Management'
  ]
};

// Common languages for autocomplete
export const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean',
  'Arabic', 'Hindi', 'Russian', 'Dutch', 'Swedish', 'Polish',
  'Turkish', 'Hebrew', 'Greek', 'Norwegian', 'Danish', 'Finnish'
];