export interface DataRelationship {
  id: string;
  sourceType: 'experience' | 'skill' | 'education' | 'certification' | 'okr' | 'goal' | 'task';
  sourceId: string;
  targetType: 'experience' | 'skill' | 'education' | 'certification' | 'okr' | 'goal' | 'task';
  targetId: string;
  relationshipType: 'uses' | 'requires' | 'supports' | 'enables' | 'linkedTo' | 'partOf';
  strength?: number; // 0-100 for relationship strength
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ProfileCompleteness {
  overall: number;
  sections: {
    basicInfo: number;
    workExperience: number;
    futureAspirations: number;
    skills: number;
    education: number;
    certifications: number;
    okrs: number;
    goals: number;
  };
  recommendations: string[];
  nextSteps: string[];
}

export interface CrossReference {
  type: 'experience' | 'skill' | 'education' | 'certification' | 'okr' | 'goal';
  id: string;
  title: string;
  relationship: string;
  count?: number;
}

// Find all relationships for a given entity
export function findRelationships(
  relationships: DataRelationship[],
  entityType: DataRelationship['sourceType'],
  entityId: string
): DataRelationship[] {
  return relationships.filter(
    r => (r.sourceType === entityType && r.sourceId === entityId) ||
         (r.targetType === entityType && r.targetId === entityId)
  );
}

// Get cross-references for skills
export function getSkillCrossReferences(
  skills: any[],
  experiences: any[],
  certifications: any[]
): Map<string, CrossReference[]> {
  const crossRefs = new Map<string, CrossReference[]>();
  
  skills.forEach(skill => {
    const refs: CrossReference[] = [];
    
    // Find experiences using this skill
    experiences.forEach(exp => {
      if (exp.skills?.includes(skill.name) || exp.techStack?.includes(skill.name)) {
        refs.push({
          type: 'experience',
          id: exp.id,
          title: `${exp.title} at ${exp.company?.name || exp.company}`,
          relationship: 'Used in'
        });
      }
    });
    
    // Find certifications requiring this skill
    certifications.forEach(cert => {
      if (cert.skills?.includes(skill.name)) {
        refs.push({
          type: 'certification',
          id: cert.id,
          title: cert.name,
          relationship: 'Required for'
        });
      }
    });
    
    crossRefs.set(skill.id || skill.name, refs);
  });
  
  return crossRefs;
}

// Calculate profile completeness
export function calculateProfileCompleteness(userData: any): ProfileCompleteness {
  const sections = {
    basicInfo: 0,
    workExperience: 0,
    futureAspirations: 0,
    skills: 0,
    education: 0,
    certifications: 0,
    okrs: 0,
    goals: 0
  };
  
  const recommendations: string[] = [];
  const nextSteps: string[] = [];
  
  // Basic Info (from Surface Repo)
  if (userData.surfaceRepo?.name) sections.basicInfo += 25;
  if (userData.surfaceRepo?.bio) sections.basicInfo += 25;
  if (userData.surfaceRepo?.contact?.email) sections.basicInfo += 25;
  if (userData.surfaceRepo?.links?.length > 0) sections.basicInfo += 25;
  
  // Work Experience
  const experiences = userData.surfaceRepo?.experience || [];
  if (experiences.length > 0) sections.workExperience += 40;
  if (experiences.some((e: any) => e.achievements?.length > 0)) sections.workExperience += 30;
  if (experiences.some((e: any) => e.impact)) sections.workExperience += 30;
  
  // Future Aspirations
  const futureExperiences = experiences.filter((e: any) => e.isFuture);
  if (futureExperiences.length > 0) sections.futureAspirations += 50;
  if (futureExperiences.some((e: any) => e.whyThisRole)) sections.futureAspirations += 25;
  if (futureExperiences.some((e: any) => e.requiredSteps?.length > 0)) sections.futureAspirations += 25;
  
  // Skills
  const skills = userData.workingRepo?.skills || [];
  if (skills.length >= 5) sections.skills += 40;
  if (skills.length >= 10) sections.skills += 30;
  if (skills.some((s: any) => s.proficiency && s.category)) sections.skills += 30;
  
  // Education
  const education = userData.workingRepo?.education || [];
  if (education.length > 0) sections.education += 60;
  if (education.some((e: any) => e.achievements || e.gpa)) sections.education += 40;
  
  // Certifications
  const certifications = userData.workingRepo?.certifications || [];
  if (certifications.length > 0) sections.certifications += 60;
  if (certifications.some((c: any) => c.status === 'completed')) sections.certifications += 40;
  
  // OKRs
  const okrs = userData.personalRepo?.okrs || [];
  if (okrs.length > 0) sections.okrs += 40;
  if (okrs.some((o: any) => o.status === 'active')) sections.okrs += 30;
  if (okrs.some((o: any) => o.keyResults?.length >= 3)) sections.okrs += 30;
  
  // Goals
  const goals = userData.personalRepo?.goals || [];
  if (goals.length > 0) sections.goals += 40;
  if (goals.some((g: any) => g.status === 'active')) sections.goals += 30;
  if (goals.some((g: any) => g.tasks?.length > 0)) sections.goals += 30;
  
  // Calculate overall
  const sectionScores = Object.values(sections);
  const overall = Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length);
  
  // Generate recommendations
  if (sections.basicInfo < 75) {
    recommendations.push('Complete your basic profile information');
    nextSteps.push('Add a professional bio and contact information');
  }
  
  if (sections.workExperience < 60) {
    recommendations.push('Add more work experience details');
    nextSteps.push('Include achievements and impact metrics for each role');
  }
  
  if (sections.futureAspirations === 0) {
    recommendations.push('Define your future career aspirations');
    nextSteps.push('Add at least one future role you\'re working towards');
  }
  
  if (sections.skills < 50) {
    recommendations.push('Expand your skills inventory');
    nextSteps.push('Add at least 10 skills with proficiency levels');
  }
  
  if (sections.okrs === 0) {
    recommendations.push('Set quarterly OKRs for professional growth');
    nextSteps.push('Create your first OKR with 3-5 key results');
  }
  
  if (sections.goals === 0 && sections.okrs > 0) {
    recommendations.push('Break down OKRs into actionable goals');
    nextSteps.push('Create goals linked to your active OKRs');
  }
  
  return {
    overall,
    sections,
    recommendations,
    nextSteps
  };
}

// Find related entities
export function findRelatedEntities(
  entityType: string,
  entityId: string,
  allData: any
): CrossReference[] {
  const related: CrossReference[] = [];
  
  switch (entityType) {
    case 'okr':
      // Find goals linked to this OKR
      const goals = allData.personalRepo?.goals || [];
      goals.forEach((goal: any) => {
        if (goal.linkedOKRId === entityId) {
          related.push({
            type: 'goal',
            id: goal.id,
            title: goal.title,
            relationship: 'Supports this OKR',
            count: goal.tasks?.length || 0
          });
        }
      });
      break;
      
    case 'goal':
      // Find OKR this goal supports
      const goal = allData.personalRepo?.goals?.find((g: any) => g.id === entityId);
      if (goal?.linkedOKRId) {
        const okr = allData.personalRepo?.okrs?.find((o: any) => o.id === goal.linkedOKRId);
        if (okr) {
          related.push({
            type: 'okr',
            id: okr.id,
            title: okr.objective,
            relationship: 'Linked to OKR'
          });
        }
      }
      break;
      
    case 'experience':
      // Find skills used in this experience
      const exp = allData.surfaceRepo?.experience?.find((e: any) => e.id === entityId);
      if (exp?.skills) {
        exp.skills.forEach((skillName: string) => {
          related.push({
            type: 'skill',
            id: skillName,
            title: skillName,
            relationship: 'Skill used'
          });
        });
      }
      break;
  }
  
  return related;
}

// Validate data integrity
export function validateDataIntegrity(userData: any): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check for orphaned relationships
  const goals = userData.personalRepo?.goals || [];
  const okrs = userData.personalRepo?.okrs || [];
  
  goals.forEach((goal: any) => {
    if (goal.linkedOKRId && !okrs.find((o: any) => o.id === goal.linkedOKRId)) {
      warnings.push(`Goal "${goal.title}" linked to non-existent OKR`);
    }
  });
  
  // Check for date inconsistencies
  const experiences = userData.surfaceRepo?.experience || [];
  experiences.forEach((exp: any, index: number) => {
    if (exp.endDate && exp.startDate && exp.endDate < exp.startDate) {
      issues.push(`Experience #${index + 1} has end date before start date`);
    }
  });
  
  // Check for duplicate skills
  const skills = userData.workingRepo?.skills || [];
  const skillNames = skills.map((s: any) => s.name?.toLowerCase());
  const duplicates = skillNames.filter((s: string, i: number) => skillNames.indexOf(s) !== i);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate skills found: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

// Get navigation suggestions based on current context
export function getNavigationSuggestions(currentPath: string, userData: any): {
  suggested: { path: string; reason: string; priority: number }[];
  quickActions: { label: string; action: string; icon: string }[];
} {
  const suggested: { path: string; reason: string; priority: number }[] = [];
  const quickActions: { label: string; action: string; icon: string }[] = [];
  
  // Analyze user data to suggest next steps
  const completeness = calculateProfileCompleteness(userData);
  
  if (currentPath.includes('surface/edit')) {
    if (completeness.sections.futureAspirations === 0) {
      suggested.push({
        path: '/repo/surface/edit',
        reason: 'Add your future career aspirations',
        priority: 1
      });
    }
    
    quickActions.push(
      { label: 'Add Future Role', action: 'addFutureRole', icon: 'Target' },
      { label: 'View Skills', action: 'navigateSkills', icon: 'Zap' }
    );
  }
  
  if (currentPath.includes('personal/okr')) {
    if ((userData.personalRepo?.okrs?.length || 0) > 0 && 
        (userData.personalRepo?.goals?.length || 0) === 0) {
      suggested.push({
        path: '/repo/personal/goals',
        reason: 'Break down your OKRs into actionable goals',
        priority: 1
      });
    }
    
    quickActions.push(
      { label: 'Create Goal', action: 'createGoal', icon: 'Target' },
      { label: 'Review Progress', action: 'reviewProgress', icon: 'BarChart3' }
    );
  }
  
  return { suggested, quickActions };
}