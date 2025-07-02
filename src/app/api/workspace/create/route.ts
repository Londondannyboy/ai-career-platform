import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * POST /api/workspace/create
 * Create a new company workspace
 */
export async function POST(request: Request) {
  try {
    // Temporarily skip auth for testing
    const authResult = await auth()
    const userId = authResult?.userId || 'test-user-123'
    
    console.log('🔍 API Debug - User ID:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { companyName, displayName, description, accessLevel } = body

    // Validate required fields
    if (!companyName || !displayName) {
      return NextResponse.json(
        { error: 'Company name and display name are required' },
        { status: 400 }
      )
    }

    console.log(`🏢 Creating workspace for ${companyName} by user ${userId}`)

    const workspaceService = getWorkspaceService()
    
    const workspace = await workspaceService.createWorkspace({
      companyName,
      displayName,
      description,
      ownerId: userId,
      accessLevel: accessLevel || 'private'
    })

    console.log(`✅ Created workspace: ${workspace.id}`)

    return NextResponse.json({
      success: true,
      workspace
    })

  } catch (error) {
    console.error('❌ Workspace creation failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create workspace',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspace/create
 * Get workspace creation form configuration
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    endpoint: 'POST /api/workspace/create',
    requiredFields: ['companyName', 'displayName'],
    optionalFields: ['description', 'accessLevel'],
    accessLevels: ['private', 'team', 'company', 'public'],
    defaultAccessLevel: 'private'
  })
}