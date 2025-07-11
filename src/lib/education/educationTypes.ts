/**
 * Rich Education Data Types
 * Moving beyond simple strings to capture what people actually learned
 */

export interface Education {
  id?: string;
  institution: string;
  institutionId?: string; // For future linking/normalization
  degree: string; // BA, BS, MS, PhD, Certificate, Bootcamp, etc.
  field: string; // Computer Science, PPE, Business Administration, etc.
  specialization?: string; // AI/ML, Economic Policy, Finance, etc.
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM, null if ongoing
  current: boolean;
  achievements?: string[]; // Dean's List, First Class Honours, etc.
  coursework?: string[]; // Key courses that matter
  skillsGained?: string[]; // Skills acquired during education
  thesis?: string; // Thesis or final project title
  gpa?: number; // Optional GPA
  activities?: string[]; // Clubs, societies, leadership roles
}

export interface EducationNormalized {
  canonical: string;
  institutionId: string;
  aliases: string[];
  type: 'university' | 'college' | 'bootcamp' | 'online' | 'certification';
  location?: string;
  ranking?: number; // For future features
  specialties?: string[]; // What the institution is known for
}

// Common degree types
export const DEGREE_TYPES = {
  // Undergraduate
  'BA': 'Bachelor of Arts',
  'BS': 'Bachelor of Science',
  'BEng': 'Bachelor of Engineering',
  'BBA': 'Bachelor of Business Administration',
  'BSc': 'Bachelor of Science',
  
  // Graduate
  'MA': 'Master of Arts',
  'MS': 'Master of Science',
  'MSc': 'Master of Science',
  'MBA': 'Master of Business Administration',
  'MEng': 'Master of Engineering',
  'MPhil': 'Master of Philosophy',
  
  // Doctoral
  'PhD': 'Doctor of Philosophy',
  'MD': 'Doctor of Medicine',
  'JD': 'Juris Doctor',
  
  // Other
  'Certificate': 'Certificate Program',
  'Bootcamp': 'Bootcamp',
  'Diploma': 'Diploma',
  'Associate': 'Associate Degree',
  'Professional': 'Professional Certification'
};

// Field of study categories
export const FIELD_CATEGORIES = {
  'STEM': [
    'Computer Science',
    'Software Engineering',
    'Data Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering'
  ],
  'Business': [
    'Business Administration',
    'Finance',
    'Marketing',
    'Accounting',
    'Management',
    'Entrepreneurship',
    'Economics'
  ],
  'Liberal Arts': [
    'Philosophy',
    'History',
    'Literature',
    'Political Science',
    'Psychology',
    'Sociology',
    'PPE'
  ],
  'Arts & Design': [
    'Fine Arts',
    'Graphic Design',
    'UI/UX Design',
    'Architecture',
    'Film',
    'Music'
  ],
  'Health & Medicine': [
    'Medicine',
    'Nursing',
    'Public Health',
    'Pharmacy',
    'Dentistry'
  ],
  'Law': [
    'Law',
    'Legal Studies',
    'Criminal Justice'
  ]
};

// Sample education enrichment
export const EDUCATION_ENRICHMENTS: Record<string, { skills: string[], description: string }> = {
  'Computer Science': {
    skills: ['Programming', 'Algorithms', 'Data Structures', 'Software Design', 'Problem Solving'],
    description: 'Systematic study of computation, algorithms, and information processing'
  },
  'PPE': {
    skills: ['Critical Thinking', 'Policy Analysis', 'Economic Modeling', 'Political Theory', 'Ethics'],
    description: 'Philosophy, Politics, and Economics - interdisciplinary study of society and governance'
  },
  'MBA': {
    skills: ['Leadership', 'Strategic Planning', 'Financial Analysis', 'Operations', 'Marketing Strategy'],
    description: 'Advanced business management and leadership training'
  },
  'Data Science': {
    skills: ['Machine Learning', 'Statistics', 'Data Analysis', 'Python', 'Data Visualization'],
    description: 'Interdisciplinary field using scientific methods to extract insights from data'
  }
};