import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'
import { processMCPEmailRequest } from '@/lib/email/mcp-integration'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { request: emailRequest, userCompany } = await request.json()

    // Build context from user session
    const context = {
      userId,
      userName: user.fullName || user.firstName || 'User',
      userEmail: user.emailAddresses?.[0]?.emailAddress || '',
      userCompany
    }

    // Process the natural language email request
    const result = await processMCPEmailRequest(emailRequest, context)

    return NextResponse.json(result)
  } catch (error) {
    console.error('MCP Email API error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process email request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}