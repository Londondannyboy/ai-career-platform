import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { promptRouter } from '@/lib/prompts/promptRouter'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Initializing coaching prompts system...')
    
    // Create the coaching prompts table
    await sql`
      CREATE EXTENSION IF NOT EXISTS vector;
    `
    
    await sql`
      CREATE TABLE IF NOT EXISTS coaching_prompts (
        id TEXT PRIMARY KEY,
        prompt_type TEXT NOT NULL CHECK (prompt_type IN ('base', 'specialized', 'company', 'relationship')),
        context_tags TEXT[] DEFAULT '{}',
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        variables JSONB DEFAULT '{}',
        embedding vector(1536),
        author TEXT DEFAULT 'system',
        effectiveness_score FLOAT DEFAULT 0.8 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
        usage_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_coaching_prompts_type ON coaching_prompts(prompt_type)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_coaching_prompts_tags ON coaching_prompts USING GIN(context_tags)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_coaching_prompts_effectiveness ON coaching_prompts(effectiveness_score DESC)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_coaching_prompts_active ON coaching_prompts(active) WHERE active = true
    `
    
    // Create vector similarity search index
    await sql`
      CREATE INDEX IF NOT EXISTS idx_coaching_prompts_embedding ON coaching_prompts 
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `
    
    // Create usage logs table
    await sql`
      CREATE TABLE IF NOT EXISTS prompt_usage_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        prompt_id TEXT REFERENCES coaching_prompts(id),
        session_id TEXT NOT NULL,
        user_id UUID,
        coach_type TEXT,
        context JSONB,
        feedback TEXT CHECK (feedback IN ('positive', 'negative', 'neutral')),
        response_quality_score FLOAT CHECK (response_quality_score >= 0 AND response_quality_score <= 1),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create semantic search function
    await sql`
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
        FROM coaching_prompts cp
        WHERE 
          cp.active = true
          AND cp.embedding IS NOT NULL
          AND (1 - (cp.embedding <=> query_embedding)) > match_threshold
        ORDER BY cp.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$
    `
    
    // Check if prompts already exist
    const { rows: existingPrompts } = await sql`
      SELECT COUNT(*) as count FROM coaching_prompts
    `
    
    const promptCount = parseInt(existingPrompts[0]?.count || '0')
    
    if (promptCount === 0) {
      console.log('📝 No existing prompts found. Initializing default prompts...')
      // The promptRouter will initialize default prompts automatically
    } else {
      console.log(`✅ Found ${promptCount} existing prompts`)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Coaching prompts system initialized successfully',
      stats: {
        existingPrompts: promptCount,
        tablesCreated: ['coaching_prompts', 'prompt_usage_logs'],
        indexesCreated: 4,
        functionsCreated: ['search_coaching_prompts']
      }
    })
    
  } catch (error) {
    console.error('❌ Error initializing prompts system:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize prompts system',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}