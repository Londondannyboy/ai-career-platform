import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { skillIntelligence } from '@/lib/ai/skillIntelligence';

export async function POST(request: NextRequest) {
  try {
    // Get user ID
    let userId = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId;
    } catch (e) {
      console.log('Auth failed, checking headers');
    }
    
    if (!userId) {
      userId = request.headers.get('X-User-Id');
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch user's profile data
    const { rows } = await sql`
      SELECT 
        surface_repo_data,
        personal_repo_data
      FROM user_profiles
      WHERE user_id = ${userId}
    `;

    if (!rows[0]) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const surfaceData = rows[0].surface_repo_data || {};
    const personalData = rows[0].personal_repo_data || {};

    // Analyze skills
    const analysis = await skillIntelligence.analyzeSkills({
      currentSkills: surfaceData.skills || [],
      experiences: surfaceData.experiences || [],
      futureGoals: personalData.futureExperiences || [],
      currentRole: surfaceData.professional_headline
    });

    if (!analysis) {
      return NextResponse.json({ 
        error: 'Failed to analyze skills' 
      }, { status: 500 });
    }

    // Also get categorized skills
    const currentSkillNames = (surfaceData.skills || []).map((s: any) => 
      typeof s === 'string' ? s : s.name
    );
    const categorizedSkills = skillIntelligence.categorizeSkills(currentSkillNames);

    return NextResponse.json({
      analysis,
      categorizedSkills,
      stats: {
        totalSkills: currentSkillNames.length,
        uniqueSkills: analysis.existingSkills.length,
        suggestedCount: analysis.suggestedSkills.length,
        skillGaps: analysis.skillGaps.length
      }
    });

  } catch (error) {
    console.error('Skill analysis error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}