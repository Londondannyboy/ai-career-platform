/**
 * Debug endpoint to check users in database
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Get all users
    const users = await sql`
      SELECT 
        id, 
        email, 
        name, 
        company, 
        "current_role",
        created_at
      FROM users 
      ORDER BY created_at DESC
    `

    // Get recent conversations
    const conversations = await sql`
      SELECT 
        user_id,
        session_id,
        substring(transcript, 1, 100) as transcript_preview,
        created_at
      FROM conversation_sessions
      ORDER BY created_at DESC
      LIMIT 5
    `

    // Check for Sarah specifically
    const sarahCheck = await sql`
      SELECT * FROM users 
      WHERE LOWER(name) LIKE '%sarah%' 
      OR LOWER(email) LIKE '%sarah%'
    `

    return NextResponse.json({
      user_count: users.rows.length,
      users: users.rows,
      recent_conversations: conversations.rows,
      sarah_found: sarahCheck.rows.length > 0,
      sarah_data: sarahCheck.rows
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to query database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}