import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDocumentProcessor, DocumentMetadata } from '@/lib/documents/documentProcessor'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * POST /api/workspace/[workspaceId]/upload
 * Upload and process documents in a workspace
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { workspaceId } = await context.params

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const documentType = formData.get('documentType') as string
    const accessLevel = formData.get('accessLevel') as string
    const companyId = formData.get('companyId') as string
    const tags = formData.get('tags') as string

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      )
    }

    // Verify workspace access
    const workspaceService = getWorkspaceService()
    const workspace = await workspaceService.getWorkspace(workspaceId, userId)
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`📤 Uploading document: ${file.name} to workspace ${workspaceId}`)

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PDF, TXT, DOCX, PPTX` },
        { status: 400 }
      )
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: 50MB` },
        { status: 400 }
      )
    }

    // Prepare document metadata
    const metadata: DocumentMetadata = {
      title: title || file.name,
      type: documentType as any,
      companyId: companyId || workspace.companyName,
      workspaceId,
      userId,
      accessLevel: (accessLevel as any) || 'team',
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    }

    // Process document
    const documentProcessor = getDocumentProcessor()
    const processedDoc = await documentProcessor.processDocument(file, metadata)

    // Store in database
    await documentProcessor.storeDocument(processedDoc)

    console.log(`✅ Successfully processed and stored document: ${processedDoc.id}`)

    return NextResponse.json({
      success: true,
      document: {
        id: processedDoc.id,
        title: processedDoc.metadata.title,
        type: processedDoc.metadata.type,
        extractedEntities: processedDoc.extractedEntities,
        autoTags: processedDoc.autoTags,
        processingTime: processedDoc.processingTime
      },
      message: 'Document uploaded and processed successfully'
    })

  } catch (error) {
    console.error('❌ Document upload failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/workspace/[workspaceId]/upload
 * Get upload configuration and limits
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  return NextResponse.json({
    status: 'operational',
    endpoint: 'POST /api/workspace/[workspaceId]/upload',
    allowedFileTypes: [
      { type: 'application/pdf', extension: '.pdf', name: 'PDF Document' },
      { type: 'text/plain', extension: '.txt', name: 'Text File' },
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: '.docx', name: 'Word Document' },
      { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extension: '.pptx', name: 'PowerPoint Presentation' }
    ],
    maxFileSize: '50MB',
    requiredFields: ['file', 'documentType'],
    optionalFields: ['title', 'accessLevel', 'companyId', 'tags'],
    documentTypes: [
      'product_spec',
      'sales_deck', 
      'case_study',
      'pricing',
      'competitor_analysis',
      'proposal',
      'whitepaper'
    ],
    accessLevels: ['private', 'team', 'company', 'public']
  })
}