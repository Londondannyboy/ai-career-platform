/**
 * Initialize Trinity Database Tables
 * Creates all Trinity system tables and functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔺 Initializing Trinity database schema...');

    // Enable UUID extension first
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    console.log('✅ UUID extension enabled');

    // Create users table first (required for Trinity foreign keys)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,  -- Clerk user ID
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        full_name TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        
        -- Professional context
        "current_role" TEXT,
        company TEXT,
        department TEXT,
        seniority_level TEXT DEFAULT 'mid',
        years_experience INTEGER DEFAULT 0,
        
        -- Skills and goals
        skills TEXT[] DEFAULT '{}',
        professional_goals TEXT,
        career_interests TEXT[],
        industry TEXT,
        
        -- LinkedIn integration
        linkedin_url TEXT,
        linkedin_data JSONB DEFAULT '{}',
        
        -- Preferences
        coaching_preferences JSONB DEFAULT '{}',
        privacy_settings JSONB DEFAULT '{"profile_visible": true, "share_insights": true}',
        
        -- System fields
        is_active BOOLEAN DEFAULT true,
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Users table created');

    // Create Trinity Statements Core Table
    await sql`
      CREATE TABLE IF NOT EXISTS trinity_statements (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- The Three Eternal Questions
        quest TEXT NOT NULL CHECK (length(trim(quest)) >= 10 AND length(trim(quest)) <= 500),
        service TEXT NOT NULL CHECK (length(trim(service)) >= 10 AND length(trim(service)) <= 500), 
        pledge TEXT NOT NULL CHECK (length(trim(pledge)) >= 10 AND length(trim(pledge)) <= 500),
        
        -- Foundation Quest Type
        trinity_type CHAR(1) NOT NULL CHECK (trinity_type IN ('F', 'L', 'M')), -- Foundation/Living/Mixed
        trinity_type_description TEXT NOT NULL, -- User's chosen explanation
        
        -- Quest Seal (Cryptographic Commitment)
        quest_seal VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of Trinity + timestamp
        quest_seal_algorithm VARCHAR(20) DEFAULT 'SHA-256',
        
        -- Ritual Context
        ritual_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ritual_session_id UUID, -- Link to conversation session if voice-created
        ritual_duration_seconds INTEGER DEFAULT 0,
        
        -- Status and Evolution
        is_active BOOLEAN DEFAULT TRUE,
        version_number INTEGER DEFAULT 1,
        previous_version_id UUID REFERENCES trinity_statements(id),
        
        -- Privacy Controls
        visibility_level TEXT DEFAULT 'private' CHECK (visibility_level IN ('private', 'network', 'public')),
        shared_with_coaches BOOLEAN DEFAULT TRUE,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Trinity statements table created');

    // Create unique constraint for one active Trinity per user
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_trinity_statements_user_active 
      ON trinity_statements(user_id) 
      WHERE is_active = TRUE
    `;
    console.log('✅ Active Trinity uniqueness constraint created');

    // Create Trinity Coaching Preferences Table
    await sql`
      CREATE TABLE IF NOT EXISTS trinity_coaching_preferences (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
        
        -- Trinity Focus Distribution (must sum to 100)
        quest_focus INTEGER NOT NULL DEFAULT 34 CHECK (quest_focus >= 0 AND quest_focus <= 100),
        service_focus INTEGER NOT NULL DEFAULT 33 CHECK (service_focus >= 0 AND service_focus <= 100),
        pledge_focus INTEGER NOT NULL DEFAULT 33 CHECK (pledge_focus >= 0 AND pledge_focus <= 100),
        
        -- Coaching Methodology
        coaching_methodology TEXT DEFAULT 'balanced' CHECK (coaching_methodology IN ('okr', 'smart', 'grow', 'clear', 'fast', 'balanced')),
        coaching_tone TEXT DEFAULT 'supportive' CHECK (coaching_tone IN ('direct', 'supportive', 'challenging', 'empathetic', 'analytical')),
        
        -- Context Awareness
        context_awareness_level TEXT DEFAULT 'high' CHECK (context_awareness_level IN ('low', 'medium', 'high')),
        voice_enabled BOOLEAN DEFAULT TRUE,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure focus percentages sum to 100
        CHECK (quest_focus + service_focus + pledge_focus = 100)
      )
    `;
    console.log('✅ Trinity coaching preferences table created');

    // Create Trinity Evolution History Table
    await sql`
      CREATE TABLE IF NOT EXISTS trinity_evolution_history (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
        
        -- Change tracking
        change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'evolved', 'activated', 'deactivated')),
        field_changed TEXT, -- which field was changed (quest, service, pledge, etc.)
        previous_value TEXT, -- previous value if applicable
        new_value TEXT, -- new value if applicable
        
        -- Change context
        change_reason TEXT,
        triggered_by TEXT DEFAULT 'user' CHECK (triggered_by IN ('user', 'system', 'ai_suggestion', 'coach_guidance')),
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Trinity evolution history table created');

    // Create Trinity Content Moderation Table
    await sql`
      CREATE TABLE IF NOT EXISTS trinity_content_moderation (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
        
        -- Moderation status
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected', 'under_review')),
        moderation_type TEXT DEFAULT 'automated' CHECK (moderation_type IN ('automated', 'human', 'community')),
        
        -- AI Analysis
        ai_toxicity_score DECIMAL(5,4) DEFAULT 0.0000 CHECK (ai_toxicity_score >= 0 AND ai_toxicity_score <= 1),
        ai_flags JSONB DEFAULT '[]', -- JSON array of detected issues
        ai_confidence DECIMAL(5,4) DEFAULT 0.0000,
        
        -- Human Review
        human_reviewer_id TEXT REFERENCES users(id),
        human_review_notes TEXT,
        human_review_date TIMESTAMP WITH TIME ZONE,
        
        -- Community Feedback
        community_reports INTEGER DEFAULT 0,
        community_approvals INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Trinity content moderation table created');

    // Create Trinity Compatibility Table
    await sql`
      CREATE TABLE IF NOT EXISTS trinity_compatibility (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trinity_a_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
        trinity_b_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
        
        -- Compatibility Scores
        overall_compatibility DECIMAL(5,4) DEFAULT 0.0000 CHECK (overall_compatibility >= 0 AND overall_compatibility <= 1),
        quest_alignment DECIMAL(5,4) DEFAULT 0.0000 CHECK (quest_alignment >= 0 AND quest_alignment <= 1),
        service_synergy DECIMAL(5,4) DEFAULT 0.0000 CHECK (service_synergy >= 0 AND service_synergy <= 1),
        pledge_harmony DECIMAL(5,4) DEFAULT 0.0000 CHECK (pledge_harmony >= 0 AND pledge_harmony <= 1),
        
        -- Calculation Details
        calculation_method TEXT DEFAULT 'semantic_similarity',
        calculation_version INTEGER DEFAULT 1,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure no duplicate pairs
        UNIQUE(user_a_id, user_b_id)
      )
    `;
    console.log('✅ Trinity compatibility table created');

    // Create Trinity Validation Function
    await sql`
      CREATE OR REPLACE FUNCTION validate_trinity_statement(
        p_quest TEXT,
        p_service TEXT,
        p_pledge TEXT
      ) RETURNS TABLE(
        is_valid BOOLEAN,
        validation_errors TEXT[]
      ) AS $$
      DECLARE
        errors TEXT[] := ARRAY[]::TEXT[];
      BEGIN
        -- Check quest length
        IF length(trim(p_quest)) < 10 THEN
          errors := array_append(errors, 'Quest must be at least 10 characters long');
        END IF;
        
        IF length(trim(p_quest)) > 500 THEN
          errors := array_append(errors, 'Quest must be no more than 500 characters long');
        END IF;
        
        -- Check service length
        IF length(trim(p_service)) < 10 THEN
          errors := array_append(errors, 'Service must be at least 10 characters long');
        END IF;
        
        IF length(trim(p_service)) > 500 THEN
          errors := array_append(errors, 'Service must be no more than 500 characters long');
        END IF;
        
        -- Check pledge length
        IF length(trim(p_pledge)) < 10 THEN
          errors := array_append(errors, 'Pledge must be at least 10 characters long');
        END IF;
        
        IF length(trim(p_pledge)) > 500 THEN
          errors := array_append(errors, 'Pledge must be no more than 500 characters long');
        END IF;
        
        -- Return validation result
        RETURN QUERY SELECT (array_length(errors, 1) IS NULL), errors;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Trinity validation function created');

    // Create Quest Seal Generation Function
    await sql`
      CREATE OR REPLACE FUNCTION generate_quest_seal(
        p_quest TEXT,
        p_service TEXT,
        p_pledge TEXT,
        p_trinity_type CHAR(1),
        p_user_id TEXT
      ) RETURNS TEXT AS $$
      DECLARE
        seal_input TEXT;
        quest_seal TEXT;
      BEGIN
        -- Create input string for hashing
        seal_input := p_quest || '|' || p_service || '|' || p_pledge || '|' || p_trinity_type || '|' || p_user_id || '|' || NOW()::TEXT;
        
        -- Generate SHA-256 hash
        quest_seal := encode(digest(seal_input, 'sha256'), 'hex');
        
        RETURN quest_seal;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Quest seal generation function created');

    // Create indexes for performance
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_statements_user_id ON trinity_statements(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_statements_quest_seal ON trinity_statements(quest_seal)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_statements_trinity_type ON trinity_statements(trinity_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_statements_is_active ON trinity_statements(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_statements_created_at ON trinity_statements(created_at)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_coaching_preferences_user_id ON trinity_coaching_preferences(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_coaching_preferences_trinity_statement_id ON trinity_coaching_preferences(trinity_statement_id)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_evolution_history_user_id ON trinity_evolution_history(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_evolution_history_trinity_statement_id ON trinity_evolution_history(trinity_statement_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_evolution_history_created_at ON trinity_evolution_history(created_at)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_content_moderation_trinity_statement_id ON trinity_content_moderation(trinity_statement_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_content_moderation_status ON trinity_content_moderation(status)`;
    
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_user_a_id ON trinity_compatibility(user_a_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_user_b_id ON trinity_compatibility(user_b_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_overall_compatibility ON trinity_compatibility(overall_compatibility)`;
    
    console.log('✅ Trinity indexes created');

    // Verify all tables were created
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'trinity_%' OR table_name = 'users')
      ORDER BY table_name
    `;

    const tables = tableCheck.rows.map(row => row.table_name);
    console.log('✅ All tables verified:', tables);

    // Check if users table exists specifically
    const usersExists = tables.includes('users');
    const trinityTables = tables.filter(name => name.startsWith('trinity_'));
    
    console.log('✅ Users table exists:', usersExists);
    console.log('✅ Trinity tables count:', trinityTables.length);

    return NextResponse.json({
      success: true,
      message: 'Trinity database schema initialized successfully',
      tables: tables,
      usersTableExists: usersExists,
      trinityTablesCount: trinityTables.length,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
      postgresUrl: process.env.POSTGRES_URL ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('Trinity database initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Trinity database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}