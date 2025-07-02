import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDocumentProcessor, DocumentType } from '@/lib/documents/documentProcessor'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * POST /api/documents/search
 * Search documents across user's workspaces using vector similarity
 */
export async function POST(request: Request) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      query, 
      workspaceId, 
      documentTypes, 
      limit = 10, 
      threshold = 0.7 
    } = body

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Search query too long. Maximum 500 characters allowed.' },
        { status: 400 }
      )
    }

    // Validate parameters
    if (limit > 50) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 50 results' },
        { status: 400 }
      )
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: 'Threshold must be between 0 and 1' },
        { status: 400 }
      )
    }

    console.log(`🔍 Searching documents: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`)

    const workspaceService = getWorkspaceService()
    const documentProcessor = getDocumentProcessor()

    // If specific workspace provided, search within it
    if (workspaceId) {
      // Verify access to workspace
      const workspace = await workspaceService.getWorkspace(workspaceId, userId)
      if (!workspace) {
        return NextResponse.json(
          { error: 'Workspace not found or access denied' },
          { status: 404 }
        )
      }

      const searchResults = await documentProcessor.searchDocuments(
        query.trim(),
        workspaceId,
        {
          limit,
          threshold,
          documentTypes: documentTypes as DocumentType[]
        }
      )

      console.log(`✅ Found ${searchResults.length} results in workspace ${workspaceId}`)

      return NextResponse.json({
        success: true,
        results: searchResults,
        metadata: {
          query: query.trim(),
          workspaceId,
          totalResults: searchResults.length,
          searchParams: { limit, threshold, documentTypes },
          timestamp: new Date().toISOString()
        }
      })
    }

    // Search across all user's workspaces
    const userWorkspaces = await workspaceService.getUserWorkspaces(userId)
    
    if (userWorkspaces.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        metadata: {
          query: query.trim(),
          totalResults: 0,
          message: 'No workspaces found for user',
          timestamp: new Date().toISOString()
        }
      })
    }

    // Search in each workspace and combine results
    const allResults = []
    
    for (const workspace of userWorkspaces) {
      try {
        const workspaceResults = await documentProcessor.searchDocuments(
          query.trim(),
          workspace.id,
          {
            limit: Math.ceil(limit / userWorkspaces.length), // Distribute limit across workspaces
            threshold,
            documentTypes: documentTypes as DocumentType[]
          }
        )

        // Add workspace context to results
        const resultsWithWorkspace = workspaceResults.map(result => ({
          ...result,
          workspaceId: workspace.id,
          workspaceName: workspace.displayName,
          companyName: workspace.companyName
        }))

        allResults.push(...resultsWithWorkspace)
      } catch (error) {
        console.warn(`⚠️ Failed to search workspace ${workspace.id}:`, error)
        // Continue with other workspaces
      }
    }

    // Sort all results by similarity and limit
    allResults.sort((a, b) => b.maxSimilarity - a.maxSimilarity)
    const limitedResults = allResults.slice(0, limit)

    console.log(`✅ Found ${limitedResults.length} total results across ${userWorkspaces.length} workspaces`)

    return NextResponse.json({
      success: true,
      results: limitedResults,
      metadata: {
        query: query.trim(),
        totalResults: limitedResults.length,
        workspacesSearched: userWorkspaces.length,
        searchParams: { limit, threshold, documentTypes },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Document search failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to search documents',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/documents/search
 * Get search configuration and capabilities
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    endpoint: 'POST /api/documents/search',
    description: 'Vector-based document search across user workspaces',
    capabilities: [
      'Semantic similarity search using embeddings',
      'Multi-workspace search support',
      'Document type filtering',
      'Configurable similarity threshold',
      'Chunked content matching'
    ],
    parameters: {
      required: ['query'],
      optional: ['workspaceId', 'documentTypes', 'limit', 'threshold'],
      limits: {
        queryLength: 500,
        maxResults: 50,
        thresholdRange: [0, 1]
      }
    },
    supportedDocumentTypes: [
      'product_spec',
      'sales_deck', 
      'case_study',
      'pricing',
      'competitor_analysis',
      'proposal',
      'whitepaper'
    ]
  })
}