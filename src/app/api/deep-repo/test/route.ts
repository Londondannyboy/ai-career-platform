import { NextRequest, NextResponse } from 'next/server';
import { DeepRepoService } from '@/lib/profile/deepRepoService';

// Test endpoints for Deep Repo without auth
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const userId = searchParams.get('userId') || 'test-user-123';
    
    switch (action) {
      case 'status':
        const profile = await DeepRepoService.getUserProfile(userId);
        return NextResponse.json({
          success: true,
          hasProfile: !!profile,
          profile
        });
        
      case 'create-test':
        // Create a test Trinity in Deep Repo
        const testTrinity = {
          quest: "To revolutionize how professionals discover their authentic purpose",
          service: "I create transformative AI-powered coaching experiences",
          pledge: "I commit to empowering every person to find meaningful work",
          type: 'F' as const,
          questSeal: 'test-seal-123',
          createdAt: new Date(),
          updatedAt: new Date(),
          focus: {
            quest: 40,
            service: 30,
            pledge: 30
          },
          coachingPreferences: {
            methodology: 'GROW',
            tone: 'supportive'
          }
        };
        
        const saved = await DeepRepoService.saveTrinity(userId, testTrinity);
        
        // Also add some test data to other layers
        await DeepRepoService.mergeRepoLayer(userId, 'surface', {
          professional_headline: 'Senior Software Engineer',
          summary: 'Building the future of professional identity',
          current_role: 'Founder',
          current_company: 'Quest',
          core_skills: ['TypeScript', 'React', 'AI/ML', 'Voice Interfaces']
        });
        
        await DeepRepoService.mergeRepoLayer(userId, 'working', {
          achievements: [
            {
              title: 'Built Voice AI Coaching System',
              impact: 'Enabled 1000+ professionals to find their purpose',
              date: '2025-01'
            }
          ],
          portfolio: [
            {
              title: 'Quest Trinity Platform',
              description: 'Revolutionary professional identity system',
              url: 'https://quest.app'
            }
          ]
        });
        
        await DeepRepoService.mergeRepoLayer(userId, 'personal', {
          goals: [
            {
              title: 'Launch Quest to 10,000 users',
              timeline: 'Q2 2025',
              progress: 25
            }
          ],
          okrs: [
            {
              objective: 'Create the best professional identity platform',
              keyResults: [
                'Achieve 95% user satisfaction',
                'Enable 1M Trinity connections',
                'Build 50 AI coaches'
              ]
            }
          ]
        });
        
        const updatedProfile = await DeepRepoService.getUserProfile(userId);
        
        return NextResponse.json({
          success: saved,
          message: 'Test profile created with all layers',
          profile: updatedProfile
        });
        
      case 'get-trinity':
        const trinity = await DeepRepoService.getTrinity(userId);
        return NextResponse.json({
          success: true,
          trinity
        });
        
      case 'get-layer':
        const layer = searchParams.get('layer') as any || 'deep';
        const data = await DeepRepoService.getRepoLayer(userId, layer);
        return NextResponse.json({
          success: true,
          layer,
          data
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['status', 'create-test', 'get-trinity', 'get-layer']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Deep Repo test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}