-- Enhanced Company Enrichment Schema with Caching Support
-- For Neon.tech PostgreSQL database

-- Create or update the company_enrichments table with caching fields
CREATE TABLE IF NOT EXISTS public.company_enrichments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name TEXT NOT NULL UNIQUE,
    normalized_name TEXT NOT NULL,
    canonical_identifier TEXT, -- LinkedIn company URL or primary identifier
    employee_count INTEGER DEFAULT 0,
    last_enriched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enrichment_type TEXT DEFAULT 'harvestapi', -- 'harvestapi', 'apollo', etc.
    enrichment_data JSONB, -- Full enrichment data for caching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_enrichments_normalized_name ON public.company_enrichments(normalized_name);
CREATE INDEX IF NOT EXISTS idx_company_enrichments_canonical_identifier ON public.company_enrichments(canonical_identifier);
CREATE INDEX IF NOT EXISTS idx_company_enrichments_last_enriched ON public.company_enrichments(last_enriched);
CREATE INDEX IF NOT EXISTS idx_company_enrichments_company_name_lower ON public.company_enrichments(LOWER(company_name));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_company_enrichments_updated_at ON public.company_enrichments;
CREATE TRIGGER update_company_enrichments_updated_at
    BEFORE UPDATE ON public.company_enrichments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add cache status view for easy querying
CREATE OR REPLACE VIEW public.company_enrichments_with_cache_status AS
SELECT 
    *,
    CASE 
        WHEN last_enriched > NOW() - INTERVAL '7 days' THEN 'fresh'
        WHEN last_enriched > NOW() - INTERVAL '30 days' THEN 'stale'
        ELSE 'expired'
    END as cache_status,
    EXTRACT(DAYS FROM NOW() - last_enriched)::integer as days_since_enriched
FROM public.company_enrichments;

-- Sample data migration (if needed to update existing records)
-- UPDATE public.company_enrichments 
-- SET enrichment_type = 'harvestapi' 
-- WHERE enrichment_type IS NULL;

-- Add some helpful constraints
ALTER TABLE public.company_enrichments 
ADD CONSTRAINT check_employee_count_positive 
CHECK (employee_count >= 0);

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL ON public.company_enrichments TO your_app_user;
-- GRANT SELECT ON public.company_enrichments_with_cache_status TO your_app_user;