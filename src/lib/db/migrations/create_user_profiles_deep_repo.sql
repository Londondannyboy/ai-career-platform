-- Create user_profiles table for Deep Repo architecture
-- Four-layer privacy system: surface, working, personal, deep

-- Create the main user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk user ID
  
  -- Four privacy layers as JSONB
  surface_repo JSONB DEFAULT '{}', -- Public profile
  working_repo JSONB DEFAULT '{}', -- Professional/curated
  personal_repo JSONB DEFAULT '{}', -- Private workspace (OKRs, goals, tasks)
  deep_repo JSONB DEFAULT '{}', -- Core identity (Trinity)
  
  -- Metadata
  profile_completeness INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_surface_repo ON user_profiles USING gin(surface_repo);
CREATE INDEX IF NOT EXISTS idx_user_profiles_working_repo ON user_profiles USING gin(working_repo);
CREATE INDEX IF NOT EXISTS idx_user_profiles_personal_repo ON user_profiles USING gin(personal_repo);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deep_repo ON user_profiles USING gin(deep_repo);

-- Create repo access permissions table
CREATE TABLE IF NOT EXISTS repo_access_permissions (
  id SERIAL PRIMARY KEY,
  owner_id VARCHAR(255) NOT NULL,
  granted_to_id VARCHAR(255) NOT NULL,
  
  -- Access levels
  surface_access BOOLEAN DEFAULT true,
  working_access BOOLEAN DEFAULT false,
  personal_access BOOLEAN DEFAULT false,
  deep_access BOOLEAN DEFAULT false,
  
  -- Context
  relationship_type VARCHAR(50),
  granted_reason TEXT,
  
  -- Time tracking
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(owner_id, granted_to_id)
);

-- Create indexes for permissions
CREATE INDEX IF NOT EXISTS idx_repo_access_owner ON repo_access_permissions(owner_id);
CREATE INDEX IF NOT EXISTS idx_repo_access_granted_to ON repo_access_permissions(granted_to_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repo_access_permissions_updated_at BEFORE UPDATE ON repo_access_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_completeness INTEGER := 0;
  v_profile user_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM user_profiles WHERE user_id = p_user_id;
  
  -- Surface repo completeness (25%)
  IF v_profile.surface_repo->>'professional_headline' IS NOT NULL THEN
    v_completeness := v_completeness + 5;
  END IF;
  IF v_profile.surface_repo->>'summary' IS NOT NULL THEN
    v_completeness := v_completeness + 5;
  END IF;
  IF jsonb_array_length(COALESCE(v_profile.surface_repo->'work_experience', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 10;
  END IF;
  IF jsonb_array_length(COALESCE(v_profile.surface_repo->'core_skills', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 5;
  END IF;
  
  -- Working repo completeness (25%)
  IF jsonb_array_length(COALESCE(v_profile.working_repo->'achievements', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 10;
  END IF;
  IF jsonb_array_length(COALESCE(v_profile.working_repo->'portfolio', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 15;
  END IF;
  
  -- Personal repo completeness (25%)
  IF jsonb_array_length(COALESCE(v_profile.personal_repo->'goals', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 10;
  END IF;
  IF jsonb_array_length(COALESCE(v_profile.personal_repo->'okrs', '[]'::jsonb)) > 0 THEN
    v_completeness := v_completeness + 15;
  END IF;
  
  -- Deep repo completeness (25%) - Trinity
  IF v_profile.deep_repo->'trinity' IS NOT NULL THEN
    v_completeness := v_completeness + 25;
  END IF;
  
  -- Update the profile with calculated completeness
  UPDATE user_profiles 
  SET profile_completeness = v_completeness 
  WHERE user_id = p_user_id;
  
  RETURN v_completeness;
END;
$$ LANGUAGE plpgsql;

-- Function to grant repo access
CREATE OR REPLACE FUNCTION grant_repo_access(
  p_owner_id VARCHAR,
  p_granted_to_id VARCHAR,
  p_level VARCHAR,
  p_relationship_type VARCHAR DEFAULT 'connection',
  p_reason TEXT DEFAULT NULL,
  p_expires_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate expiration if provided
  IF p_expires_days IS NOT NULL THEN
    v_expires_at := CURRENT_TIMESTAMP + (p_expires_days || ' days')::INTERVAL;
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
    true, -- Always grant surface access
    CASE WHEN p_level IN ('working', 'personal', 'deep') THEN true ELSE false END,
    CASE WHEN p_level IN ('personal', 'deep') THEN true ELSE false END,
    CASE WHEN p_level = 'deep' THEN true ELSE false END,
    p_relationship_type,
    p_reason,
    v_expires_at
  )
  ON CONFLICT (owner_id, granted_to_id) DO UPDATE SET
    working_access = CASE WHEN p_level IN ('working', 'personal', 'deep') THEN true ELSE EXCLUDED.working_access END,
    personal_access = CASE WHEN p_level IN ('personal', 'deep') THEN true ELSE EXCLUDED.personal_access END,
    deep_access = CASE WHEN p_level = 'deep' THEN true ELSE EXCLUDED.deep_access END,
    relationship_type = p_relationship_type,
    granted_reason = p_reason,
    expires_at = v_expires_at,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate Trinity data to Deep Repo
CREATE OR REPLACE FUNCTION migrate_trinity_to_deep_repo()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_trinity RECORD;
BEGIN
  -- Loop through all Trinity statements
  FOR v_trinity IN 
    SELECT * FROM trinity_statements WHERE is_active = true
  LOOP
    -- Create or update user profile with Trinity in deep repo
    INSERT INTO user_profiles (user_id, deep_repo)
    VALUES (
      v_trinity.user_id,
      jsonb_build_object(
        'trinity', jsonb_build_object(
          'quest', v_trinity.quest,
          'service', v_trinity.service,
          'pledge', v_trinity.pledge,
          'type', v_trinity.type,
          'questSeal', v_trinity.quest_seal,
          'createdAt', v_trinity.created_at,
          'updatedAt', v_trinity.updated_at
        )
      )
    )
    ON CONFLICT (user_id) DO UPDATE SET
      deep_repo = jsonb_set(
        COALESCE(user_profiles.deep_repo, '{}'),
        '{trinity}',
        jsonb_build_object(
          'quest', v_trinity.quest,
          'service', v_trinity.service,
          'pledge', v_trinity.pledge,
          'type', v_trinity.type,
          'questSeal', v_trinity.quest_seal,
          'createdAt', v_trinity.created_at,
          'updatedAt', v_trinity.updated_at
        )
      ),
      updated_at = CURRENT_TIMESTAMP;
    
    v_count := v_count + 1;
  END LOOP;
  
  -- Also migrate coaching preferences if they exist
  FOR v_trinity IN 
    SELECT tcp.*, ts.user_id 
    FROM trinity_coaching_preferences tcp
    JOIN trinity_statements ts ON tcp.trinity_id = ts.id
    WHERE ts.is_active = true
  LOOP
    UPDATE user_profiles
    SET deep_repo = jsonb_set(
      deep_repo,
      '{trinity,focus}',
      jsonb_build_object(
        'quest', v_trinity.focus_quest,
        'service', v_trinity.focus_service,
        'pledge', v_trinity.focus_pledge
      )
    )
    WHERE user_id = v_trinity.user_id;
    
    UPDATE user_profiles
    SET deep_repo = jsonb_set(
      deep_repo,
      '{trinity,coachingPreferences}',
      jsonb_build_object(
        'methodology', v_trinity.coaching_methodology,
        'tone', v_trinity.preferred_tone
      )
    )
    WHERE user_id = v_trinity.user_id;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;