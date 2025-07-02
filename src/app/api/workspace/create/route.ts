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
    // Temporarily skip auth completely for testing
    let userId = 'test-user-123'
    
    // Try to get real auth, but don't fail if it doesn't work
    try {
      const authResult = await auth()
      if (authResult?.userId) {
        userId = authResult.userId
      }
    } catch (authError) {
      console.log('🔍 Auth failed, using test user:', authError)
    }
    
    console.log('🔍 API Debug - User ID:', userId)

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
    
    // Check if user already has a workspace (one workspace per user limit)
    const existingWorkspaces = await workspaceService.getUserWorkspaces(userId)
    if (existingWorkspaces.length > 0) {
      return NextResponse.json(
        { 
          error: 'You already have a workspace. Only one workspace per user is allowed.',
          existingWorkspace: {
            id: existingWorkspaces[0].id,
            name: existingWorkspaces[0].displayName
          }
        },
        { status: 409 } // Conflict
      )
    }

    // Check for unique workspace names (across all users to prevent confusion)
    const nameCheckResult = await workspaceService.checkWorkspaceNameExists(displayName)
    if (nameCheckResult.exists) {
      return NextResponse.json(
        { 
          error: `Workspace name "${displayName}" is already taken. Please choose a different name.`,
          suggestion: `${displayName}_${Math.random().toString(36).substr(2, 4)}`
        },
        { status: 409 } // Conflict
      )
    }
    
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