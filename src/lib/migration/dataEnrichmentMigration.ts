/**
 * Data Migration Script
 * Converts legacy string data to rich object formats
 */

import { Skill, SkillProficiency } from '@/lib/skills/skillTypes';
import { Experience } from '@/lib/experience/experienceTypes';
import { Education } from '@/lib/education/educationTypes';
import { skillNormalizer } from '@/lib/skills/skillNormalization';
import { educationNormalizer } from '@/lib/education/educationNormalization';

export interface LegacyData {
  skills?: (string | { name: string; category?: string })[];
  experiences?: (string | Experience)[];
  education?: (string | Education)[];
}

export interface EnrichedData {
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
}

/**
 * Migrates legacy skill data to enhanced format
 */
export function migrateSkills(
  legacySkills?: (string | { name: string; category?: string })[]
): Skill[] {
  if (!legacySkills || !Array.isArray(legacySkills)) {
    return [];
  }

  const migratedSkills: Skill[] = [];
  const seenSkills = new Set<string>();

  legacySkills.forEach((skill, index) => {
    let skillName: string;
    let category: string | undefined;

    // Handle both string and object formats
    if (typeof skill === 'string') {
      skillName = skill;
    } else if (skill && typeof skill.name === 'string') {
      skillName = skill.name;
      category = skill.category;
    } else {
      return; // Skip invalid data
    }

    // Normalize skill name
    const normalizedName = skillNormalizer.normalize(skillName);
    
    // Skip duplicates
    if (seenSkills.has(normalizedName)) {
      return;
    }
    seenSkills.add(normalizedName);

    // Determine if it's a known skill
    const isKnownSkill = skillNormalizer.isKnownSkill(normalizedName);
    
    // Get category
    const finalCategory = category || skillNormalizer.getCategory(normalizedName);

    // Estimate proficiency based on position in list (earlier = more proficient)
    let proficiency: SkillProficiency;
    const position = index / legacySkills.length;
    if (position < 0.25) {
      proficiency = 'expert';
    } else if (position < 0.5) {
      proficiency = 'advanced';
    } else if (position < 0.75) {
      proficiency = 'intermediate';
    } else {
      proficiency = 'beginner';
    }

    const enrichedSkill: Skill = {
      id: `skill-${Date.now()}-${index}`,
      name: normalizedName,
      category: finalCategory,
      proficiency,
      activelyUsing: true,
      isCustom: !isKnownSkill,
      normalizedFrom: normalizedName !== skillName ? skillName : undefined
    };

    migratedSkills.push(enrichedSkill);
  });

  return migratedSkills;
}

/**
 * Migrates legacy experience data to enhanced format
 */
export function migrateExperiences(
  legacyExperiences?: (string | Experience)[]
): Experience[] {
  if (!legacyExperiences || !Array.isArray(legacyExperiences)) {
    return [];
  }

  return legacyExperiences.map((exp, index) => {
    // If it's already a rich experience object, return as-is
    if (typeof exp === 'object' && exp.title && exp.company) {
      return {
        ...exp,
        id: exp.id || `exp-${Date.now()}-${index}`
      };
    }

    // Handle string format (legacy)
    if (typeof exp === 'string') {
      // Try to parse common patterns like "Senior Engineer at Company (2020-2023)"
      const patterns = [
        /^(.+?)\s+at\s+(.+?)\s*\((\d{4})-(\d{4}|\w+)\)$/,
        /^(.+?)\s*-\s*(.+?)\s*\((\d{4})-(\d{4}|\w+)\)$/,
        /^(.+?)\s*@\s*(.+?)$/
      ];

      for (const pattern of patterns) {
        const match = exp.match(pattern);
        if (match) {
          return {
            id: `exp-${Date.now()}-${index}`,
            title: match[1].trim(),
            company: match[2].trim(),
            startDate: match[3] || '',
            endDate: match[4] === 'Present' ? '' : match[4] || '',
            current: match[4] === 'Present',
            description: exp,
            type: 'full-time'
          };
        }
      }

      // Fallback: treat entire string as title
      return {
        id: `exp-${Date.now()}-${index}`,
        title: exp,
        company: 'Unknown Company',
        startDate: '',
        endDate: '',
        current: false,
        description: exp,
        type: 'full-time'
      };
    }

    // Fallback for invalid data
    return {
      id: `exp-${Date.now()}-${index}`,
      title: 'Unknown Position',
      company: 'Unknown Company',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      type: 'full-time'
    };
  });
}

/**
 * Migrates legacy education data to enhanced format
 */
export function migrateEducation(
  legacyEducation?: (string | Education)[]
): Education[] {
  if (!legacyEducation || !Array.isArray(legacyEducation)) {
    return [];
  }

  return legacyEducation.map((edu, index) => {
    // If it's already a rich education object, return as-is
    if (typeof edu === 'object' && edu.institution && edu.degree) {
      return {
        ...edu,
        id: edu.id || `edu-${Date.now()}-${index}`
      };
    }

    // Handle string format (legacy)
    if (typeof edu === 'string') {
      // Try to parse common patterns
      const patterns = [
        // "BS Computer Science, MIT (2018-2022)"
        /^(\w+)\s+(.+?),\s*(.+?)\s*\((\d{4})-(\d{4}|\w+)\)$/,
        // "MIT - Computer Science"
        /^(.+?)\s*-\s*(.+?)$/,
        // "Bachelor's in Computer Science from MIT"
        /^(.+?)\s+(?:in|of)\s+(.+?)\s+from\s+(.+?)$/
      ];

      for (const pattern of patterns) {
        const match = edu.match(pattern);
        if (match) {
          if (match.length === 6) {
            // First pattern
            return {
              id: `edu-${Date.now()}-${index}`,
              degree: match[1].trim(),
              field: match[2].trim(),
              institution: educationNormalizer.normalizeInstitution(match[3].trim()),
              institutionId: educationNormalizer.getInstitutionId(match[3].trim()),
              startDate: match[4],
              endDate: match[5] === 'Present' ? '' : match[5],
              current: match[5] === 'Present'
            };
          } else if (match.length === 3) {
            // Second pattern
            return {
              id: `edu-${Date.now()}-${index}`,
              institution: educationNormalizer.normalizeInstitution(match[1].trim()),
              institutionId: educationNormalizer.getInstitutionId(match[1].trim()),
              degree: 'Bachelor',
              field: match[2].trim(),
              startDate: '',
              endDate: '',
              current: false
            };
          } else if (match.length === 4) {
            // Third pattern
            return {
              id: `edu-${Date.now()}-${index}`,
              degree: match[1].trim(),
              field: match[2].trim(),
              institution: educationNormalizer.normalizeInstitution(match[3].trim()),
              institutionId: educationNormalizer.getInstitutionId(match[3].trim()),
              startDate: '',
              endDate: '',
              current: false
            };
          }
        }
      }

      // Fallback: treat as institution name
      return {
        id: `edu-${Date.now()}-${index}`,
        institution: educationNormalizer.normalizeInstitution(edu),
        institutionId: educationNormalizer.getInstitutionId(edu),
        degree: 'Bachelor',
        field: 'General Studies',
        startDate: '',
        endDate: '',
        current: false
      };
    }

    // Fallback for invalid data
    return {
      id: `edu-${Date.now()}-${index}`,
      institution: 'Unknown Institution',
      degree: 'Unknown Degree',
      field: 'Unknown Field',
      startDate: '',
      endDate: '',
      current: false
    };
  });
}

/**
 * Main migration function
 */
export function migrateUserData(legacyData: LegacyData): EnrichedData {
  return {
    skills: migrateSkills(legacyData.skills),
    experiences: migrateExperiences(legacyData.experiences),
    education: migrateEducation(legacyData.education)
  };
}

/**
 * Checks if data needs migration
 */
export function needsMigration(data: any): boolean {
  // Check skills
  if (data.skills && Array.isArray(data.skills)) {
    const hasStringSkills = data.skills.some((skill: any) => typeof skill === 'string');
    const hasLegacySkills = data.skills.some((skill: any) => 
      typeof skill === 'object' && !skill.proficiency
    );
    if (hasStringSkills || hasLegacySkills) return true;
  }

  // Check experiences
  if (data.experiences && Array.isArray(data.experiences)) {
    const hasStringExperiences = data.experiences.some((exp: any) => typeof exp === 'string');
    if (hasStringExperiences) return true;
  }

  // Check education
  if (data.education && Array.isArray(data.education)) {
    const hasStringEducation = data.education.some((edu: any) => typeof edu === 'string');
    if (hasStringEducation) return true;
  }

  return false;
}