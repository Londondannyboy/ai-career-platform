import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

// Direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

/**
 * POST /api/workspace/[workspaceId]/upload-simple
 * Simple document upload without AI processing (for debugging)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    console.log('🔍 Simple upload route called')
    
    // Use same auth fallback pattern
    let userId = 'test-user-123'
    
    try {
      const authResult = await auth()
      if (authResult?.userId) {
        userId = authResult.userId
      }
    } catch (authError) {
      console.log('🔍 Upload auth failed, using test user:', authError)
    }
    
    console.log('🔍 Upload - User ID:', userId)

    const { workspaceId } = await context.params

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const documentType = formData.get('documentType') as string || 'whitepaper'

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📤 Simple upload: ${file.name} (${file.size} bytes) to workspace ${workspaceId}`)

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

    // Validate file size (10MB limit for testing)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: 10MB` },
        { status: 400 }
      )
    }

    // Simple text extraction (no AI processing)
    let content = ''
    if (file.type === 'text/plain') {
      content = await file.text()
    } else {
      content = `[${file.type} file: ${file.name}] - Content extraction would happen here in production.`
    }

    const contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '')
    console.log('📝 Content preview:', contentPreview)

    // Generate simple document ID
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store in database WITHOUT embeddings (for testing)
    const query = `
      INSERT INTO company_documents (
        id, workspace_id, title, full_content, content_preview, 
        document_type, file_type, file_size, uploaded_by,
        tags, auto_tags, access_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, document_type, created_at
    `
    
    const values = [
      documentId,
      workspaceId,
      title || file.name,
      content,
      contentPreview,
      documentType,
      file.type,
      file.size,
      userId,
      JSON.stringify([]), // Empty tags
      JSON.stringify(['uploaded']), // Simple auto-tag
      'team'
    ]
    
    const client = await pool.connect()
    let result
    try {
      result = await client.query(query, values)
    } finally {
      client.release()
    }

    const document = result.rows[0]
    console.log(`✅ Simple upload successful: ${documentId}`)

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.document_type,
        createdAt: document.created_at
      },
      message: 'Document uploaded successfully (simple mode)'
    })

  } catch (error) {
    console.error('❌ Simple upload failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}