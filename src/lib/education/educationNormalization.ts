/**
 * Education Normalization System
 * Normalizes university names and provides rich metadata
 */

import { EducationNormalized } from './educationTypes';

// Database of known institutions with normalization
export const INSTITUTION_DATABASE: Record<string, EducationNormalized> = {
  // Top US Universities
  'harvard': {
    canonical: 'Harvard University',
    institutionId: 'harvard',
    aliases: ['harvard', 'harvard university', 'harvard college', 'harvard u'],
    type: 'university',
    location: 'Cambridge, MA, USA',
    specialties: ['Business', 'Law', 'Medicine', 'Liberal Arts']
  },
  'mit': {
    canonical: 'Massachusetts Institute of Technology',
    institutionId: 'mit',
    aliases: ['mit', 'massachusetts institute of technology', 'm.i.t.'],
    type: 'university',
    location: 'Cambridge, MA, USA',
    specialties: ['Engineering', 'Computer Science', 'Physics', 'Mathematics']
  },
  'stanford': {
    canonical: 'Stanford University',
    institutionId: 'stanford',
    aliases: ['stanford', 'stanford university', 'stanford u'],
    type: 'university',
    location: 'Stanford, CA, USA',
    specialties: ['Computer Science', 'Engineering', 'Business', 'Medicine']
  },
  
  // Top UK Universities
  'cambridge': {
    canonical: 'University of Cambridge',
    institutionId: 'cambridge',
    aliases: ['cambridge', 'cambridge university', 'university of cambridge', 'cam'],
    type: 'university',
    location: 'Cambridge, UK',
    specialties: ['Sciences', 'Mathematics', 'PPE', 'Engineering']
  },
  'oxford': {
    canonical: 'University of Oxford',
    institutionId: 'oxford',
    aliases: ['oxford', 'oxford university', 'university of oxford'],
    type: 'university',
    location: 'Oxford, UK',
    specialties: ['PPE', 'Law', 'Medicine', 'Liberal Arts']
  },
  'imperial': {
    canonical: 'Imperial College London',
    institutionId: 'imperial',
    aliases: ['imperial', 'imperial college', 'imperial college london', 'icl'],
    type: 'university',
    location: 'London, UK',
    specialties: ['Engineering', 'Science', 'Medicine', 'Business']
  },
  'lse': {
    canonical: 'London School of Economics',
    institutionId: 'lse',
    aliases: ['lse', 'london school of economics', 'london school of economics and political science'],
    type: 'university',
    location: 'London, UK',
    specialties: ['Economics', 'Politics', 'Social Sciences', 'Finance']
  },
  
  // Other Notable Universities
  'berkeley': {
    canonical: 'University of California, Berkeley',
    institutionId: 'berkeley',
    aliases: ['berkeley', 'uc berkeley', 'cal', 'university of california berkeley'],
    type: 'university',
    location: 'Berkeley, CA, USA',
    specialties: ['Computer Science', 'Engineering', 'Business', 'Liberal Arts']
  },
  'cmu': {
    canonical: 'Carnegie Mellon University',
    institutionId: 'cmu',
    aliases: ['cmu', 'carnegie mellon', 'carnegie mellon university'],
    type: 'university',
    location: 'Pittsburgh, PA, USA',
    specialties: ['Computer Science', 'Robotics', 'Arts', 'Business']
  },
  
  // Bootcamps and Online
  'general-assembly': {
    canonical: 'General Assembly',
    institutionId: 'general-assembly',
    aliases: ['general assembly', 'ga'],
    type: 'bootcamp',
    location: 'Multiple Locations',
    specialties: ['Web Development', 'Data Science', 'UX Design']
  },
  'coursera': {
    canonical: 'Coursera',
    institutionId: 'coursera',
    aliases: ['coursera'],
    type: 'online',
    location: 'Online',
    specialties: ['Various Online Courses', 'Certificates', 'Degrees']
  }
};

// Field abbreviations and expansions
export const FIELD_ABBREVIATIONS: Record<string, string> = {
  'CS': 'Computer Science',
  'EE': 'Electrical Engineering',
  'ME': 'Mechanical Engineering',
  'ChE': 'Chemical Engineering',
  'PPE': 'Philosophy, Politics, and Economics',
  'EECS': 'Electrical Engineering and Computer Science',
  'AI/ML': 'Artificial Intelligence and Machine Learning',
  'HCI': 'Human-Computer Interaction',
  'IR': 'International Relations',
  'Poli Sci': 'Political Science',
  'Econ': 'Economics',
  'Bio': 'Biology',
  'Chem': 'Chemistry',
  'Math': 'Mathematics',
  'Stats': 'Statistics'
};

export class EducationNormalizer {
  private institutionMap: Map<string, string>;
  
  constructor() {
    this.institutionMap = new Map();
    this.buildInstitutionMap();
  }
  
  private buildInstitutionMap() {
    Object.entries(INSTITUTION_DATABASE).forEach(([key, institution]) => {
      // Add the key itself
      this.institutionMap.set(key.toLowerCase(), institution.canonical);
      
      // Add all aliases
      institution.aliases.forEach(alias => {
        this.institutionMap.set(alias.toLowerCase(), institution.canonical);
      });
    });
  }
  
  /**
   * Normalizes an institution name to its canonical form
   */
  normalizeInstitution(institutionName: string): string {
    const lowercased = institutionName.trim().toLowerCase();
    
    // Check if we have a canonical name for this institution
    const canonical = this.institutionMap.get(lowercased);
    if (canonical) {
      return canonical;
    }
    
    // If not in our database, return as-is but properly capitalized
    return institutionName.trim();
  }
  
  /**
   * Gets the institution ID for linking
   */
  getInstitutionId(institutionName: string): string | undefined {
    const normalized = this.normalizeInstitution(institutionName);
    
    const institution = Object.values(INSTITUTION_DATABASE).find(
      inst => inst.canonical === normalized
    );
    
    return institution?.institutionId;
  }
  
  /**
   * Normalizes a field of study
   */
  normalizeField(field: string): string {
    const trimmed = field.trim();
    
    // Check abbreviations
    const expanded = FIELD_ABBREVIATIONS[trimmed];
    if (expanded) {
      return expanded;
    }
    
    // Check if it's already in abbreviations values (reverse lookup)
    const isFullForm = Object.values(FIELD_ABBREVIATIONS).includes(trimmed);
    if (isFullForm) {
      return trimmed;
    }
    
    // Return as-is
    return trimmed;
  }
  
  /**
   * Gets metadata for an institution
   */
  getInstitutionMetadata(institutionName: string): EducationNormalized | undefined {
    const normalized = this.normalizeInstitution(institutionName);
    
    return Object.values(INSTITUTION_DATABASE).find(
      inst => inst.canonical === normalized
    );
  }
  
  /**
   * Suggests institutions based on partial input
   */
  getInstitutionSuggestions(partial: string, limit = 10): string[] {
    const lowercased = partial.toLowerCase();
    const suggestions: string[] = [];
    
    Object.values(INSTITUTION_DATABASE).forEach(institution => {
      if (institution.canonical.toLowerCase().includes(lowercased) ||
          institution.aliases.some(alias => alias.includes(lowercased))) {
        suggestions.push(institution.canonical);
      }
    });
    
    return suggestions.slice(0, limit);
  }
  
  /**
   * Enriches a field of study with typical skills
   */
  getFieldSkills(field: string): string[] {
    const normalizedField = this.normalizeField(field);
    
    // Check if we have enrichment data
    const enrichment = Object.entries(FIELD_ABBREVIATIONS).find(
      ([abbr, full]) => full === normalizedField || abbr === normalizedField
    );
    
    // Return some default skills based on category
    if (normalizedField.includes('Computer') || normalizedField.includes('Software')) {
      return ['Programming', 'Problem Solving', 'Software Design', 'Algorithms'];
    }
    if (normalizedField.includes('Business') || normalizedField.includes('MBA')) {
      return ['Leadership', 'Strategy', 'Finance', 'Management'];
    }
    if (normalizedField.includes('Engineering')) {
      return ['Problem Solving', 'Design', 'Mathematics', 'Project Management'];
    }
    
    return ['Critical Thinking', 'Research', 'Analysis'];
  }
}

export const educationNormalizer = new EducationNormalizer();