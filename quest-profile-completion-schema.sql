-- Quest Profile Completion Schema Extension
-- Adds bite-sized profile completion tables to existing users system
-- Run after quest-users-schema.sql

-- Create user work experience table (current + recent work)
CREATE TABLE IF NOT EXISTS user_work_experience (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic work details
  company_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  period_description TEXT, -- e.g. "Q1 2020 - Q2 2022" or "Jan 2020 - Present"
  is_current BOOLEAN DEFAULT false,
  
  -- Optional details (can be added later)
  department TEXT,
  employment_type TEXT DEFAULT 'full-time', -- full-time, part-time, contract, freelance
  location TEXT,
  description TEXT,
  
  -- Achievements and highlights
  key_achievements TEXT[],
  technologies_used TEXT[],
  
  -- Ordering and status
  display_order INTEGER DEFAULT 0,
  completion_status TEXT DEFAULT 'basic', -- basic, detailed, complete
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user education table
CREATE TABLE IF NOT EXISTS user_education (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic education details
  institution_name TEXT NOT NULL,
  degree_type TEXT, -- Bachelor's, Master's, PhD, Certificate, etc.
  field_of_study TEXT,
  period_description TEXT, -- e.g. "2015 - 2019" or "Q3 2016 - Q1 2020"
  is_current BOOLEAN DEFAULT false,
  
  -- Optional details
  grade_gpa TEXT,
  honors TEXT,
  relevant_coursework TEXT[],
  thesis_project TEXT,
  
  -- Status
  completion_status TEXT DEFAULT 'basic', -- basic, detailed, complete
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user certificates table
CREATE TABLE IF NOT EXISTS user_certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Certificate details
  certificate_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date TEXT, -- flexible format like "Q2 2023" or "March 2023"
  expiry_date TEXT,
  credential_id TEXT,
  verification_url TEXT,
  
  -- Metadata
  certificate_type TEXT, -- professional, technical, academic, industry
  status TEXT DEFAULT 'active', -- active, expired, pending
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile completion tracking
CREATE TABLE IF NOT EXISTS user_profile_completion (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Section completion status
  current_work_completed BOOLEAN DEFAULT false,
  work_history_completed BOOLEAN DEFAULT false,
  education_completed BOOLEAN DEFAULT false,
  certificates_completed BOOLEAN DEFAULT false,
  core_skills_completed BOOLEAN DEFAULT false,
  
  -- Overall progress
  completion_percentage INTEGER DEFAULT 0,
  profile_quality TEXT DEFAULT 'basic', -- basic, good, excellent
  
  -- Completion metadata
  last_section_worked TEXT,
  time_spent_seconds INTEGER DEFAULT 0,
  completion_prompts_shown TEXT[],
  
  -- Export and usage
  last_cv_export TIMESTAMP WITH TIME ZONE,
  cv_template_preference TEXT DEFAULT 'standard',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create synthetic colleagues table (for CKDelta team members, etc.)
CREATE TABLE IF NOT EXISTS synthetic_colleagues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Basic info
  name TEXT NOT NULL,
  email TEXT,
  company TEXT NOT NULL,
  department TEXT,
  role_title TEXT,
  
  -- Profile data
  bio TEXT,
  skills TEXT[],
  experience_years INTEGER DEFAULT 0,
  location TEXT,
  
  -- Networking metadata
  connection_prompt TEXT, -- e.g. "Phil is a senior developer who could provide technical mentorship"
  networking_value TEXT, -- what value they bring to connections
  conversation_starters TEXT[],
  
  -- Company association
  is_active BOOLEAN DEFAULT true,
  colleague_type TEXT DEFAULT 'peer', -- peer, mentor, junior, manager
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user colleague connections table
CREATE TABLE IF NOT EXISTS user_colleague_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  colleague_id UUID NOT NULL REFERENCES synthetic_colleagues(id) ON DELETE CASCADE,
  
  -- Connection details
  connection_status TEXT DEFAULT 'suggested', -- suggested, connected, declined
  connection_date TIMESTAMP WITH TIME ZONE,
  connection_context TEXT, -- how they connected
  
  -- Interaction history
  last_interaction TIMESTAMP WITH TIME ZONE,
  interaction_count INTEGER DEFAULT 0,
  conversation_topics TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, colleague_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_work_experience_user_id ON user_work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_user_work_experience_current ON user_work_experience(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_user_education_user_id ON user_education(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id ON user_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_completion_user_id ON user_profile_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_synthetic_colleagues_company ON synthetic_colleagues(company);
CREATE INDEX IF NOT EXISTS idx_user_colleague_connections_user_id ON user_colleague_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_colleague_connections_status ON user_colleague_connections(user_id, connection_status);

-- Create updated_at triggers
CREATE TRIGGER update_user_work_experience_updated_at BEFORE UPDATE ON user_work_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_education_updated_at BEFORE UPDATE ON user_education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_certificates_updated_at BEFORE UPDATE ON user_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profile_completion_updated_at BEFORE UPDATE ON user_profile_completion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synthetic_colleagues_updated_at BEFORE UPDATE ON synthetic_colleagues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_colleague_connections_updated_at BEFORE UPDATE ON user_colleague_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert synthetic colleagues for CKDelta
INSERT INTO synthetic_colleagues (
  name, 
  email, 
  company, 
  department, 
  role_title, 
  bio, 
  skills, 
  experience_years, 
  location,
  connection_prompt,
  networking_value,
  conversation_starters,
  colleague_type
) VALUES 
  (
    'Phil Agafangelo',
    'phil@ckdelta.ai',
    'CKDelta',
    'Engineering',
    'Senior Developer',
    'Experienced full-stack developer with expertise in React, Node.js, and cloud architecture. Passionate about mentoring and building scalable systems.',
    ARRAY['React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'GraphQL', 'System Design'],
    8,
    'San Francisco, CA',
    'Phil is a senior developer who could provide technical mentorship and insights into modern web development practices.',
    'Technical expertise, mentoring, system design guidance',
    ARRAY[
      'What are your thoughts on the latest React patterns?',
      'How do you approach system design for scalable applications?',
      'What technologies are you most excited about lately?'
    ],
    'mentor'
  ),
  (
    'Sarah Chen',
    'sarah@ckdelta.ai',
    'CKDelta',
    'Product',
    'Product Manager',
    'Strategic product manager with a background in B2B SaaS. Focused on user experience and data-driven product decisions.',
    ARRAY['Product Strategy', 'User Research', 'Analytics', 'A/B Testing', 'Roadmap Planning', 'Stakeholder Management'],
    6,
    'Austin, TX',
    'Sarah could help you understand product thinking and how to align technical work with business objectives.',
    'Product strategy, user-centric thinking, business alignment',
    ARRAY[
      'How do you prioritize features in a product roadmap?',
      'What metrics do you use to measure product success?',
      'How do you gather and validate user feedback?'
    ],
    'peer'
  ),
  (
    'Marcus Rodriguez',
    'marcus@ckdelta.ai',
    'CKDelta',
    'Design',
    'UX Designer',
    'Creative UX designer with strong technical understanding. Specializes in design systems and user research.',
    ARRAY['UX Design', 'Design Systems', 'Figma', 'User Research', 'Prototyping', 'Accessibility'],
    5,
    'Portland, OR',
    'Marcus brings a design perspective that could enhance your understanding of user experience and interface design.',
    'Design thinking, user experience insights, creative problem solving',
    ARRAY[
      'What are your favorite design tools and workflows?',
      'How do you approach user research and testing?',
      'What makes a great design system?'
    ],
    'peer'
  )
ON CONFLICT DO NOTHING;

-- Create initial profile completion record for Dan Keegan
INSERT INTO user_profile_completion (
  user_id,
  completion_percentage,
  profile_quality,
  last_section_worked
) SELECT 
  'user_dan_keegan',
  20, -- Basic user info already exists
  'basic',
  'overview'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profile_completion WHERE user_id = 'user_dan_keegan'
);

-- Add some basic work experience for Dan to start
INSERT INTO user_work_experience (
  user_id,
  company_name,
  role_title,
  period_description,
  is_current,
  department,
  description,
  completion_status
) VALUES (
  'user_dan_keegan',
  'CKDelta',
  'Founder/CEO',
  'Q1 2023 - Present',
  true,
  'Leadership',
  'Building Quest AI platform to help professionals advance their careers through personalized AI coaching',
  'basic'
) ON CONFLICT DO NOTHING;