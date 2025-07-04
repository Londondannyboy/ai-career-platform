-- Company Graph Tagging System
-- Comprehensive classification and verification system for companies

-- Company Categories and Tags
CREATE TABLE IF NOT EXISTS company_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  category_type VARCHAR(50) NOT NULL, -- 'industry', 'size', 'stage', 'tech_stack', 'market_segment'
  category_value TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0, -- 0.0 to 1.0 confidence score
  source TEXT DEFAULT 'manual', -- 'manual', 'ai_classified', 'apollo', 'linkedin', 'domain_analysis'
  metadata JSONB DEFAULT '{}', -- Additional classification data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Relationships (parent/subsidiary/partnerships)
CREATE TABLE IF NOT EXISTS company_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  child_company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- 'subsidiary', 'acquisition', 'partnership', 'competitor', 'vendor'
  confidence FLOAT DEFAULT 1.0,
  source TEXT DEFAULT 'manual',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_companies CHECK (parent_company_id != child_company_id)
);

-- User-Company Verification System
CREATE TABLE IF NOT EXISTS user_company_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk user ID
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL, -- User declared company name
  company_email TEXT, -- Company email for verification
  verification_method VARCHAR(50) DEFAULT 'self_declaration', -- 'self_declaration', 'email_domain', 'admin_approved'
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'expired'
  verification_code TEXT, -- Email verification code
  role_at_company VARCHAR(100), -- User's role/title
  department TEXT, -- User's department
  start_date DATE, -- When user started at company
  end_date DATE, -- When user left (null if current)
  is_current BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT true, -- Primary employer vs side gigs
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- For email verification codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Admin/Employee Roles
CREATE TABLE IF NOT EXISTS company_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Clerk user ID
  role VARCHAR(50) NOT NULL, -- 'admin', 'hr_manager', 'employee', 'contractor'
  permissions JSONB DEFAULT '{}', -- Role-specific permissions
  granted_by TEXT, -- User ID who granted this role
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- Company Intelligence Insights
CREATE TABLE IF NOT EXISTS company_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'growth_stage', 'hiring_trend', 'tech_adoption', 'market_position'
  insight_value TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  data_points JSONB DEFAULT '{}', -- Supporting evidence
  source TEXT DEFAULT 'ai_analysis',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Insights can become stale
);

-- Email Domain to Company Mapping
CREATE TABLE IF NOT EXISTS company_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES company_enrichments(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_type VARCHAR(50) DEFAULT 'corporate', -- 'corporate', 'subsidiary', 'legacy'
  verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(domain)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_categories_company_id ON company_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_company_categories_type ON company_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_company_categories_value ON company_categories(category_value);

CREATE INDEX IF NOT EXISTS idx_company_relationships_parent ON company_relationships(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_child ON company_relationships(child_company_id);
CREATE INDEX IF NOT EXISTS idx_company_relationships_type ON company_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_company_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_company_id ON user_company_verifications(company_id);
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON user_company_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_user_verifications_current ON user_company_verifications(is_current);

CREATE INDEX IF NOT EXISTS idx_company_roles_company_id ON company_user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_company_roles_user_id ON company_user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_company_intelligence_company_id ON company_intelligence(company_id);
CREATE INDEX IF NOT EXISTS idx_company_intelligence_type ON company_intelligence(insight_type);

CREATE INDEX IF NOT EXISTS idx_email_domains_company_id ON company_email_domains(company_id);
CREATE INDEX IF NOT EXISTS idx_email_domains_domain ON company_email_domains(domain);

-- Standard Industry Classifications
INSERT INTO company_categories (company_id, category_type, category_value, source) 
SELECT 
  id as company_id,
  'industry_preset' as category_type,
  'technology' as category_value,
  'system_preset' as source
FROM company_enrichments 
WHERE normalized_name LIKE '%tech%' OR normalized_name LIKE '%software%'
ON CONFLICT DO NOTHING;

-- Company Size Classifications (based on employee count)
WITH size_classifications AS (
  SELECT 
    id,
    CASE 
      WHEN employee_count < 10 THEN 'startup'
      WHEN employee_count < 50 THEN 'small'
      WHEN employee_count < 250 THEN 'medium'
      WHEN employee_count < 1000 THEN 'large'
      ELSE 'enterprise'
    END as size_category
  FROM company_enrichments 
  WHERE employee_count IS NOT NULL
)
INSERT INTO company_categories (company_id, category_type, category_value, source, confidence)
SELECT 
  id as company_id,
  'size' as category_type,
  size_category as category_value,
  'employee_count_analysis' as source,
  0.9 as confidence
FROM size_classifications
ON CONFLICT DO NOTHING;

-- Auto-populate email domains from existing company data
INSERT INTO company_email_domains (company_id, domain, domain_type, verified)
SELECT 
  id as company_id,
  company_domain as domain,
  'corporate' as domain_type,
  true as verified
FROM company_enrichments 
WHERE company_domain IS NOT NULL
  AND company_domain != ''
ON CONFLICT DO NOTHING;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_categories_updated_at 
    BEFORE UPDATE ON company_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_relationships_updated_at 
    BEFORE UPDATE ON company_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_company_verifications_updated_at 
    BEFORE UPDATE ON user_company_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_user_roles_updated_at 
    BEFORE UPDATE ON company_user_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON company_categories TO authenticated;
GRANT ALL ON company_relationships TO authenticated;
GRANT ALL ON user_company_verifications TO authenticated;
GRANT ALL ON company_user_roles TO authenticated;
GRANT ALL ON company_intelligence TO authenticated;
GRANT ALL ON company_email_domains TO authenticated;

-- Row Level Security
ALTER TABLE company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_email_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all company categories" ON company_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create company categories" ON company_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view all company relationships" ON company_relationships FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create company relationships" ON company_relationships FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own verifications" ON user_company_verifications FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can create their own verifications" ON user_company_verifications FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own verifications" ON user_company_verifications FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view roles for their companies" ON company_user_roles FOR SELECT USING (true);
CREATE POLICY "Company admins can manage roles" ON company_user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM company_user_roles cur 
    WHERE cur.company_id = company_user_roles.company_id 
    AND cur.user_id = auth.uid()::text 
    AND cur.role IN ('admin', 'hr_manager')
  )
);

CREATE POLICY "Users can view all company intelligence" ON company_intelligence FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create company intelligence" ON company_intelligence FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view all email domains" ON company_email_domains FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create email domains" ON company_email_domains FOR INSERT WITH CHECK (auth.role() = 'authenticated');