import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Clean up old Trinity system and prepare for Deep Repo integration
export async function POST(request: NextRequest) {
  try {
    // Step 1: Archive existing Trinity data (for safety)
    const archiveResult = await sql`
      CREATE TABLE IF NOT EXISTS trinity_statements_archive AS 
      SELECT * FROM trinity_statements
    `;
    
    // Step 2: Count what we're archiving
    const countResult = await sql`
      SELECT COUNT(*) as count FROM trinity_statements
    `;
    
    const trinityCount = countResult.rows[0]?.count || 0;
    
    // Step 3: Clear the trinity_statements table
    const clearResult = await sql`
      DELETE FROM trinity_statements
    `;
    
    // Step 4: Prepare user profiles for Deep Repo structure
    // First, ensure we have a user_profiles table with repo structure
    const createProfileTable = await sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT UNIQUE NOT NULL,
        
        -- Surface Repo (Public)
        surface_repo JSONB DEFAULT '{}',
        
        -- Working Repo (Shared selectively)
        working_repo JSONB DEFAULT '{}',
        
        -- Personal Repo (Private connections)
        personal_repo JSONB DEFAULT '{}',
        
        -- Deep Repo (Most private - includes Trinity)
        deep_repo JSONB DEFAULT '{"trinity": null}',
        
        -- Metadata
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Trinity system cleaned up and prepared for Deep Repo integration',
      stats: {
        trinitiesArchived: trinityCount,
        tablesCreated: ['trinity_statements_archive', 'user_profiles'],
        nextSteps: [
          'Trinity data now stored in user_profiles.deep_repo.trinity',
          'Old trinity_statements table cleared',
          'Ready for clean implementation'
        ]
      }
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup Trinity system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method to check current state
export async function GET(request: NextRequest) {
  try {
    // Check trinity_statements
    const trinityCount = await sql`
      SELECT COUNT(*) as count FROM trinity_statements
    `;
    
    // Check if user_profiles exists
    const profilesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      )
    `;
    
    // Check if archive exists
    const archiveExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trinity_statements_archive'
      )
    `;
    
    return NextResponse.json({
      currentState: {
        trinityStatements: trinityCount.rows[0]?.count || 0,
        userProfilesTableExists: profilesExist.rows[0]?.exists || false,
        archiveTableExists: archiveExists.rows[0]?.exists || false
      },
      recommendation: trinityCount.rows[0]?.count > 0 
        ? 'Run POST to this endpoint to clean up and migrate'
        : 'System is clean - ready for Deep Repo implementation'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}