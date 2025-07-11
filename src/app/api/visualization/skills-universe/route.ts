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

    // Fetch user's surface repo data
    const { rows } = await sql`
      SELECT surface_repo_data 
      FROM user_profiles 
      WHERE user_id = ${userId}
    `;

    if (!rows[0]?.surface_repo_data) {
      // Return empty graph if no data
      return NextResponse.json({ nodes: [], links: [] });
    }

    const surfaceData = rows[0].surface_repo_data;
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Create center node for user
    const centerNode = {
      id: 'user-center',
      name: surfaceData.professional_headline || 'Professional',
      type: 'center',
      size: 30,
      color: '#FFFFFF',
      x: 0,
      y: 0,
      z: 0
    };
    nodes.push(centerNode);

    // Process skills
    const skillCategories: Record<string, string[]> = {};
    if (surfaceData.skills && Array.isArray(surfaceData.skills)) {
      surfaceData.skills.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        const category = typeof skill === 'object' ? skill.category : 'General';
        
        if (!skillCategories[category]) {
          skillCategories[category] = [];
        }
        skillCategories[category].push(skillName);
      });
    }

    // Define category colors
    const categoryColors: Record<string, string> = {
      'Frontend': '#3B82F6',
      'Backend': '#F59E0B',
      'AI/ML': '#10B981',
      'Leadership': '#A855F7',
      'General': '#6B7280'
    };

    // Create nodes for skill categories and skills
    const categoryPositions: Record<string, { x: number; y: number; z: number }> = {};
    const angleStep = (Math.PI * 2) / Object.keys(skillCategories).length;
    
    Object.entries(skillCategories).forEach(([category, skills], catIndex) => {
      const angle = catIndex * angleStep;
      const radius = 80;
      const catPos = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 40
      };
      categoryPositions[category] = catPos;

      // Add category node
      const categoryNode = {
        id: `cat-${category}`,
        name: category,
        type: 'category',
        size: 20,
        color: categoryColors[category] || categoryColors.General,
        x: catPos.x,
        y: catPos.y,
        z: catPos.z
      };
      nodes.push(categoryNode);
      
      // Link category to center
      links.push({
        source: centerNode.id,
        target: categoryNode.id,
        value: 2
      });

      // Add skill nodes
      skills.forEach((skill, idx) => {
        const skillAngle = (idx / skills.length) * Math.PI * 2;
        const skillRadius = 30;
        const skillNode = {
          id: `skill-${skill}`,
          name: skill,
          type: 'skill',
          category,
          size: 10 + Math.random() * 10,
          color: categoryNode.color,
          x: catPos.x + Math.cos(skillAngle) * skillRadius,
          y: catPos.y + Math.sin(skillAngle) * skillRadius,
          z: catPos.z + (Math.random() - 0.5) * 20
        };
        nodes.push(skillNode);
        
        // Link to category
        links.push({
          source: categoryNode.id,
          target: skillNode.id,
          value: 1
        });
      });
    });

    // Add some cross-category connections for related skills
    const skillNodes = nodes.filter(n => n.type === 'skill');
    for (let i = 0; i < Math.min(5, skillNodes.length / 2); i++) {
      const idx1 = Math.floor(Math.random() * skillNodes.length);
      const idx2 = Math.floor(Math.random() * skillNodes.length);
      if (idx1 !== idx2 && skillNodes[idx1].category !== skillNodes[idx2].category) {
        links.push({
          source: skillNodes[idx1].id,
          target: skillNodes[idx2].id,
          value: 0.5
        });
      }
    }

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error('Skills universe error:', error);
    return NextResponse.json({ error: 'Failed to generate skills universe' }, { status: 500 });
  }
}