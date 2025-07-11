import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Parse body first to get userId
    const body = await request.json();
    const { userId: bodyUserId } = body;
    
    // Get user ID - try multiple methods
    let userId = bodyUserId; // Start with body user ID
    
    if (!userId) {
      // Try auth methods
      try {
        const authResult = await auth();
        userId = authResult.userId;
      } catch (e: any) {
        console.log('Visualize auth failed:', e?.message);
      }
    }
    
    if (!userId) {
      // Try header
      const headerUserId = request.headers.get('X-User-Id');
      if (headerUserId && headerUserId !== '') {
        userId = headerUserId;
      }
    }
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'No user ID provided',
        message: 'Please ensure you are signed in'
      }, { status: 400 });
    }

    console.log('Visualizing for user:', userId);

    // Get user's surface repo data directly
    const result = await sql`
      SELECT surface_repo 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: 'No profile data found',
        message: 'Please add some data to your profile first',
        userId
      });
    }

    const surfaceData = result.rows[0]?.surface_repo || {};
    console.log('Found surface data:', Object.keys(surfaceData));

    // Create visualization nodes from Surface Repo data
    const nodes: any[] = [];
    const links: any[] = [];

    // Central profile node
    nodes.push({
      id: 'profile',
      name: surfaceData.headline || 'Professional Profile',
      group: 'profile',
      color: '#0077B5', // LinkedIn blue
      size: 40,
      x: 0,
      y: 0,
      z: 0,
      value: surfaceData.summary || 'Add a summary to your profile'
    });

    // Experience nodes
    if (surfaceData?.experience && Array.isArray(surfaceData.experience)) {
      surfaceData.experience.forEach((exp: any, index: number) => {
        const expId = `exp-${index}`;
        
        // Get company name from either string or object
        const companyName = typeof exp.company === 'string' 
          ? exp.company 
          : (exp.company?.name || 'Unknown Company');
        
        nodes.push({
          id: expId,
          name: companyName,
          group: 'experience',
          color: exp.isFuture ? '#8B5CF6' : (exp.isCurrent ? '#3B82F6' : '#FF6B6B'),
          size: exp.isCurrent ? 30 : 25,
          x: 100 * Math.cos(index * Math.PI / 3),
          y: 100 * Math.sin(index * Math.PI / 3),
          z: exp.isFuture ? 50 : 0,
          value: exp.title || 'Role'
        });
        links.push({ source: 'profile', target: expId });
      });
    }

    // Skills nodes
    if (surfaceData?.skills && Array.isArray(surfaceData.skills)) {
      surfaceData.skills.forEach((skill: any, index: number) => {
        const skillId = `skill-${index}`;
        
        // Handle both string and object formats
        const skillName = typeof skill === 'string' ? skill : skill.name;
        const category = typeof skill === 'object' ? skill.category : 'general';
        const endorsed = typeof skill === 'object' ? skill.endorsed : 0;
        
        // Get endorsement count
        const endorsements = endorsed || surfaceData.endorsements?.[skillName] || 0;
        
        // Color by category
        const categoryColors: Record<string, string> = {
          technical: '#4ECDC4',
          business: '#45B7D1',
          creative: '#F4A261',
          leadership: '#E76F51',
          communication: '#2A9D8F',
          general: '#264653'
        };
        
        nodes.push({
          id: skillId,
          name: skillName,
          group: 'skill',
          color: categoryColors[category] || categoryColors.general,
          size: 10 + (endorsements * 2), // Size based on endorsements
          x: 150 * Math.cos(index * 2 * Math.PI / surfaceData.skills.length),
          y: 150 * Math.sin(index * 2 * Math.PI / surfaceData.skills.length),
          z: 50,
          value: `${endorsements} endorsements`
        });
        links.push({ source: 'profile', target: skillId });
      });
    }

    console.log(`Created ${nodes.length} nodes and ${links.length} links`);

    return NextResponse.json({
      message: 'Surface Repo visualization ready',
      userId: userId,
      surfaceRepo: surfaceData,
      visualization: {
        nodes,
        links
      }
    });

  } catch (error: any) {
    console.error('Surface Repo visualization error:', error);
    return NextResponse.json({ 
      error: 'Failed to get Surface Repo visualization',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}