/**
 * Map Clerk user to database user and create if needed
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    let authResult
    try {
      authResult = await auth()
    } catch (error) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'Please log in with Clerk'
      }, { status: 401 })
    }

    const { userId: clerkUserId } = authResult
    if (!clerkUserId) {
      return NextResponse.json({
        error: 'No user found',
        details: 'Not authenticated'
      }, { status: 401 })
    }

    // Check if user exists in our database
    const existingUser = await sql`
      SELECT * FROM users WHERE id = ${clerkUserId}
    `

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        success: true,
        user: existingUser.rows[0],
        action: 'found_existing'
      })
    }

    // Create new user with Dan Keegan profile for keegan.dan@gmail.com
    await sql`
      INSERT INTO users (
        id, 
        email, 
        name, 
        full_name,
        first_name,
        last_name,
        "current_role",
        company,
        department,
        seniority_level,
        years_experience,
        skills,
        professional_goals,
        industry
      ) VALUES (
        ${clerkUserId},
        'keegan.dan@gmail.com',
        'Dan Keegan',
        'Dan Keegan',
        'Dan',
        'Keegan',
        'Entrepreneur/Consultant',
        'CKDelta',
        'Leadership',
        'senior',
        15,
        ARRAY['Leadership', 'Strategy', 'AI/ML', 'Business Development', 'Team Building'],
        'Build and scale Quest AI platform to help professionals advance their careers through personalized AI coaching',
        'Technology/Consulting'
      )
    `

    const newUser = await sql`
      SELECT * FROM users WHERE id = ${clerkUserId}
    `

    return NextResponse.json({
      success: true,
      user: newUser.rows[0],
      action: 'created_new',
      clerk_user_id: clerkUserId
    })

  } catch (error) {
    console.error('❌ Error mapping user:', error)
    
    return NextResponse.json({
      error: 'Failed to map user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Just check current auth status
    let authResult
    try {
      authResult = await auth()
    } catch (error) {
      return NextResponse.json({
        authenticated: false,
        error: 'No auth available'
      })
    }

    const { userId: clerkUserId } = authResult

    if (!clerkUserId) {
      return NextResponse.json({
        authenticated: false,
        user_id: null
      })
    }

    // Check if user exists in database
    const user = await sql`
      SELECT id, email, name, company, "current_role" FROM users WHERE id = ${clerkUserId}
    `

    return NextResponse.json({
      authenticated: true,
      clerk_user_id: clerkUserId,
      database_user: user.rows[0] || null,
      needs_creation: user.rows.length === 0
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check user status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}