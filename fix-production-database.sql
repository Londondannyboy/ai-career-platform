-- Fix for Experience Save Issue
-- Run this on your production database (Neon)

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  profile user_profiles%ROWTYPE;
  completeness INTEGER := 0;
BEGIN
  SELECT * INTO profile FROM user_profiles WHERE user_id = p_user_id;
  
  IF profile IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Simple completeness calculation
  -- You can enhance this later based on your needs
  IF profile.surface_repo IS NOT NULL THEN
    completeness := completeness + 25;
  END IF;
  
  IF profile.working_repo IS NOT NULL THEN
    completeness := completeness + 25;
  END IF;
  
  IF profile.personal_repo IS NOT NULL THEN
    completeness := completeness + 25;
  END IF;
  
  IF profile.deep_repo IS NOT NULL THEN
    completeness := completeness + 25;
  END IF;
  
  -- Update the completeness score
  UPDATE user_profiles 
  SET completeness = completeness 
  WHERE user_id = p_user_id;
  
  RETURN completeness;
END;
$$ LANGUAGE plpgsql;