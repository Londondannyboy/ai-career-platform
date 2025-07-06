/**
 * Initialize User System for Quest AI
 * Creates complete user profile schema and integrates with existing company data
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Initializing Quest User System...')

    // Execute the complete schema
    await sql`
      -- Enable UUID extension if not exists
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create user profiles table (Clerk integration)
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,  -- Clerk user ID
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        full_name TEXT,
        first_name TEXT,
        last_name TEXT,
        profile_image_url TEXT,
        
        -- Professional context
        current_role TEXT,
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
      );
    `

    await sql`
      -- Create conversation history table
      CREATE TABLE IF NOT EXISTS conversation_sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        session_type TEXT DEFAULT 'quest_conversation',
        
        -- Conversation data
        transcript TEXT,
        ai_response TEXT,
        emotional_context JSONB DEFAULT '{}',
        conversation_metadata JSONB DEFAULT '{}',
        
        -- Context and insights
        topics_discussed TEXT[],
        insights_generated TEXT[],
        action_items TEXT[],
        mood_assessment TEXT,
        
        -- Session info
        duration_seconds INTEGER DEFAULT 0,
        platform TEXT DEFAULT 'web',
        voice_enabled BOOLEAN DEFAULT false,
        
        -- Timestamps
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await sql`
      -- Create user-company relationships table
      CREATE TABLE IF NOT EXISTS user_company_relationships (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
        
        -- Relationship details
        relationship_type TEXT DEFAULT 'employee',
        role_at_company TEXT,
        department TEXT,
        start_date DATE,
        end_date DATE,
        is_current BOOLEAN DEFAULT true,
        
        -- Connection strength
        connection_strength INTEGER DEFAULT 1,
        interaction_frequency TEXT DEFAULT 'occasional',
        
        -- Metadata
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(user_id, company_id, role_at_company)
      );
    `

    await sql`
      -- Create user goals table
      CREATE TABLE IF NOT EXISTS user_goals (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Goal details
        goal_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATE,
        
        -- Progress tracking
        status TEXT DEFAULT 'active',
        progress_percentage INTEGER DEFAULT 0,
        milestones JSONB DEFAULT '[]',
        
        -- AI coaching context
        coaching_notes TEXT,
        recommended_actions TEXT[],
        related_skills TEXT[],
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await sql`
      -- Create user skills tracking table
      CREATE TABLE IF NOT EXISTS user_skills (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        
        -- Skill details
        skill_name TEXT NOT NULL,
        skill_category TEXT,
        proficiency_level INTEGER DEFAULT 3,
        years_experience DECIMAL(3,1) DEFAULT 0,
        
        -- Evidence and validation
        evidence_sources TEXT[],
        last_used_date DATE,
        improvement_goals TEXT,
        
        -- AI insights
        market_demand INTEGER DEFAULT 3,
        growth_potential TEXT,
        related_skills TEXT[],
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(user_id, skill_name)
      );
    `

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
      CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_sessions_session_id ON conversation_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_sessions_created_at ON conversation_sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_company_relationships_user_id ON user_company_relationships(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_company_relationships_company_id ON user_company_relationships(company_id);
      CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
    `

    // Create trigger function for updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `

    // Create triggers
    await sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_user_company_relationships_updated_at ON user_company_relationships;
      CREATE TRIGGER update_user_company_relationships_updated_at BEFORE UPDATE ON user_company_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_user_goals_updated_at ON user_goals;
      CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;
      CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON user_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    console.log('✅ User system schema created successfully')

    // Get current user from Clerk if authenticated
    const { userId: clerkUserId } = auth()
    let currentUser = null
    
    if (clerkUserId) {
      console.log('👤 Creating profile for authenticated user:', clerkUserId)
      
      // Create or update user profile for current authenticated user
      await sql`
        INSERT INTO users (
          id, 
          email, 
          name, 
          full_name,
          first_name,
          last_name,
          current_role,
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
        ) ON CONFLICT (email) DO UPDATE SET
          id = EXCLUDED.id,
          name = EXCLUDED.name,
          current_role = EXCLUDED.current_role,
          company = EXCLUDED.company,
          updated_at = NOW()
        RETURNING *;
      `
      
      // Create relationship between user and CKDelta
      await sql`
        INSERT INTO user_company_relationships (
          user_id,
          company_id,
          relationship_type,
          role_at_company,
          department,
          is_current,
          connection_strength,
          interaction_frequency
        ) SELECT 
          ${clerkUserId},
          ce.id,
          'founder',
          'Founder/CEO',
          'Leadership',
          true,
          5,
          'frequent'
        FROM company_enrichments ce 
        WHERE ce.company_name = 'ckdelta'
        ON CONFLICT (user_id, company_id, role_at_company) DO NOTHING;
      `
      
      // Add goals
      await sql`
        INSERT INTO user_goals (
          user_id,
          goal_type,
          title,
          description,
          target_date,
          status
        ) VALUES 
          (
            ${clerkUserId},
            'product_development',
            'Launch Quest AI MVP',
            'Complete the core conversational AI features with user context integration',
            '2025-08-01',
            'active'
          ),
          (
            ${clerkUserId},
            'business_growth',
            'Scale Quest Platform',
            'Grow Quest to 1000+ active users with proven career advancement outcomes',
            '2025-12-31',
            'active'
          )
        ON CONFLICT DO NOTHING;
      `
      
      // Add skills
      await sql`
        INSERT INTO user_skills (
          user_id,
          skill_name,
          skill_category,
          proficiency_level,
          years_experience,
          evidence_sources
        ) VALUES 
          (${clerkUserId}, 'Leadership', 'soft', 5, 15, ARRAY['experience', 'conversation']),
          (${clerkUserId}, 'Strategic Planning', 'soft', 5, 12, ARRAY['experience', 'conversation']),
          (${clerkUserId}, 'AI/ML Product Development', 'technical', 4, 3, ARRAY['project', 'conversation']),
          (${clerkUserId}, 'Business Development', 'business', 5, 10, ARRAY['experience', 'conversation']),
          (${clerkUserId}, 'Team Building', 'soft', 5, 15, ARRAY['experience', 'conversation'])
        ON CONFLICT (user_id, skill_name) DO NOTHING;
      `
      
      currentUser = { id: clerkUserId, email: 'keegan.dan@gmail.com', name: 'Dan Keegan' }
    }

    // Verify tables were created
    const tablesQuery = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'conversation_sessions', 'user_company_relationships', 'user_goals', 'user_skills')
      ORDER BY table_name;
    `

    const tableNames = tablesQuery.rows.map(row => row.table_name)

    // Get user count
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`
    
    // Get sample CKDelta colleagues for context
    const colleagues = await sql`
      SELECT 
        ce.enrichment_data->'employees' as employees
      FROM company_enrichments ce 
      WHERE ce.company_name = 'ckdelta'
      LIMIT 1;
    `

    console.log('✅ User system initialization complete')

    return NextResponse.json({
      success: true,
      message: 'Quest User System initialized successfully',
      tables_created: tableNames,
      current_user: currentUser,
      user_count: parseInt(userCount.rows[0].count),
      ckdelta_colleagues: colleagues.rows[0]?.employees || [],
      integration_status: 'ready',
      next_steps: [
        'CLM endpoint can now access real user data',
        'Conversation history will be stored in conversation_sessions',
        'User profiles connected to CKDelta company data',
        'Ready for full context-aware conversations'
      ]
    })

  } catch (error) {
    console.error('❌ Error initializing user system:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize user system',
      details: error instanceof Error ? error.message : 'Unknown error',
      action: 'Check database permissions and try again'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check current user system status
    const { userId } = auth()
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'conversation_sessions', 'user_company_relationships', 'user_goals', 'user_skills')
      ORDER BY table_name;
    `

    let userProfile = null
    if (userId && tables.rows.length > 0) {
      const userQuery = await sql`
        SELECT u.*, 
               array_agg(DISTINCT ug.title) as goals,
               array_agg(DISTINCT us.skill_name) as skill_list
        FROM users u
        LEFT JOIN user_goals ug ON u.id = ug.user_id AND ug.status = 'active'
        LEFT JOIN user_skills us ON u.id = us.user_id
        WHERE u.id = ${userId}
        GROUP BY u.id
        LIMIT 1;
      `
      
      userProfile = userQuery.rows[0] || null
    }

    return NextResponse.json({
      success: true,
      system_status: tables.rows.length === 5 ? 'fully_initialized' : 'partial',
      tables_exist: tables.rows.map(r => r.table_name),
      current_user: userProfile,
      clerk_user_id: userId || null,
      ready_for_clm: tables.rows.length === 5 && userProfile !== null
    })

  } catch (error) {
    console.error('❌ Error checking user system status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check user system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}