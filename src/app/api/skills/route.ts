import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log('📚 Fetching skills from user_skills table for:', userId);

    // Get user's skills from dedicated user_skills table
    const result = await query(
      `SELECT 
        skill_name as name,
        skill_category as category,
        proficiency_level,
        years_experience,
        evidence_sources,
        last_used_date,
        improvement_goals,
        market_demand,
        growth_potential,
        related_skills,
        created_at,
        updated_at
      FROM user_skills 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [userId]
    );

    console.log(`📚 Found ${result.rows.length} skills in user_skills table`);

    // Transform to match expected format
    const skills = result.rows.map((row: any) => ({
      name: row.name,
      category: row.category || 'technical',
      proficiency: getProficiencyText(row.proficiency_level),
      years_experience: row.years_experience,
      evidence_sources: row.evidence_sources || [],
      last_used_date: row.last_used_date,
      improvement_goals: row.improvement_goals,
      market_demand: row.market_demand,
      growth_potential: row.growth_potential,
      related_skills: row.related_skills || [],
      addedAt: row.created_at,
      isNew: isRecentlyAdded(row.created_at)
    }));

    return NextResponse.json({ skills });

  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

function getProficiencyText(level: number): string {
  if (level >= 4) return 'expert';
  if (level >= 3) return 'advanced';
  if (level >= 2) return 'intermediate';
  return 'beginner';
}

function isRecentlyAdded(createdAt: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
  return diffMinutes < 10; // Consider "new" if added in last 10 minutes
}

export async function POST(request: NextRequest) {
  try {
    const { userId, skill } = await request.json();

    if (!userId || !skill) {
      return NextResponse.json({ error: 'Missing userId or skill data' }, { status: 400 });
    }

    console.log('💾 Saving skill to user_skills table:', { userId, skill: skill.name });

    // Ensure user exists in users table first (to satisfy foreign key constraint)
    try {
      await query(
        `INSERT INTO users (id, name, email, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         ON CONFLICT (id) DO NOTHING`,
        [userId, 'Quest User', '']
      );
      console.log('✅ User ensured in users table');
    } catch (userError) {
      console.error('⚠️ Error ensuring user exists:', userError);
      // Continue anyway - maybe user already exists
    }

    // Check if skill already exists
    const existingResult = await query(
      'SELECT id FROM user_skills WHERE user_id = $1 AND skill_name = $2',
      [userId, skill.name]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
    }

    // Convert proficiency text to level
    const proficiencyLevel = getProficiencyLevel(skill.proficiency || 'intermediate');

    // Insert into user_skills table
    const insertResult = await query(
      `INSERT INTO user_skills (
        user_id, 
        skill_name, 
        skill_category, 
        proficiency_level,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        skill.name,
        skill.category || 'technical',
        proficiencyLevel
      ]
    );

    const savedSkill = insertResult.rows[0];
    console.log('✅ Skill saved to user_skills table:', savedSkill);

    // Transform back to expected format
    const responseSkill = {
      name: savedSkill.skill_name,
      category: savedSkill.skill_category,
      proficiency: getProficiencyText(savedSkill.proficiency_level),
      addedAt: savedSkill.created_at,
      isNew: true
    };

    return NextResponse.json({ success: true, skill: responseSkill });

  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}

function getProficiencyLevel(proficiency: string): number {
  switch (proficiency.toLowerCase()) {
    case 'expert': return 4;
    case 'advanced': return 3;
    case 'intermediate': return 2;
    case 'beginner': return 1;
    default: return 2;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, skillName } = await request.json();

    if (!userId || !skillName) {
      return NextResponse.json({ error: 'Missing userId or skillName' }, { status: 400 });
    }

    console.log('🗑️ Deleting skill from user_skills table:', { userId, skillName });

    // Delete from user_skills table
    const result = await query(
      'DELETE FROM user_skills WHERE user_id = $1 AND skill_name = $2 RETURNING *',
      [userId, skillName]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    console.log('✅ Skill deleted from user_skills table:', result.rows[0]);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing skill:', error);
    return NextResponse.json({ error: 'Failed to remove skill' }, { status: 500 });
  }
}