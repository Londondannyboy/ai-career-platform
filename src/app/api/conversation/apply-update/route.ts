import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import sql from '@/lib/neon';

export async function POST(request: NextRequest) {
  try {
    const { userId, update } = await request.json();

    if (!userId || !update) {
      return NextResponse.json({ error: 'Missing userId or update data' }, { status: 400 });
    }

    const { type, data, layer } = update;

    // Apply the update to the Deep Repo based on type
    switch (type) {
      case 'skill':
        await applySkillUpdate(userId, data, layer);
        break;
      
      case 'experience':
        await applyExperienceUpdate(userId, data, layer);
        break;
      
      case 'goal':
        await applyGoalUpdate(userId, data, layer);
        break;
      
      case 'achievement':
        await applyAchievementUpdate(userId, data, layer);
        break;
      
      default:
        return NextResponse.json({ error: 'Unknown update type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error applying update:', error);
    return NextResponse.json({ error: 'Failed to apply update' }, { status: 500 });
  }
}

async function applySkillUpdate(userId: string, skillData: any, layer: string) {
  // Get current repo data
  const result = await sql`
    SELECT ${sql(layer + '_repo')} as repo_data 
    FROM user_profiles 
    WHERE user_id = ${userId}
  `;

  if (result.length === 0) {
    throw new Error('User profile not found');
  }

  const currentRepo = result[0].repo_data || {};
  const currentSkills = currentRepo.skills || [];

  // Check if skill already exists
  const existingSkillIndex = currentSkills.findIndex((skill: any) => {
    const skillName = typeof skill === 'string' ? skill : skill.name;
    return skillName.toLowerCase() === skillData.name.toLowerCase();
  });

  if (existingSkillIndex >= 0) {
    // Update existing skill
    currentSkills[existingSkillIndex] = {
      name: skillData.name,
      proficiency: skillData.proficiency || 'intermediate',
      category: skillData.category || 'technical',
      addedAt: new Date().toISOString(),
      isNew: true
    };
  } else {
    // Add new skill
    currentSkills.push({
      name: skillData.name,
      proficiency: skillData.proficiency || 'intermediate',
      category: skillData.category || 'technical',
      addedAt: new Date().toISOString(),
      isNew: true
    });
  }

  // Update the repo
  const updatedRepo = {
    ...currentRepo,
    skills: currentSkills
  };

  await sql`
    UPDATE user_profiles 
    SET ${sql(layer + '_repo')} = ${JSON.stringify(updatedRepo)}
    WHERE user_id = ${userId}
  `;
}

async function applyExperienceUpdate(userId: string, experienceData: any, layer: string) {
  // Get current repo data
  const result = await sql`
    SELECT ${sql(layer + '_repo')} as repo_data 
    FROM user_profiles 
    WHERE user_id = ${userId}
  `;

  if (result.length === 0) {
    throw new Error('User profile not found');
  }

  const currentRepo = result[0].repo_data || {};
  const currentExperiences = currentRepo.experiences || [];

  // Add new experience
  currentExperiences.push({
    id: Date.now().toString(),
    title: experienceData.title,
    company: experienceData.company,
    startDate: experienceData.startDate || new Date().toISOString().split('T')[0],
    endDate: experienceData.endDate || null,
    current: experienceData.current || false,
    description: experienceData.description || '',
    skills: experienceData.skills || [],
    addedAt: new Date().toISOString(),
    isNew: true
  });

  // Update the repo
  const updatedRepo = {
    ...currentRepo,
    experiences: currentExperiences
  };

  await sql`
    UPDATE user_profiles 
    SET ${sql(layer + '_repo')} = ${JSON.stringify(updatedRepo)}
    WHERE user_id = ${userId}
  `;
}

async function applyGoalUpdate(userId: string, goalData: any, layer: string) {
  // Get current repo data
  const result = await sql`
    SELECT ${sql(layer + '_repo')} as repo_data 
    FROM user_profiles 
    WHERE user_id = ${userId}
  `;

  if (result.length === 0) {
    throw new Error('User profile not found');
  }

  const currentRepo = result[0].repo_data || {};
  const currentGoals = currentRepo.goals || [];

  // Add new goal
  currentGoals.push({
    id: Date.now().toString(),
    description: goalData.description,
    timeframe: goalData.timeframe || 'short-term',
    priority: goalData.priority || 'medium',
    category: goalData.category || 'career',
    addedAt: new Date().toISOString(),
    isNew: true
  });

  // Update the repo
  const updatedRepo = {
    ...currentRepo,
    goals: currentGoals
  };

  await sql`
    UPDATE user_profiles 
    SET ${sql(layer + '_repo')} = ${JSON.stringify(updatedRepo)}
    WHERE user_id = ${userId}
  `;
}

async function applyAchievementUpdate(userId: string, achievementData: any, layer: string) {
  // Get current repo data
  const result = await sql`
    SELECT ${sql(layer + '_repo')} as repo_data 
    FROM user_profiles 
    WHERE user_id = ${userId}
  `;

  if (result.length === 0) {
    throw new Error('User profile not found');
  }

  const currentRepo = result[0].repo_data || {};
  const currentAchievements = currentRepo.achievements || [];

  // Add new achievement
  currentAchievements.push({
    id: Date.now().toString(),
    title: achievementData.title,
    description: achievementData.description || '',
    date: achievementData.date || new Date().toISOString().split('T')[0],
    category: achievementData.category || 'professional',
    impact: achievementData.impact || 'medium',
    addedAt: new Date().toISOString(),
    isNew: true
  });

  // Update the repo
  const updatedRepo = {
    ...currentRepo,
    achievements: currentAchievements
  };

  await sql`
    UPDATE user_profiles 
    SET ${sql(layer + '_repo')} = ${JSON.stringify(updatedRepo)}
    WHERE user_id = ${userId}
  `;
}