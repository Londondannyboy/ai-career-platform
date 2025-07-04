import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Mailtrap email service...')
    
    // Test basic email sending
    const result = await emailService.sendWelcomeEmail(
      'test@quest.ai',
      'Test User',
      'Quest AI'
    )

    console.log('Email test result:', result)

    return NextResponse.json({
      success: true,
      message: 'Email test completed',
      result
    })
  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}