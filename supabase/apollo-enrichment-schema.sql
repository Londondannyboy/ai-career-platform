-- Apollo Enrichment Schema Extension
-- Stores company and employee data from Apollo API to prevent duplicate API calls

-- Company enrichment tracking table
CREATE TABLE IF NOT EXISTS public.company_enrichments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL, -- Lowercase, trimmed version for matching
  apollo_organization_id TEXT,
  total_employees INTEGER,
  last_crawled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  crawled_by TEXT NOT NULL, -- User ID who initiated the crawl
  metadata JSONB DEFAULT '{}'::jsonb, -- Store company details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apollo profiles table (stores individual employee data)
CREATE TABLE IF NOT EXISTS public.apollo_profiles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  apollo_id TEXT UNIQUE NOT NULL,
  company_enrichment_id uuid REFERENCES company_enrichments(id) ON DELETE CASCADE,
  
  -- Basic info
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  email_status TEXT, -- verified, unverified, etc.
  
  -- Professional info
  title TEXT,
  headline TEXT,
  seniority TEXT,
  departments TEXT[], -- Array of departments
  
  -- LinkedIn data
  linkedin_url TEXT,
  photo_url TEXT,
  
  -- Location
  city TEXT,
  state TEXT,
  country TEXT,
  
  -- Organization info
  organization_name TEXT,
  organization_id TEXT,
  
  -- Employment history (stored as JSONB)
  employment_history JSONB DEFAULT '[]'::jsonb,
  
  -- Full Apollo data for reference
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_company_enrichments_normalized_name ON company_enrichments(normalized_name);
CREATE INDEX idx_company_enrichments_last_crawled ON company_enrichments(last_crawled_at);
CREATE INDEX idx_apollo_profiles_company ON apollo_profiles(company_enrichment_id);
CREATE INDEX idx_apollo_profiles_seniority ON apollo_profiles(seniority);
CREATE INDEX idx_apollo_profiles_departments ON apollo_profiles USING GIN(departments);
CREATE INDEX idx_apollo_profiles_title ON apollo_profiles(title);
CREATE INDEX idx_apollo_profiles_email ON apollo_profiles(email);

-- Function to normalize company names for matching
CREATE OR REPLACE FUNCTION normalize_company_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if company data is stale (default: 30 days)
CREATE OR REPLACE FUNCTION is_company_data_stale(
  company TEXT,
  days_threshold INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  last_crawl TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT last_crawled_at INTO last_crawl
  FROM company_enrichments
  WHERE normalized_name = normalize_company_name(company);
  
  IF last_crawl IS NULL THEN
    RETURN TRUE; -- Never crawled
  END IF;
  
  RETURN (NOW() - last_crawl) > INTERVAL '1 day' * days_threshold;
END;
$$ LANGUAGE plpgsql;

-- View for easy access to enriched profiles with company info
CREATE OR REPLACE VIEW enriched_profiles_view AS
SELECT 
  ap.*,
  ce.company_name,
  ce.last_crawled_at,
  ce.total_employees as company_total_employees,
  EXTRACT(EPOCH FROM (NOW() - ce.last_crawled_at))/86400 as days_since_crawl
FROM apollo_profiles ap
JOIN company_enrichments ce ON ap.company_enrichment_id = ce.id;

-- Admin permission check function (you'll need to implement your admin logic)
CREATE OR REPLACE FUNCTION is_admin_user(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- For now, return true for test user or implement your admin check
  RETURN user_id = 'test-user-123' OR user_id LIKE 'admin_%';
  -- TODO: Implement proper admin check based on your user system
END;
$$ LANGUAGE plpgsql;