import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch user's surface and personal repo data
    const { rows } = await sql`
      SELECT surface_repo_data, personal_repo_data 
      FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    if (!rows[0]) {
      // Return empty graph if no data
      return NextResponse.json({ nodes: [], links: [] });
    }

    const surfaceData = rows[0].surface_repo_data || {};
    const personalData = rows[0].personal_repo_data || {};
    const nodes: any[] = [];
    const links: any[] = [];

    // Create timeline nodes from experiences
    let xPosition = -150;
    const xStep = 60;
    let lastNodeId: string | null = null;

    // Add career start node
    const startNode = {
      id: 'career-start',
      name: 'Career Start',
      type: 'milestone',
      year: new Date().getFullYear() - 15, // Default to 15 years ago
      x: xPosition,
      y: 0,
      z: 0,
      color: '#FFD700'
    };
    nodes.push(startNode);
    lastNodeId = startNode.id;
    xPosition += xStep;

    // Process past experiences
    if (surfaceData.experiences && Array.isArray(surfaceData.experiences)) {
      const sortedExperiences = [...surfaceData.experiences].sort((a, b) => {
        const dateA = new Date(a.startDate || 0).getTime();
        const dateB = new Date(b.startDate || 0).getTime();
        return dateA - dateB;
      });

      sortedExperiences.forEach((exp: any) => {
        const nodeId = `exp-${exp.id || nodes.length}`;
        const node = {
          id: nodeId,
          name: exp.title || 'Experience',
          company: exp.company,
          type: exp.current ? 'current' : 'past',
          year: new Date(exp.startDate || Date.now()).getFullYear(),
          x: xPosition,
          y: exp.current ? 40 : 20,
          z: (Math.random() - 0.5) * 20,
          color: exp.current ? '#3B82F6' : '#6B7280',
          description: exp.description
        };
        nodes.push(node);
        
        if (lastNodeId) {
          links.push({ source: lastNodeId, target: nodeId });
        }
        lastNodeId = nodeId;
        xPosition += xStep;
      });
    }

    // Add current position if not already included
    const hasCurrentPosition = nodes.some(n => n.type === 'current');
    if (!hasCurrentPosition) {
      const currentNode = {
        id: 'current-position',
        name: 'Current Position',
        type: 'current',
        year: new Date().getFullYear(),
        x: xPosition,
        y: 40,
        z: 0,
        color: '#3B82F6'
      };
      nodes.push(currentNode);
      if (lastNodeId) {
        links.push({ source: lastNodeId, target: currentNode.id });
      }
      lastNodeId = currentNode.id;
      xPosition += xStep;
    }

    // Process future experiences from personal repo
    if (personalData.futureExperiences && Array.isArray(personalData.futureExperiences)) {
      personalData.futureExperiences.forEach((exp: any, idx: number) => {
        const nodeId = `future-${idx}`;
        const futureYear = new Date().getFullYear() + (idx + 1) * 3; // Space future goals 3 years apart
        const node = {
          id: nodeId,
          name: exp.title || 'Future Goal',
          company: exp.company || 'Target Company',
          type: 'future',
          year: futureYear,
          x: xPosition,
          y: 50 + (idx * 10),
          z: (Math.random() - 0.5) * 30,
          color: '#A855F7',
          description: exp.description
        };
        nodes.push(node);
        
        if (lastNodeId) {
          links.push({ 
            source: lastNodeId, 
            target: nodeId,
            color: '#A855F7'
          });
        }
        lastNodeId = nodeId;
        xPosition += xStep;
      });
    } else {
      // Add placeholder future goals if none exist
      const futureGoals = [
        { title: 'Next Career Step', company: 'Growth Opportunity' },
        { title: 'Leadership Role', company: 'Industry Leader' }
      ];
      
      futureGoals.forEach((goal, idx) => {
        const nodeId = `future-${idx}`;
        const futureYear = new Date().getFullYear() + (idx + 1) * 3;
        const node = {
          id: nodeId,
          name: goal.title,
          company: goal.company,
          type: 'future',
          year: futureYear,
          x: xPosition,
          y: 50 + (idx * 10),
          z: (Math.random() - 0.5) * 30,
          color: '#A855F7'
        };
        nodes.push(node);
        
        if (lastNodeId) {
          links.push({ 
            source: lastNodeId, 
            target: nodeId,
            color: '#A855F7'
          });
        }
        lastNodeId = nodeId;
        xPosition += xStep;
      });
    }

    // Add achievement nodes connected to experiences
    if (surfaceData.achievements && Array.isArray(surfaceData.achievements)) {
      surfaceData.achievements.forEach((achievement: any, idx: number) => {
        const achievementNode = {
          id: `achievement-${idx}`,
          name: achievement.title || 'Achievement',
          type: 'achievement',
          x: -50 + (idx * 40),
          y: -40,
          z: 20,
          color: '#F59E0B',
          description: achievement.description
        };
        nodes.push(achievementNode);
        
        // Connect to a random experience node
        const expNodes = nodes.filter(n => n.type === 'past' || n.type === 'current');
        if (expNodes.length > 0) {
          const randomExp = expNodes[Math.floor(Math.random() * expNodes.length)];
          links.push({
            source: achievementNode.id,
            target: randomExp.id,
            color: '#F59E0B',
            value: 0.5
          });
        }
      });
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error('Career timeline error:', error);
    return NextResponse.json({ error: 'Failed to generate career timeline' }, { status: 500 });
  }
}