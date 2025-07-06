/**
 * Simple database initialization - one step at a time for debugging
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const results = {
    extension: false,
    users: false,
    conversations: false,
    relationships: false,
    goals: false,
    skills: false,
    user_created: false,
    errors: [] as string[]
  }

  try {
    // Step 1: Create extension
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
      results.extension = true
    } catch (e) {
      results.errors.push(`Extension: ${e}`)
    }

    // Step 2: Create users table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          full_name TEXT,
          first_name TEXT,
          last_name TEXT,
          profile_image_url TEXT,
          "current_role" TEXT,
          company TEXT,
          department TEXT,
          seniority_level TEXT DEFAULT 'mid',
          years_experience INTEGER DEFAULT 0,
          skills TEXT[] DEFAULT '{}',
          professional_goals TEXT,
          career_interests TEXT[],
          industry TEXT,
          linkedin_url TEXT,
          linkedin_data JSONB DEFAULT '{}',
          coaching_preferences JSONB DEFAULT '{}',
          privacy_settings JSONB DEFAULT '{"profile_visible": true, "share_insights": true}',
          is_active BOOLEAN DEFAULT true,
          last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      results.users = true
    } catch (e) {
      results.errors.push(`Users table: ${e}`)
    }

    // Step 3: Create Dan Keegan user
    if (results.users) {
      try {
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
            'user_2cNjk7xDvHPeCKhDLxH0GBMqVzI',
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
          ) ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            "current_role" = EXCLUDED."current_role",
            company = EXCLUDED.company,
            updated_at = NOW()
        `
        results.user_created = true
      } catch (e) {
        results.errors.push(`User creation: ${e}`)
      }
    }

    // Step 4: Create conversation_sessions table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS conversation_sessions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          session_id TEXT NOT NULL,
          session_type TEXT DEFAULT 'quest_conversation',
          transcript TEXT,
          ai_response TEXT,
          emotional_context JSONB DEFAULT '{}',
          conversation_metadata JSONB DEFAULT '{}',
          topics_discussed TEXT[],
          insights_generated TEXT[],
          action_items TEXT[],
          mood_assessment TEXT,
          duration_seconds INTEGER DEFAULT 0,
          platform TEXT DEFAULT 'web',
          voice_enabled BOOLEAN DEFAULT false,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ended_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `
      results.conversations = true
    } catch (e) {
      results.errors.push(`Conversations table: ${e}`)
    }

    // Return results
    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message: results.errors.length === 0 
        ? 'Database initialized successfully!' 
        : 'Partial initialization - check errors'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'conversation_sessions')
      ORDER BY table_name
    `

    // Check if Dan exists
    let danExists = false
    try {
      const danCheck = await sql`
        SELECT id, name, company FROM users WHERE email = 'keegan.dan@gmail.com'
      `
      danExists = danCheck.rows.length > 0
    } catch (e) {
      // Table might not exist
    }

    return NextResponse.json({
      success: true,
      tables: tables.rows.map(r => r.table_name),
      dan_exists: danExists,
      ready: tables.rows.length >= 2 && danExists
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check database status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}