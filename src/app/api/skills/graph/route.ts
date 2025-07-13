import { NextRequest, NextResponse } from 'next/server';
import { skillGraphService } from '@/lib/skills/skillGraphService';

export async function POST(request: NextRequest) {
  try {
    const { userId, skill, action } = await request.json();

    if (!userId || !skill) {
      return NextResponse.json({ error: 'Missing userId or skill data' }, { status: 400 });
    }

    if (action === 'add') {
      // Add skill to Neo4j graph
      await skillGraphService.addSkillToGraph(userId, skill);
      
      return NextResponse.json({ 
        success: true, 
        message: `Skill "${skill.name}" added to graph with AI relationship discovery` 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in skills graph API:', error);
    return NextResponse.json({ error: 'Failed to process skill graph operation' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const skillName = url.searchParams.get('skill');
    const action = url.searchParams.get('action') || 'graph';

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'graph') {
      // Get full skill graph
      const graph = await skillGraphService.getUserSkillGraph(userId);
      return NextResponse.json(graph);
    }

    if (action === 'related' && skillName) {
      // Get related skills for a specific skill
      const related = await skillGraphService.getRelatedSkills(userId, skillName);
      return NextResponse.json(related);
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error('Error fetching skill graph:', error);
    return NextResponse.json({ error: 'Failed to fetch skill graph' }, { status: 500 });
  }
}