-- Quest Deep Repository Architecture Schema
-- Creates the unified user_profiles table with four privacy layers as JSONB fields

-- Create user_profiles table with tiered repository system
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Four privacy layers as JSONB fields
  surface_repo JSONB DEFAULT '{}', -- Public data (LinkedIn-style)
  working_repo JSONB DEFAULT '{}', -- Professional depth (shared with recruiters)
  personal_repo JSONB DEFAULT '{}', -- Authentic sharing (peers/coaches)
  deep_repo JSONB DEFAULT '{}',     -- Life goals and Trinity (highly private)
  
  -- Access tracking
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  
  -- Metadata
  profile_completeness INTEGER DEFAULT 0, -- 0-100 percentage
  last_export_at TIMESTAMP WITH TIME ZONE,
  export_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_surface_repo_gin ON user_profiles USING gin(surface_repo);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deep_repo_gin ON user_profiles USING gin(deep_repo);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create repo access permissions table
CREATE TABLE IF NOT EXISTS repo_access_permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_to_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Access levels
  surface_access BOOLEAN DEFAULT true,
  working_access BOOLEAN DEFAULT false,
  personal_access BOOLEAN DEFAULT false,
  deep_access BOOLEAN DEFAULT false,
  
  -- Access context
  relationship_type TEXT DEFAULT 'connection', -- connection, recruiter, coach, mentor
  granted_reason TEXT,
  access_source TEXT, -- request, invitation, mutual
  
  -- Time and usage tracking
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  -- Permissions
  can_export_pdf BOOLEAN DEFAULT false,
  can_add_feedback BOOLEAN DEFAULT false,
  can_see_network BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate permissions
  UNIQUE(owner_id, granted_to_id)
);

-- Create indexes for repo access
CREATE INDEX IF NOT EXISTS idx_repo_access_owner_id ON repo_access_permissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_repo_access_granted_to_id ON repo_access_permissions(granted_to_id);
CREATE INDEX IF NOT EXISTS idx_repo_access_expires_at ON repo_access_permissions(expires_at);

-- Create trigger for repo access updated_at
CREATE TRIGGER update_repo_access_updated_at 
  BEFORE UPDATE ON repo_access_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  profile user_profiles%ROWTYPE;
  completeness INTEGER := 0;
  surface_complete INTEGER := 0;
  working_complete INTEGER := 0;
  personal_complete INTEGER := 0;
  deep_complete INTEGER := 0;
BEGIN
  SELECT * INTO profile FROM user_profiles WHERE user_id = p_user_id;
  
  IF profile IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Surface repo completeness (40% weight)
  IF profile.surface_repo->>'professional_headline' IS NOT NULL THEN
    surface_complete := surface_complete + 10;
  END IF;
  IF jsonb_array_length(COALESCE(profile.surface_repo->'work_experience', '[]'::jsonb)) > 0 THEN
    surface_complete := surface_complete + 10;
  END IF;
  IF jsonb_array_length(COALESCE(profile.surface_repo->'core_skills', '[]'::jsonb)) > 2 THEN
    surface_complete := surface_complete + 10;
  END IF;
  IF profile.surface_repo->>'summary' IS NOT NULL THEN
    surface_complete := surface_complete + 10;
  END IF;
  
  -- Working repo completeness (30% weight)
  IF jsonb_array_length(COALESCE(profile.working_repo->'detailed_achievements', '[]'::jsonb)) > 0 THEN
    working_complete := working_complete + 15;
  END IF;
  IF jsonb_array_length(COALESCE(profile.working_repo->'project_deep_dives', '[]'::jsonb)) > 0 THEN
    working_complete := working_complete + 15;
  END IF;
  
  -- Personal repo completeness (20% weight)
  IF jsonb_array_length(COALESCE(profile.personal_repo->'core_strengths', '[]'::jsonb)) > 0 THEN
    personal_complete := personal_complete + 10;
  END IF;
  IF profile.personal_repo->'working_style' IS NOT NULL THEN
    personal_complete := personal_complete + 10;
  END IF;
  
  -- Deep repo completeness (10% weight)
  IF profile.deep_repo->'trinity' IS NOT NULL THEN
    deep_complete := deep_complete + 10;
  END IF;
  
  completeness := surface_complete + working_complete + personal_complete + deep_complete;
  
  -- Update the profile completeness
  UPDATE user_profiles 
  SET profile_completeness = completeness 
  WHERE user_id = p_user_id;
  
  RETURN completeness;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate Trinity data to Deep Repo
CREATE OR REPLACE FUNCTION migrate_trinity_to_deep_repo()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  trinity_record RECORD;
BEGIN
  -- Loop through all active Trinity statements
  FOR trinity_record IN 
    SELECT 
      ts.user_id,
      ts.quest,
      ts.service,
      ts.pledge,
      ts.trinity_type,
      ts.trinity_type_description,
      ts.quest_seal,
      ts.created_at as trinity_created_at,
      ts.updated_at as trinity_updated_at,
      tcp.quest_focus,
      tcp.service_focus,
      tcp.pledge_focus,
      tcp.coaching_methodology,
      tcp.coaching_tone
    FROM trinity_statements ts
    LEFT JOIN trinity_coaching_preferences tcp ON tcp.trinity_statement_id = ts.id
    WHERE ts.is_active = true
  LOOP
    -- Create or update user profile with Trinity in deep_repo
    INSERT INTO user_profiles (user_id, deep_repo)
    VALUES (
      trinity_record.user_id,
      jsonb_build_object(
        'trinity', jsonb_build_object(
          'quest', trinity_record.quest,
          'service', trinity_record.service,
          'pledge', trinity_record.pledge,
          'type', trinity_record.trinity_type,
          'typeDescription', trinity_record.trinity_type_description,
          'questSeal', trinity_record.quest_seal,
          'createdAt', trinity_record.trinity_created_at,
          'updatedAt', trinity_record.trinity_updated_at,
          'focus', jsonb_build_object(
            'quest', trinity_record.quest_focus,
            'service', trinity_record.service_focus,
            'pledge', trinity_record.pledge_focus
          ),
          'coachingPreferences', jsonb_build_object(
            'methodology', trinity_record.coaching_methodology,
            'tone', trinity_record.coaching_tone
          )
        )
      )
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      deep_repo = jsonb_set(
        COALESCE(user_profiles.deep_repo, '{}'),
        '{trinity}',
        jsonb_build_object(
          'quest', trinity_record.quest,
          'service', trinity_record.service,
          'pledge', trinity_record.pledge,
          'type', trinity_record.trinity_type,
          'typeDescription', trinity_record.trinity_type_description,
          'questSeal', trinity_record.quest_seal,
          'createdAt', trinity_record.trinity_created_at,
          'updatedAt', trinity_record.trinity_updated_at,
          'focus', jsonb_build_object(
            'quest', trinity_record.quest_focus,
            'service', trinity_record.service_focus,
            'pledge', trinity_record.pledge_focus
          ),
          'coachingPreferences', jsonb_build_object(
            'methodology', trinity_record.coaching_methodology,
            'tone', trinity_record.coaching_tone
          )
        )
      ),
      updated_at = NOW();
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to grant repo access
CREATE OR REPLACE FUNCTION grant_repo_access(
  p_owner_id TEXT,
  p_granted_to_id TEXT,
  p_access_level TEXT, -- 'surface', 'working', 'personal', 'deep'
  p_relationship_type TEXT DEFAULT 'connection',
  p_reason TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  expires_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration if provided
  IF p_expires_days IS NOT NULL THEN
    expires_timestamp := NOW() + (p_expires_days || ' days')::INTERVAL;
  END IF;
  
  -- Insert or update access permissions
  INSERT INTO repo_access_permissions (
    owner_id,
    granted_to_id,
    surface_access,
    working_access,
    personal_access,
    deep_access,
    relationship_type,
    granted_reason,
    expires_at
  ) VALUES (
    p_owner_id,
    p_granted_to_id,
    true, -- Surface is always accessible
    CASE WHEN p_access_level IN ('working', 'personal', 'deep') THEN true ELSE false END,
    CASE WHEN p_access_level IN ('personal', 'deep') THEN true ELSE false END,
    CASE WHEN p_access_level = 'deep' THEN true ELSE false END,
    p_relationship_type,
    p_reason,
    expires_timestamp
  )
  ON CONFLICT (owner_id, granted_to_id) DO UPDATE
  SET
    working_access = CASE WHEN p_access_level IN ('working', 'personal', 'deep') THEN true ELSE EXCLUDED.working_access END,
    personal_access = CASE WHEN p_access_level IN ('personal', 'deep') THEN true ELSE EXCLUDED.personal_access END,
    deep_access = CASE WHEN p_access_level = 'deep' THEN true ELSE EXCLUDED.deep_access END,
    relationship_type = p_relationship_type,
    granted_reason = COALESCE(p_reason, EXCLUDED.granted_reason),
    expires_at = COALESCE(expires_timestamp, EXCLUDED.expires_at),
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Core Deep Repository system storing user data in four privacy layers';
COMMENT ON COLUMN user_profiles.surface_repo IS 'Public profile data - LinkedIn-style information';
COMMENT ON COLUMN user_profiles.working_repo IS 'Professional depth - shared with recruiters and hiring managers';
COMMENT ON COLUMN user_profiles.personal_repo IS 'Authentic sharing - for peers and coaches';
COMMENT ON COLUMN user_profiles.deep_repo IS 'Life goals, Trinity, and deeply personal mission - highest privacy';

-- Migrate existing profile data (from various tables to unified structure)
-- This is commented out by default - run manually after review
-- SELECT migrate_trinity_to_deep_repo();