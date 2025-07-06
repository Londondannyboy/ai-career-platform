-- Quest User Profile Schema for Neon.tech Database
-- This creates the core user system that CLM needs for full context

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

-- Create user-company relationships table
CREATE TABLE IF NOT EXISTS user_company_relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  
  -- Relationship details
  relationship_type TEXT DEFAULT 'employee', -- employee, colleague, contact, prospect
  role_at_company TEXT,
  department TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  
  -- Connection strength
  connection_strength INTEGER DEFAULT 1, -- 1-5 scale
  interaction_frequency TEXT DEFAULT 'occasional', -- frequent, regular, occasional, rare
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, company_id, role_at_company)
);

-- Create user coaching goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Goal details
  goal_type TEXT NOT NULL, -- career_advancement, skill_development, job_search, etc.
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  
  -- Progress tracking
  status TEXT DEFAULT 'active', -- active, completed, paused, cancelled
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

-- Create user skills tracking table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Skill details
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- technical, soft, domain, etc.
  proficiency_level INTEGER DEFAULT 3, -- 1-5 scale
  years_experience DECIMAL(3,1) DEFAULT 0,
  
  -- Evidence and validation
  evidence_sources TEXT[], -- resume, linkedin, conversation, project
  last_used_date DATE,
  improvement_goals TEXT,
  
  -- AI insights
  market_demand INTEGER DEFAULT 3, -- 1-5 scale
  growth_potential TEXT,
  related_skills TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, skill_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_session_id ON conversation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_created_at ON conversation_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_company_relationships_user_id ON user_company_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_company_relationships_company_id ON user_company_relationships(company_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_company_relationships_updated_at BEFORE UPDATE ON user_company_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON user_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert test data for Dan Keegan (you can update this with real data later)
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
  'user_dan_keegan', -- This will be replaced with real Clerk ID
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
  current_role = EXCLUDED.current_role,
  company = EXCLUDED.company,
  updated_at = NOW();

-- Create relationship between Dan and CKDelta
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
  'user_dan_keegan',
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

-- Add some goals for Dan
INSERT INTO user_goals (
  user_id,
  goal_type,
  title,
  description,
  target_date,
  status
) VALUES 
  (
    'user_dan_keegan',
    'product_development',
    'Launch Quest AI MVP',
    'Complete the core conversational AI features with user context integration',
    '2025-08-01',
    'active'
  ),
  (
    'user_dan_keegan',
    'business_growth',
    'Scale Quest Platform',
    'Grow Quest to 1000+ active users with proven career advancement outcomes',
    '2025-12-31',
    'active'
  )
ON CONFLICT DO NOTHING;

-- Add skills for Dan
INSERT INTO user_skills (
  user_id,
  skill_name,
  skill_category,
  proficiency_level,
  years_experience,
  evidence_sources
) VALUES 
  ('user_dan_keegan', 'Leadership', 'soft', 5, 15, ARRAY['experience', 'conversation']),
  ('user_dan_keegan', 'Strategic Planning', 'soft', 5, 12, ARRAY['experience', 'conversation']),
  ('user_dan_keegan', 'AI/ML Product Development', 'technical', 4, 3, ARRAY['project', 'conversation']),
  ('user_dan_keegan', 'Business Development', 'business', 5, 10, ARRAY['experience', 'conversation']),
  ('user_dan_keegan', 'Team Building', 'soft', 5, 15, ARRAY['experience', 'conversation'])
ON CONFLICT (user_id, skill_name) DO NOTHING;