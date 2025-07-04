import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { emailService } from '@/lib/email/service'
import { ConnectionType } from '@/lib/email/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'send_connection_invite': {
        const result = await emailService.sendConnectionInvite({
          senderId: userId,
          senderName: params.senderName,
          senderCompany: params.senderCompany,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          connectionType: params.connectionType as ConnectionType,
          personalizedMessage: params.personalizedMessage
        })
        
        return NextResponse.json(result)
      }

      case 'send_verification': {
        const result = await emailService.sendVerificationEmail(
          userId,
          params.userName,
          params.companyName,
          params.companyEmail
        )
        
        return NextResponse.json(result)
      }

      case 'send_external_invite': {
        const result = await emailService.sendExternalInvite(
          params.senderName,
          params.senderCompany,
          params.recipientEmail,
          params.recipientName,
          params.personalizedMessage
        )
        
        return NextResponse.json(result)
      }

      case 'verify_code': {
        const result = await emailService.verifyCompanyEmail(
          userId,
          params.code
        )
        
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    )
  }
}