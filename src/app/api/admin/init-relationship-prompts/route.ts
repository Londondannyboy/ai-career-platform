import { NextRequest, NextResponse } from 'next/server'
import { relationshipPromptManager } from '@/lib/prompts/relationshipPrompts'

export async function POST(request: NextRequest) {
  try {
    console.log('🤝 Initializing relationship-aware coaching prompts...')
    
    await relationshipPromptManager.initializeRelationshipPrompts()
    
    return NextResponse.json({
      success: true,
      message: 'Relationship-aware coaching prompts initialized successfully',
      promptTypes: [
        'Upward Coaching - Manager Relationship',
        'Upward Coaching - Executive Influence', 
        'Peer Coaching - Cross-Functional Collaboration',
        'Peer Coaching - Competitive Dynamics',
        'Downward Coaching - Team Development',
        'Downward Coaching - Performance Management',
        'External Coaching - Client Relationship Management',
        'Self-Coaching - Personal Leadership Development',
        'Startup Relationship Dynamics',
        'Enterprise Relationship Navigation'
      ]
    })
    
  } catch (error) {
    console.error('❌ Error initializing relationship prompts:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize relationship prompts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}