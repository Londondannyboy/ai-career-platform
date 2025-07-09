import { NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

export async function GET() {
  try {
    // Use test user for now since this is a public endpoint
    const testUserId = 'test-user-123';

    // Get or create user profile
    const profile = await DeepRepoService.getUserProfile(testUserId);
    
    if (!profile) {
      return NextResponse.json({ 
        error: 'Failed to get user profile',
        testUserId 
      }, { status: 404 });
    }

    // Get Trinity data from Deep Repo
    const trinity = await DeepRepoService.getTrinity(testUserId);
    
    // If no Trinity exists, create sample data
    if (!trinity) {
      const sampleTrinity = {
        quest: "Build revolutionary technology that empowers human potential",
        service: "Create AI systems that amplify creativity and solve complex problems",
        pledge: "Deliver ethical, transparent, and transformative solutions",
        type: 'F' as const,
        typeDescription: 'Foundation Quest - My core identity remains constant',
        questSeal: `seal-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        focus: {
          quest: 40,
          service: 35,
          pledge: 25
        },
        coachingPreferences: {
          methodology: 'SMART',
          tone: 'professional'
        }
      };

      // Save sample Trinity
      await DeepRepoService.saveTrinity(testUserId, sampleTrinity);
      
      return NextResponse.json({
        message: 'Created sample Trinity data',
        userId: testUserId,
        trinity: sampleTrinity,
        profile: {
          ...profile,
          deepRepo: { trinity: sampleTrinity }
        },
        visualization: {
          nodes: [
            {
              id: 'trinity-core',
              name: 'Trinity Core',
              group: 'trinity',
              color: '#FFD700', // Gold
              size: 30,
              x: 0,
              y: 0,
              z: 0
            },
            {
              id: 'quest',
              name: 'Quest',
              group: 'trinity-element',
              color: '#FF6B6B',
              size: 20,
              x: 50,
              y: 0,
              z: 0,
              value: sampleTrinity.quest
            },
            {
              id: 'service',
              name: 'Service',
              group: 'trinity-element',
              color: '#4ECDC4',
              size: 20,
              x: -25,
              y: 43,
              z: 0,
              value: sampleTrinity.service
            },
            {
              id: 'pledge',
              name: 'Pledge',
              group: 'trinity-element',
              color: '#45B7D1',
              size: 20,
              x: -25,
              y: -43,
              z: 0,
              value: sampleTrinity.pledge
            }
          ],
          links: [
            { source: 'trinity-core', target: 'quest' },
            { source: 'trinity-core', target: 'service' },
            { source: 'trinity-core', target: 'pledge' },
            { source: 'quest', target: 'service' },
            { source: 'service', target: 'pledge' },
            { source: 'pledge', target: 'quest' }
          ]
        }
      });
    }

    // Return existing Trinity with visualization data
    return NextResponse.json({
      userId: testUserId,
      trinity,
      profile,
      visualization: {
        nodes: [
          {
            id: 'trinity-core',
            name: 'Trinity Core',
            group: 'trinity',
            color: '#FFD700',
            size: 30,
            x: 0,
            y: 0,
            z: 0
          },
          {
            id: 'quest',
            name: 'Quest',
            group: 'trinity-element',
            color: '#FF6B6B',
            size: 20,
            x: 50,
            y: 0,
            z: 0,
            value: trinity.quest
          },
          {
            id: 'service',
            name: 'Service',
            group: 'trinity-element',
            color: '#4ECDC4',
            size: 20,
            x: -25,
            y: 43,
            z: 0,
            value: trinity.service
          },
          {
            id: 'pledge',
            name: 'Pledge',
            group: 'trinity-element',
            color: '#45B7D1',
            size: 20,
            x: -25,
            y: -43,
            z: 0,
            value: trinity.pledge
          }
        ],
        links: [
          { source: 'trinity-core', target: 'quest' },
          { source: 'trinity-core', target: 'service' },
          { source: 'trinity-core', target: 'pledge' },
          { source: 'quest', target: 'service' },
          { source: 'service', target: 'pledge' },
          { source: 'pledge', target: 'quest' }
        ]
      }
    });
  } catch (error) {
    console.error('Deep Repo visualization error:', error);
    return NextResponse.json({ 
      error: 'Failed to get Trinity visualization data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}