export interface CompanyProfile {
  id: string;
  name: string;
  normalizedName: string;
  canonicalIdentifier: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  founded?: number;
  headquarters?: {
    country?: string;
    city?: string;
    address?: string;
  };
  description?: string;
  mission?: string;
  values?: string[];
  culture?: {
    workStyle?: 'remote' | 'hybrid' | 'onsite';
    benefits?: string[];
    perks?: string[];
  };
  social?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  enrichmentData?: any;
  stats?: {
    employeeCount?: number;
    activeJobPostings?: number;
    questMembers?: number;
  };
  isVerified?: boolean;
  verifiedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyRepo {
  surface: {
    profile: CompanyProfile;
    jobPostings: JobPosting[];
    news: CompanyNews[];
    employees: CompanyEmployee[];
  };
  working: {
    projects: CompanyProject[];
    culture: CultureDetails;
    growth: GrowthMetrics;
  };
  personal: {
    internalNotes: string[];
    interviewExperiences: InterviewExperience[];
    employeeReviews: EmployeeReview[];
  };
  deep: {
    values: string[];
    mission: string;
    vision: string;
    impact: ImpactMetrics;
  };
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  postedDate: string;
  description: string;
  requirements: string[];
  niceToHave?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export interface CompanyNews {
  id: string;
  title: string;
  date: string;
  source: string;
  url: string;
  summary: string;
}

export interface CompanyEmployee {
  id: string;
  name: string;
  title: string;
  department: string;
  profileUrl?: string;
  isQuestMember?: boolean;
}

export interface CompanyProject {
  id: string;
  name: string;
  description: string;
  impact: string;
  technologies: string[];
  teamSize?: number;
}

export interface CultureDetails {
  workLifeBalance: number; // 1-5 rating
  diversity: number; // 1-5 rating
  innovation: number; // 1-5 rating
  collaboration: number; // 1-5 rating
  growth: number; // 1-5 rating
  description: string;
}

export interface GrowthMetrics {
  revenueGrowth?: number; // percentage
  employeeGrowth?: number; // percentage
  marketShare?: number; // percentage
  expansions?: string[];
}

export interface InterviewExperience {
  id: string;
  role: string;
  date: string;
  difficulty: number; // 1-5
  experience: 'positive' | 'neutral' | 'negative';
  process: string;
  questions?: string[];
  outcome?: 'offer' | 'rejected' | 'withdrawn';
}

export interface EmployeeReview {
  id: string;
  role: string;
  department: string;
  tenure: string;
  pros: string[];
  cons: string[];
  rating: number; // 1-5
  wouldRecommend: boolean;
  date: string;
}

export interface ImpactMetrics {
  environmental: string;
  social: string;
  governance: string;
  community: string[];
}