/**
 * Converts between rich data objects and simple storage format
 */

import { Experience } from '@/lib/experience/experienceTypes';
import { Education } from '@/lib/education/educationTypes';
import { Skill } from '@/lib/skills/skillTypes';

// Convert rich experience to simple format for storage
export function simplifyExperience(experience: Experience): any {
  return {
    id: experience.id,
    title: experience.title,
    company: experience.company,
    startDate: experience.startDate,
    endDate: experience.endDate,
    current: experience.current || false,
    description: experience.description || '',
    // Store additional data as flat fields
    teamSize: experience.teamSize,
    directReports: experience.directReports,
    impact: experience.impact || [],
    technologies: experience.technologies || [],
    methodologies: experience.methodologies || [],
    isFuture: experience.isFuture || false
  };
}

// Convert rich education to simple format
export function simplifyEducation(education: Education): any {
  return {
    id: education.id,
    institution: education.institution,
    degree: education.degree,
    field: education.field,
    startDate: education.startDate,
    endDate: education.endDate,
    gpa: education.gpa,
    achievements: education.achievements || [],
    skillsGained: education.skillsGained || []
  };
}

// Convert rich skill to simple format (or just string)
export function simplifySkill(skill: Skill | string): string | any {
  if (typeof skill === 'string') {
    return skill;
  }
  
  // For now, just return the skill name as a string
  // We can store the rich data separately if needed
  return skill.name;
}

// Convert arrays of rich objects
export function simplifyExperiences(experiences: Experience[]): any[] {
  return experiences.map(simplifyExperience);
}

export function simplifyEducations(educations: Education[]): any[] {
  return educations.map(simplifyEducation);
}

export function simplifySkills(skills: (Skill | string)[]): string[] {
  return skills.map(simplifySkill);
}