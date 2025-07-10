// Work Experience Types with Future Aspirations Support
// Part of Quest's Repo UI Sprint - Chunk 1

export interface CompanyReference {
  id?: string           // Optional - only for validated companies
  name: string          // Always present - display name
  location?: string     // For disambiguation (e.g., "San Francisco, CA")
  isValidated: boolean  // Whether this company has been verified
  validatedBy?: 'email' | 'enrichment' | 'manual' | 'community'
  linkedInUrl?: string  // For validated companies
  domain?: string       // Company domain for validation
}

export interface WorkExperienceBase {
  id: string
  title: string
  company: string | CompanyReference  // Support both legacy string and new object
  location?: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
  achievements: string[]
  skills: string[]
}

export interface WorkExperienceWithFuture extends WorkExperienceBase {
  isFuture: boolean
  targetDate?: string
  whyThisRole?: string
  requiredSteps?: string[]
  skillGaps?: string[]
  connections?: string[] // People who could help
  progress?: number // 0-100 percentage
}

export interface FutureAspiration {
  id: string
  targetRole: string
  targetCompany?: string
  targetIndustry?: string
  targetDate: string
  whyThisRole: string
  alignmentWithTrinity: {
    quest: string
    service: string
    pledge: string
  }
  requiredSteps: string[]
  skillGaps: string[]
  currentProgress: number
  milestones: Milestone[]
  connections: Connection[]
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  completed: boolean
  completedDate?: string
  relatedSkills: string[]
  evidence?: string[]
}

export interface Connection {
  id: string
  name: string
  role: string
  company: string
  relationship: 'mentor' | 'colleague' | 'target' | 'other'
  notes?: string
  linkedInUrl?: string
}

export interface SkillGap {
  skill: string
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
  requiredLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  priority: 'low' | 'medium' | 'high' | 'critical'
  learningResources: string[]
  estimatedTimeToAcquire: string
}

// Validation schemas using Zod
export const workExperienceSchema = {
  title: {
    required: "Title is required",
    minLength: { value: 2, message: "Title must be at least 2 characters" },
    maxLength: { value: 100, message: "Title must be less than 100 characters" }
  },
  company: {
    required: "Company is required",
    minLength: { value: 2, message: "Company must be at least 2 characters" }
  },
  startDate: {
    required: "Start date is required",
    validate: (value: string) => {
      const date = new Date(value)
      const now = new Date()
      const maxFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
      
      if (date > maxFuture) {
        return "Start date cannot be more than 10 years in the future"
      }
      return true
    }
  },
  endDate: {
    validate: (value: string, formValues: any) => {
      if (!value && !formValues.isCurrent && !formValues.isFuture) {
        return "End date is required unless position is current or future"
      }
      if (value && formValues.startDate) {
        const start = new Date(formValues.startDate)
        const end = new Date(value)
        if (end < start) {
          return "End date must be after start date"
        }
      }
      return true
    }
  },
  achievements: {
    validate: (value: string[]) => {
      if (!value || value.length === 0) {
        return "At least one achievement is required"
      }
      if (value.some(a => a.trim().length < 10)) {
        return "Each achievement must be at least 10 characters"
      }
      return true
    }
  }
}

// Helper functions
export const isValidFutureDate = (date: string): boolean => {
  const targetDate = new Date(date)
  const now = new Date()
  const maxFuture = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
  
  return targetDate > now && targetDate <= maxFuture
}

export const calculateProgress = (
  skillGaps: SkillGap[],
  milestones: Milestone[]
): number => {
  if (skillGaps.length === 0 && milestones.length === 0) return 0
  
  const skillProgress = skillGaps.reduce((acc, gap) => {
    const levelMap = { none: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
    const current = levelMap[gap.currentLevel]
    const required = levelMap[gap.requiredLevel]
    const progress = (current / required) * 100
    return acc + progress
  }, 0) / (skillGaps.length || 1)
  
  const milestoneProgress = milestones.filter(m => m.completed).length / 
    (milestones.length || 1) * 100
  
  // Weight milestones more heavily than skills
  return (skillProgress * 0.4 + milestoneProgress * 0.6)
}

export const sortExperiencesByDate = (
  experiences: WorkExperienceWithFuture[]
): WorkExperienceWithFuture[] => {
  return experiences.sort((a, b) => {
    // Future experiences go to the top
    if (a.isFuture && !b.isFuture) return -1
    if (!a.isFuture && b.isFuture) return 1
    
    // Current experiences next
    if (a.isCurrent && !b.isCurrent) return -1
    if (!a.isCurrent && b.isCurrent) return 1
    
    // Then sort by start date (most recent first)
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })
}

// Helper to get company name from either string or CompanyReference
export const getCompanyName = (company: string | CompanyReference): string => {
  return typeof company === 'string' ? company : company.name
}

// Helper to normalize company data
export const normalizeCompany = (company: string | CompanyReference): CompanyReference => {
  if (typeof company === 'string') {
    return {
      name: company,
      isValidated: false
    }
  }
  return company
}

// Validation helper for date ranges
export const validateDateRange = (startDate: string, endDate?: string, isCurrent?: boolean): string | null => {
  if (!startDate) return 'Start date is required'
  
  const start = new Date(startDate)
  const now = new Date()
  
  // Check if dates are valid
  if (isNaN(start.getTime())) return 'Invalid start date'
  
  // For future experiences, start date should be in the future
  if (endDate && !isCurrent) {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) return 'Invalid end date'
    if (end < start) return 'End date must be after start date'
  }
  
  return null
}