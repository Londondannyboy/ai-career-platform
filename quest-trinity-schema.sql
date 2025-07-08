-- Quest Trinity System Database Schema
-- Extends the existing user system with Trinity statements and preferences

-- Trinity Statements Core Table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one active Trinity per user
  UNIQUE(user_id, is_active) WHERE is_active = TRUE
);

-- Trinity Coaching Preferences
CREATE TABLE IF NOT EXISTS trinity_coaching_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
  
  -- Trinity Focus Distribution (must sum to 100)
  quest_focus INTEGER NOT NULL DEFAULT 34 CHECK (quest_focus BETWEEN 0 AND 100),
  service_focus INTEGER NOT NULL DEFAULT 33 CHECK (service_focus BETWEEN 0 AND 100),
  pledge_focus INTEGER NOT NULL DEFAULT 33 CHECK (pledge_focus BETWEEN 0 AND 100),
  
  -- Coaching Style Preferences
  coaching_methodology TEXT DEFAULT 'balanced' CHECK (
    coaching_methodology IN ('OKR', 'SMART', 'GROW', 'CLEAR', 'FAST', 'balanced')
  ),
  coaching_tone TEXT DEFAULT 'supportive' CHECK (
    coaching_tone IN ('challenging', 'supportive', 'analytical', 'motivational', 'collaborative')
  ),
  
  -- Context Awareness Settings
  context_awareness_level TEXT DEFAULT 'high' CHECK (
    context_awareness_level IN ('minimal', 'moderate', 'high', 'maximum')
  ),
  adaptation_speed TEXT DEFAULT 'moderate' CHECK (
    adaptation_speed IN ('slow', 'moderate', 'fast')
  ),
  
  -- Override Settings
  always_return_to_quest BOOLEAN DEFAULT FALSE,
  emergency_quest_reminder BOOLEAN DEFAULT TRUE,
  
  -- Voice Coaching Preferences
  voice_enabled BOOLEAN DEFAULT TRUE,
  voice_interruption_allowed BOOLEAN DEFAULT TRUE,
  preferred_session_length INTEGER DEFAULT 900, -- 15 minutes in seconds
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure focus percentages sum to 100
  CONSTRAINT focus_sum_check CHECK (quest_focus + service_focus + pledge_focus = 100)
);

-- Trinity Evolution History
CREATE TABLE IF NOT EXISTS trinity_evolution_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
  
  -- Change Details
  change_type TEXT NOT NULL CHECK (
    change_type IN ('created', 'quest_updated', 'service_updated', 'pledge_updated', 'type_changed', 'deactivated')
  ),
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  
  -- Context
  triggered_by TEXT DEFAULT 'user' CHECK (triggered_by IN ('user', 'ai_suggestion', 'coaching_session', 'ritual')),
  session_id UUID, -- Link to conversation or ritual session
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Moderation for Trinity Statements
CREATE TABLE IF NOT EXISTS trinity_content_moderation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trinity_statement_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
  
  -- Moderation Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'flagged', 'rejected', 'under_review')
  ),
  
  -- AI Screening Results
  ai_toxicity_score DECIMAL(3,2) DEFAULT 0.00 CHECK (ai_toxicity_score BETWEEN 0 AND 1),
  ai_ideology_flags TEXT[],
  ai_safety_concerns TEXT[],
  ai_recommendations TEXT[],
  
  -- Human Review
  human_reviewer_id TEXT,
  human_review_notes TEXT,
  human_review_at TIMESTAMP WITH TIME ZONE,
  
  -- Appeal Process
  appeal_submitted BOOLEAN DEFAULT FALSE,
  appeal_reason TEXT,
  appeal_decision TEXT,
  appeal_decided_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Constellation Mapping (Trinity Compatibility)
CREATE TABLE IF NOT EXISTS trinity_compatibility (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trinity_a_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
  trinity_b_id UUID NOT NULL REFERENCES trinity_statements(id) ON DELETE CASCADE,
  
  -- Compatibility Scores (0-100)
  overall_compatibility DECIMAL(5,2),
  quest_similarity DECIMAL(5,2),
  service_alignment DECIMAL(5,2),
  pledge_resonance DECIMAL(5,2),
  
  -- Geometric Analysis
  trinity_triangle_similarity DECIMAL(5,2), -- Based on 3D geometric calculation
  constellation_distance DECIMAL(10,6), -- Vector distance in Trinity space
  
  -- Calculated Insights
  collaboration_potential TEXT,
  mutual_growth_areas TEXT[],
  complementary_strengths TEXT[],
  
  -- Timestamps
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Prevent duplicate calculations
  UNIQUE(user_a_id, user_b_id, trinity_a_id, trinity_b_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trinity_statements_user_id ON trinity_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_trinity_statements_active ON trinity_statements(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_trinity_statements_quest_seal ON trinity_statements(quest_seal);
CREATE INDEX IF NOT EXISTS idx_trinity_statements_type ON trinity_statements(trinity_type);

CREATE INDEX IF NOT EXISTS idx_trinity_preferences_user_id ON trinity_coaching_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_trinity_preferences_statement_id ON trinity_coaching_preferences(trinity_statement_id);

CREATE INDEX IF NOT EXISTS idx_trinity_evolution_user_id ON trinity_evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trinity_evolution_statement_id ON trinity_evolution_history(trinity_statement_id);
CREATE INDEX IF NOT EXISTS idx_trinity_evolution_created_at ON trinity_evolution_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trinity_moderation_statement_id ON trinity_content_moderation(trinity_statement_id);
CREATE INDEX IF NOT EXISTS idx_trinity_moderation_status ON trinity_content_moderation(status);

CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_user_a ON trinity_compatibility(user_a_id);
CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_user_b ON trinity_compatibility(user_b_id);
CREATE INDEX IF NOT EXISTS idx_trinity_compatibility_overall ON trinity_compatibility(overall_compatibility DESC);

-- Add updated_at triggers for Trinity tables
CREATE TRIGGER update_trinity_statements_updated_at 
  BEFORE UPDATE ON trinity_statements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trinity_preferences_updated_at 
  BEFORE UPDATE ON trinity_coaching_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trinity_moderation_updated_at 
  BEFORE UPDATE ON trinity_content_moderation 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Functions for Trinity operations

-- Generate Quest Seal
CREATE OR REPLACE FUNCTION generate_quest_seal(
  p_quest TEXT,
  p_service TEXT, 
  p_pledge TEXT,
  p_trinity_type CHAR(1),
  p_user_id TEXT
) RETURNS VARCHAR(64) AS $$
DECLARE
  seal_input TEXT;
  quest_seal VARCHAR(64);
BEGIN
  -- Combine Trinity elements with user ID and timestamp for uniqueness
  seal_input := p_quest || '|' || p_service || '|' || p_pledge || '|' || p_trinity_type || '|' || p_user_id || '|' || EXTRACT(EPOCH FROM NOW());
  
  -- Generate SHA-256 hash
  quest_seal := encode(digest(seal_input, 'sha256'), 'hex');
  
  RETURN quest_seal;
END;
$$ LANGUAGE plpgsql;

-- Calculate Trinity Compatibility
CREATE OR REPLACE FUNCTION calculate_trinity_compatibility(
  p_trinity_a_id UUID,
  p_trinity_b_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  compatibility_score DECIMAL(5,2);
  quest_sim DECIMAL(5,2);
  service_sim DECIMAL(5,2);
  pledge_sim DECIMAL(5,2);
BEGIN
  -- This is a simplified compatibility calculation
  -- In production, this would use vector embeddings and semantic similarity
  
  -- For now, return a placeholder that factors in Trinity type compatibility
  SELECT 
    CASE 
      WHEN ta.trinity_type = tb.trinity_type THEN 75.0
      WHEN (ta.trinity_type = 'M' OR tb.trinity_type = 'M') THEN 60.0
      ELSE 45.0
    END INTO compatibility_score
  FROM trinity_statements ta, trinity_statements tb
  WHERE ta.id = p_trinity_a_id AND tb.id = p_trinity_b_id;
  
  RETURN COALESCE(compatibility_score, 0.0);
END;
$$ LANGUAGE plpgsql;

-- Trinity Validation Function
CREATE OR REPLACE FUNCTION validate_trinity_statement(
  p_quest TEXT,
  p_service TEXT,
  p_pledge TEXT
) RETURNS TABLE (
  is_valid BOOLEAN,
  validation_errors TEXT[]
) AS $$
DECLARE
  errors TEXT[] := '{}';
BEGIN
  -- Check minimum lengths
  IF length(trim(p_quest)) < 10 THEN
    errors := array_append(errors, 'Quest must be at least 10 characters');
  END IF;
  
  IF length(trim(p_service)) < 10 THEN
    errors := array_append(errors, 'Service must be at least 10 characters');
  END IF;
  
  IF length(trim(p_pledge)) < 10 THEN
    errors := array_append(errors, 'Pledge must be at least 10 characters');
  END IF;
  
  -- Check maximum lengths
  IF length(trim(p_quest)) > 500 THEN
    errors := array_append(errors, 'Quest must be no more than 500 characters');
  END IF;
  
  IF length(trim(p_service)) > 500 THEN
    errors := array_append(errors, 'Service must be no more than 500 characters');
  END IF;
  
  IF length(trim(p_pledge)) > 500 THEN
    errors := array_append(errors, 'Pledge must be no more than 500 characters');
  END IF;
  
  -- Basic content validation (can be extended)
  IF p_quest ILIKE '%test%' OR p_service ILIKE '%test%' OR p_pledge ILIKE '%test%' THEN
    errors := array_append(errors, 'Trinity statements should be meaningful, not test content');
  END IF;
  
  RETURN QUERY SELECT (array_length(errors, 1) IS NULL), errors;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE trinity_statements IS 'Core Trinity system - stores user Quest, Service, and Pledge statements with Foundation/Living choice';
COMMENT ON TABLE trinity_coaching_preferences IS 'User-controlled AI coaching preferences based on Trinity focus distribution';
COMMENT ON TABLE trinity_evolution_history IS 'Tracks changes to Trinity statements over time for growth analysis';
COMMENT ON TABLE trinity_content_moderation IS 'Multi-layer safety system for Trinity statement content moderation';
COMMENT ON TABLE trinity_compatibility IS 'Member compatibility scores based on Trinity similarity and sacred geometry';