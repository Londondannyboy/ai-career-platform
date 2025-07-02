-- Essential tables for Quest workspace management
-- Copy and paste this entire file into Neon.tech SQL editor

-- Enable vector extension for document embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create access level enum
CREATE TYPE access_level AS ENUM ('private', 'team', 'company', 'public');

-- Create document type enum  
CREATE TYPE document_type AS ENUM ('product_spec', 'sales_deck', 'case_study', 'pricing', 'competitor_analysis', 'proposal', 'whitepaper');

-- Company Workspaces table
CREATE TABLE public.company_workspaces (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  collaborators JSONB DEFAULT '[]'::jsonb,
  access_level access_level DEFAULT 'private',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Documents table
CREATE TABLE public.company_documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.company_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  document_type document_type NOT NULL,
  content_preview TEXT,
  full_content TEXT,
  extracted_entities JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  auto_tags TEXT[] DEFAULT '{}',
  uploaded_by TEXT NOT NULL,
  access_level access_level DEFAULT 'team',
  file_url TEXT,
  embedding_stored BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Embeddings table for vector search
CREATE TABLE public.document_embeddings (
  id SERIAL PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.company_documents(id) ON DELETE CASCADE,
  content_chunk TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536), -- OpenAI embedding dimensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace Chat History table
CREATE TABLE public.workspace_chats (
  id SERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES public.company_workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  documents_used JSONB DEFAULT '[]'::jsonb,
  confidence INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_company_workspaces_owner ON public.company_workspaces(owner_id);
CREATE INDEX idx_company_documents_workspace ON public.company_documents(workspace_id);
CREATE INDEX idx_document_embeddings_document ON public.document_embeddings(document_id);
CREATE INDEX idx_workspace_chats_workspace ON public.workspace_chats(workspace_id);

-- Create vector similarity index for fast search
CREATE INDEX document_embeddings_embedding_idx ON public.document_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);