import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    // Try to get real auth
    let authData = null
    let error = null
    
    try {
      authData = await auth()
    } catch (authError) {
      error = authError instanceof Error ? authError.message : 'Auth failed'
    }
    
    return NextResponse.json({
      success: true,
      authData,
      error,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}