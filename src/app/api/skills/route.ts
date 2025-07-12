import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/neon';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Get user's surface repo skills
    const result = await query(
      'SELECT surface_repo_data FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ skills: [] });
    }

    const surfaceRepo = result.rows[0].surface_repo_data || {};
    const skills = (surfaceRepo as any).skills || [];

    return NextResponse.json({ skills });

  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, skill } = await request.json();

    if (!userId || !skill) {
      return NextResponse.json({ error: 'Missing userId or skill data' }, { status: 400 });
    }

    // Get current surface repo
    const result = await query(
      'SELECT surface_repo_data FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    let surfaceRepo = {};
    if (result.rows.length > 0) {
      surfaceRepo = result.rows[0].surface_repo_data || {};
    }

    // Add new skill
    const currentSkills = (surfaceRepo as any).skills || [];
    
    // Check if skill already exists
    const exists = currentSkills.some((existingSkill: any) => {
      const existingName = typeof existingSkill === 'string' ? existingSkill : existingSkill.name;
      return existingName.toLowerCase() === skill.name.toLowerCase();
    });

    if (exists) {
      return NextResponse.json({ error: 'Skill already exists' }, { status: 400 });
    }

    // Add the new skill
    const newSkill = {
      name: skill.name,
      category: skill.category || 'technical',
      proficiency: skill.proficiency || 'intermediate',
      addedAt: new Date().toISOString(),
      isNew: true
    };

    currentSkills.push(newSkill);

    // Update the surface repo
    const updatedSurfaceRepo = {
      ...surfaceRepo,
      skills: currentSkills
    };

    // Save to database
    if (result.rows.length === 0) {
      // Create new profile
      await query(
        'INSERT INTO user_profiles (user_id, surface_repo_data) VALUES ($1, $2)',
        [userId, JSON.stringify(updatedSurfaceRepo)]
      );
    } else {
      // Update existing profile
      await query(
        'UPDATE user_profiles SET surface_repo_data = $1 WHERE user_id = $2',
        [JSON.stringify(updatedSurfaceRepo), userId]
      );
    }

    return NextResponse.json({ success: true, skill: newSkill });

  } catch (error) {
    console.error('Error adding skill:', error);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, skillName } = await request.json();

    if (!userId || !skillName) {
      return NextResponse.json({ error: 'Missing userId or skillName' }, { status: 400 });
    }

    // Get current surface repo
    const result = await query(
      'SELECT surface_repo_data FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const surfaceRepo = result.rows[0].surface_repo_data || {};
    const currentSkills = (surfaceRepo as any).skills || [];

    // Remove the skill
    const updatedSkills = currentSkills.filter((skill: any) => {
      const name = typeof skill === 'string' ? skill : skill.name;
      return name.toLowerCase() !== skillName.toLowerCase();
    });

    // Update the surface repo
    const updatedSurfaceRepo = {
      ...surfaceRepo,
      skills: updatedSkills
    };

    // Save to database
    await query(
      'UPDATE user_profiles SET surface_repo_data = $1 WHERE user_id = $2',
      [JSON.stringify(updatedSurfaceRepo), userId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error removing skill:', error);
    return NextResponse.json({ error: 'Failed to remove skill' }, { status: 500 });
  }
}