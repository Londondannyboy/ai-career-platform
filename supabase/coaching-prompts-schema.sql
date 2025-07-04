-- Coaching Prompts Schema with Vector Embeddings
-- For intelligent prompt selection and blending in the multi-agent coaching system

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create coaching prompts table
CREATE TABLE IF NOT EXISTS public.coaching_prompts (
  id TEXT PRIMARY KEY,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('base', 'specialized', 'company', 'relationship')),
  context_tags TEXT[] DEFAULT '{}',
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  author TEXT DEFAULT 'system',
  effectiveness_score FLOAT DEFAULT 0.8 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  usage_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_coaching_prompts_type ON public.coaching_prompts(prompt_type);
CREATE INDEX idx_coaching_prompts_tags ON public.coaching_prompts USING GIN(context_tags);
CREATE INDEX idx_coaching_prompts_effectiveness ON public.coaching_prompts(effectiveness_score DESC);
CREATE INDEX idx_coaching_prompts_active ON public.coaching_prompts(active) WHERE active = true;

-- Create vector similarity search index
CREATE INDEX idx_coaching_prompts_embedding ON public.coaching_prompts 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_coaching_prompts(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE(
  id TEXT,
  prompt_type TEXT,
  context_tags TEXT[],
  name TEXT,
  content TEXT,
  variables JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.prompt_type,
    cp.context_tags,
    cp.name,
    cp.content,
    cp.variables,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM public.coaching_prompts cp
  WHERE 
    cp.active = true
    AND cp.embedding IS NOT NULL
    AND (1 - (cp.embedding <=> query_embedding)) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_coaching_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_coaching_prompts_updated_at ON public.coaching_prompts;
CREATE TRIGGER update_coaching_prompts_updated_at
    BEFORE UPDATE ON public.coaching_prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_coaching_prompts_updated_at();

-- Create table for tracking prompt usage and feedback
CREATE TABLE IF NOT EXISTS public.prompt_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prompt_id TEXT REFERENCES public.coaching_prompts(id),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  coach_type TEXT,
  context JSONB,
  feedback TEXT CHECK (feedback IN ('positive', 'negative', 'neutral')),
  response_quality_score FLOAT CHECK (response_quality_score >= 0 AND response_quality_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for analytics
CREATE INDEX idx_prompt_usage_logs_prompt ON public.prompt_usage_logs(prompt_id);
CREATE INDEX idx_prompt_usage_logs_user ON public.prompt_usage_logs(user_id);
CREATE INDEX idx_prompt_usage_logs_created ON public.prompt_usage_logs(created_at);

-- Create view for prompt performance analytics
CREATE OR REPLACE VIEW public.prompt_performance_analytics AS
SELECT 
  cp.id,
  cp.name,
  cp.prompt_type,
  cp.context_tags,
  cp.effectiveness_score,
  cp.usage_count,
  COUNT(pul.id) AS recent_uses,
  AVG(CASE 
    WHEN pul.feedback = 'positive' THEN 1.0
    WHEN pul.feedback = 'negative' THEN 0.0
    ELSE 0.5
  END) AS feedback_score,
  AVG(pul.response_quality_score) AS avg_quality_score
FROM public.coaching_prompts cp
LEFT JOIN public.prompt_usage_logs pul ON cp.id = pul.prompt_id
  AND pul.created_at > NOW() - INTERVAL '30 days'
GROUP BY cp.id, cp.name, cp.prompt_type, cp.context_tags, cp.effectiveness_score, cp.usage_count;

-- Grant permissions
GRANT ALL ON public.coaching_prompts TO authenticated;
GRANT ALL ON public.prompt_usage_logs TO authenticated;
GRANT SELECT ON public.prompt_performance_analytics TO authenticated;

-- Sample data for initial prompts (will be populated by the application)
-- The application will insert the actual prompts with embeddings

-- Helpful queries for monitoring

-- Find most effective prompts
-- SELECT * FROM prompt_performance_analytics 
-- WHERE recent_uses > 10 
-- ORDER BY feedback_score DESC, avg_quality_score DESC;

-- Find prompts that need improvement
-- SELECT * FROM prompt_performance_analytics 
-- WHERE recent_uses > 5 AND feedback_score < 0.5
-- ORDER BY feedback_score ASC;

-- Find similar prompts to a given prompt
-- SELECT a.name, b.name, 1 - (a.embedding <=> b.embedding) as similarity
-- FROM coaching_prompts a, coaching_prompts b
-- WHERE a.id != b.id 
-- AND 1 - (a.embedding <=> b.embedding) > 0.9
-- ORDER BY similarity DESC;