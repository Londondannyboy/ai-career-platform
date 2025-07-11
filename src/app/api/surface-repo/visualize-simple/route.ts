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
      // Last resort - check for any anonymous saves
      const anonResult = await sql`
        SELECT user_id, surface_repo 
        FROM user_profiles 
        WHERE user_id LIKE 'anon-%'
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      
      if (anonResult.rows.length > 0) {
        console.log('Using anonymous profile as fallback');
        userId = anonResult.rows[0].user_id;
      } else {
        return NextResponse.json({ 
          error: 'No user ID provided',
          message: 'Please ensure you are signed in',
          debug: {
            bodyUserId,
            headerUserId: request.headers.get('X-User-Id'),
            method: request.method
          }
        }, { status: 400 });
      }
    }

    console.log('Visualizing for user:', userId);

    // Get user's surface repo data directly
    const result = await sql`
      SELECT surface_repo_data 
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({
        nodes: [],
        links: []
      });
    }

    const surfaceData = result.rows[0]?.surface_repo_data || {};
    console.log('Found surface data:', Object.keys(surfaceData));

    // Create visualization nodes from Surface Repo data
    const nodes: any[] = [];
    const links: any[] = [];

    // Central profile node
    nodes.push({
      id: 'profile',
      name: surfaceData.professional_headline || 'Professional Profile',
      group: 'profile',
      color: '#0077B5', // LinkedIn blue
      size: 40,
      x: 0,
      y: 0,
      z: 0,
      value: surfaceData.summary || 'Add a summary to your profile'
    });

    // Experience nodes
    if (surfaceData?.experiences && Array.isArray(surfaceData.experiences)) {
      surfaceData.experiences.forEach((exp: any, index: number) => {
        const expId = `exp-${index}`;
        
        // Get company name from either string or object
        const companyName = typeof exp.company === 'string' 
          ? exp.company 
          : (exp.company?.name || 'Unknown Company');
        
        nodes.push({
          id: expId,
          name: companyName,
          group: 'experience',
          color: exp.type === 'future' ? '#8B5CF6' : (exp.current ? '#3B82F6' : '#FF6B6B'),
          size: exp.current ? 30 : 25,
          x: 100 * Math.cos(index * Math.PI / 3),
          y: 100 * Math.sin(index * Math.PI / 3),
          z: exp.type === 'future' ? 50 : 0,
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
        const skillName = typeof skill === 'string' ? skill : (skill.name || skill);
        const category = typeof skill === 'object' ? (skill.category || 'General') : 'General';
        const endorsements = typeof skill === 'object' ? (skill.endorsements || 0) : 0;
        
        // Color by category
        const categoryColors: Record<string, string> = {
          'Frontend': '#3B82F6',
          'Backend': '#F59E0B',
          'AI/ML': '#10B981',
          'Leadership': '#A855F7',
          'General': '#6B7280',
          'Technical': '#4ECDC4',
          'Business': '#45B7D1',
          'Creative': '#F4A261',
          'Communication': '#2A9D8F'
        };
        
        nodes.push({
          id: skillId,
          name: skillName,
          group: 'skill',
          color: categoryColors[category] || categoryColors.General,
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
      nodes,
      links
    });

  } catch (error: any) {
    console.error('Surface Repo visualization error:', error);
    return NextResponse.json({ 
      error: 'Failed to get Surface Repo visualization',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}