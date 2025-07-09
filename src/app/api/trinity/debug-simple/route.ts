import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Simple debug endpoint that bypasses Clerk auth
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json({ 
        error: "Email required", 
        usage: "Add ?email=your-email to the URL" 
      }, { status: 400 });
    }

    // First, find user by email in users table
    const userResult = await sql`
      SELECT id, email, name, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No user found with that email",
        email: email
      });
    }

    const user = userResult.rows[0];

    // Then find Trinity statements for this user
    const trinityResult = await sql`
      SELECT * FROM trinity_statements
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      trinityCount: trinityResult.rows.length,
      trinities: trinityResult.rows,
      hasActiveTrinity: trinityResult.rows.some(t => t.is_active),
      activeTrinity: trinityResult.rows.find(t => t.is_active) || null,
      debug: {
        searchEmail: email,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Trinity debug error:", error);
    return NextResponse.json({
      error: "Failed to debug trinity",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
