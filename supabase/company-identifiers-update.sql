-- Company Unique Identifiers Update
-- Add canonical identifiers to prevent duplicate companies

-- Add unique identifier columns to company_enrichments table
ALTER TABLE public.company_enrichments 
ADD COLUMN IF NOT EXISTS linkedin_company_url TEXT,
ADD COLUMN IF NOT EXISTS company_domain TEXT,
ADD COLUMN IF NOT EXISTS canonical_identifier TEXT;

-- Create unique constraint on canonical identifier
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_canonical_identifier 
ON company_enrichments(canonical_identifier) 
WHERE canonical_identifier IS NOT NULL;

-- Create index on LinkedIn company URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_linkedin_url 
ON company_enrichments(linkedin_company_url) 
WHERE linkedin_company_url IS NOT NULL;

-- Create index on company domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_domain 
ON company_enrichments(company_domain) 
WHERE company_domain IS NOT NULL;

-- Function to generate canonical identifier
CREATE OR REPLACE FUNCTION generate_canonical_identifier(
  company_name TEXT,
  linkedin_url TEXT DEFAULT NULL,
  domain TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  -- Priority: LinkedIn URL > Domain > Normalized Name
  IF linkedin_url IS NOT NULL AND linkedin_url != '' THEN
    RETURN linkedin_url;
  ELSIF domain IS NOT NULL AND domain != '' THEN
    RETURN domain;
  ELSE
    RETURN normalize_company_name(company_name);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to merge duplicate companies
CREATE OR REPLACE FUNCTION merge_duplicate_companies()
RETURNS TABLE(
  action TEXT,
  company_name TEXT,
  duplicate_count INTEGER,
  kept_id UUID,
  merged_ids UUID[]
) AS $$
DECLARE
  company_record RECORD;
  duplicate_record RECORD;
  kept_company_id UUID;
  merged_ids UUID[];
BEGIN
  -- Find companies with same normalized name
  FOR company_record IN
    SELECT 
      normalized_name,
      COUNT(*) as count,
      MIN(created_at) as earliest_created,
      ARRAY_AGG(id ORDER BY created_at) as company_ids,
      ARRAY_AGG(company_name ORDER BY created_at) as company_names
    FROM company_enrichments
    GROUP BY normalized_name
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the earliest created company
    kept_company_id := company_record.company_ids[1];
    merged_ids := company_record.company_ids[2:];
    
    -- Update profiles to point to kept company
    UPDATE apollo_profiles 
    SET company_enrichment_id = kept_company_id
    WHERE company_enrichment_id = ANY(merged_ids);
    
    -- Delete duplicate companies
    DELETE FROM company_enrichments 
    WHERE id = ANY(merged_ids);
    
    -- Return the merge action
    action := 'MERGED';
    company_name := company_record.company_names[1];
    duplicate_count := array_length(merged_ids, 1);
    kept_id := kept_company_id;
    
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to check for existing company by any identifier
CREATE OR REPLACE FUNCTION find_existing_company(
  search_name TEXT,
  search_linkedin_url TEXT DEFAULT NULL,
  search_domain TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  company_id UUID;
  canonical_id TEXT;
BEGIN
  -- Generate canonical identifier for search
  canonical_id := generate_canonical_identifier(search_name, search_linkedin_url, search_domain);
  
  -- Try to find by canonical identifier first
  SELECT id INTO company_id
  FROM company_enrichments
  WHERE canonical_identifier = canonical_id
  LIMIT 1;
  
  IF company_id IS NOT NULL THEN
    RETURN company_id;
  END IF;
  
  -- Try to find by LinkedIn URL
  IF search_linkedin_url IS NOT NULL THEN
    SELECT id INTO company_id
    FROM company_enrichments
    WHERE linkedin_company_url = search_linkedin_url
    LIMIT 1;
    
    IF company_id IS NOT NULL THEN
      RETURN company_id;
    END IF;
  END IF;
  
  -- Try to find by domain
  IF search_domain IS NOT NULL THEN
    SELECT id INTO company_id
    FROM company_enrichments
    WHERE company_domain = search_domain
    LIMIT 1;
    
    IF company_id IS NOT NULL THEN
      RETURN company_id;
    END IF;
  END IF;
  
  -- Try to find by normalized name (fallback)
  SELECT id INTO company_id
  FROM company_enrichments
  WHERE normalized_name = normalize_company_name(search_name)
  LIMIT 1;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing companies to set canonical identifiers
UPDATE company_enrichments 
SET canonical_identifier = generate_canonical_identifier(company_name, linkedin_company_url, company_domain)
WHERE canonical_identifier IS NULL;