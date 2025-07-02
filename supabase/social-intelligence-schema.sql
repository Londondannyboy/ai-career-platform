-- Quest Social Intelligence & Document Management Schema Extension
-- Run this after the main schema.sql

-- Enable vector extension for embeddings
create extension if not exists vector;

-- Create additional custom types for social intelligence
create type post_type as enum ('text', 'article', 'image', 'video', 'document', 'poll');
create type sentiment_type as enum ('positive', 'neutral', 'negative');
create type signal_type as enum ('hiring', 'promotion', 'new_tool', 'frustration', 'success', 'event', 'expansion', 'funding', 'migration');
create type document_type as enum ('product_spec', 'sales_deck', 'case_study', 'pricing', 'competitor_analysis', 'proposal', 'whitepaper');
create type access_level as enum ('private', 'team', 'company', 'public');
create type data_source as enum ('apollo', 'apify', 'datamagnet', 'manual', 'linkedin', 'web_scraping');

-- Unified Profiles table (synthetic and real users)
create table public.unified_profiles (
  id uuid default uuid_generate_v4() primary key,
  linkedin_url text unique not null,
  email text,
  
  -- Core profile data
  name text not null,
  title text,
  company text,
  department text,
  location text,
  headline text,
  summary text,
  
  -- Synthetic hierarchy data
  hierarchy_level integer default 5, -- 1-9 (CEO to Intern)
  reports_to uuid references public.unified_profiles(id),
  direct_reports uuid[] default '{}',
  peers uuid[] default '{}',
  
  -- Data source tracking
  primary_source data_source default 'manual',
  confidence integer default 50, -- 0-100 overall confidence
  sources jsonb default '[]'::jsonb, -- Array of data source objects
  
  -- User claiming system
  claimed_by uuid references public.users(id),
  claimed_at timestamp with time zone,
  verified boolean default false,
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_sync_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Social Posts table for LinkedIn and other social media
create table public.social_posts (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.unified_profiles(id) on delete cascade not null,
  platform varchar(50) default 'linkedin',
  
  -- Post content
  content text not null,
  post_type post_type default 'text',
  url text,
  
  -- Engagement metrics
  likes_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,
  reactions jsonb default '{}'::jsonb,
  
  -- AI analysis
  topics text[] default '{}',
  sentiment sentiment_type default 'neutral',
  business_signals jsonb default '[]'::jsonb,
  mentioned_companies text[] default '{}',
  mentioned_products text[] default '{}',
  
  -- Metadata
  published_at timestamp with time zone not null,
  scraped_at timestamp with time zone default timezone('utc'::text, now()) not null,
  confidence integer default 75, -- Scraping accuracy confidence
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Buying Signals table
create table public.buying_signals (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.unified_profiles(id) on delete cascade not null,
  company_name text not null,
  
  -- Signal details
  signal_type signal_type not null,
  strength integer not null check (strength >= 0 and strength <= 100),
  source varchar(100) not null, -- 'linkedin_post', 'job_posting', 'company_announcement'
  description text not null,
  evidence text, -- Supporting evidence/quote
  
  -- Product relevance
  relevant_products text[] default '{}',
  relevant_categories text[] default '{}',
  
  -- Metadata
  detected_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Products table
create table public.user_products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Product details
  name varchar(255) not null,
  category varchar(100) not null, -- 'sales', 'hr', 'marketing', 'engineering', 'finance'
  description text,
  
  -- Target market
  target_departments text[] default '{}',
  decision_maker_titles text[] default '{}',
  price_range varchar(50), -- 'enterprise', 'mid-market', 'smb'
  
  -- Product intelligence
  use_cases jsonb default '{}'::jsonb,
  competitors text[] default '{}',
  key_features text[] default '{}',
  
  -- Metadata
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Decision Maker Rules table
create table public.decision_maker_rules (
  id uuid default uuid_generate_v4() primary key,
  product_category varchar(100) not null,
  department varchar(100) not null,
  
  -- Hierarchy matching
  decision_maker_levels integer[] default '{}', -- [4, 5] (Director, Senior Manager)
  required_titles text[] default '{}', -- ['head of', 'director', 'vp']
  
  -- Scoring weights
  influence_score integer default 50 check (influence_score >= 0 and influence_score <= 100),
  budget_authority boolean default false,
  technical_evaluator boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Company Workspaces table
create table public.company_workspaces (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  display_name text not null,
  description text,
  
  -- Access control
  owner_id uuid references public.users(id) on delete cascade not null,
  collaborators uuid[] default '{}', -- User IDs with access
  access_level access_level default 'private',
  
  -- Settings
  settings jsonb default '{
    "autoTagging": true,
    "aiSummaries": true,
    "competitorTracking": true
  }'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Company Documents table
create table public.company_documents (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.company_workspaces(id) on delete cascade not null,
  
  -- Document metadata
  title text not null,
  file_name text not null,
  file_type varchar(10) not null, -- 'pdf', 'docx', 'pptx', 'txt'
  document_type document_type not null,
  file_size bigint,
  
  -- Content and processing
  content_preview text, -- First 1000 characters
  full_content text, -- Complete extracted text
  
  -- AI extraction
  extracted_entities jsonb default '{}'::jsonb,
  tags text[] default '{}',
  auto_tags text[] default '{}', -- AI-generated tags
  
  -- Access control
  uploaded_by uuid references public.users(id) on delete cascade not null,
  access_level access_level default 'team',
  
  -- Storage reference
  file_url text, -- Supabase storage URL
  embedding_stored boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now') not null
);

-- Document Embeddings table (for vector search)
create table public.document_embeddings (
  id uuid default uuid_generate_v4() primary key,
  document_id uuid references public.company_documents(id) on delete cascade not null,
  
  -- Content chunking for large documents
  content_chunk text not null,
  chunk_index integer default 0,
  chunk_metadata jsonb default '{}'::jsonb,
  
  -- Vector embedding
  embedding vector(1536), -- OpenAI embedding dimension
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Workspace Chat History table
create table public.workspace_chats (
  id uuid default uuid_generate_v4() primary key,
  workspace_id uuid references public.company_workspaces(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Chat interaction
  query text not null,
  response text not null,
  documents_used uuid[] default '{}', -- Document IDs referenced
  
  -- AI metrics
  confidence integer default 75,
  processing_time_ms integer,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Company Tech Stack table (for competitive intelligence)
create table public.company_tech_stack (
  id uuid default uuid_generate_v4() primary key,
  company_name text not null,
  
  -- Product information
  product_name text not null,
  category varchar(100) not null,
  vendor text,
  
  -- Detection confidence
  confidence integer default 50 check (confidence >= 0 and confidence <= 100),
  source varchar(50) not null, -- 'linkedin_posts', 'job_listings', 'employee_titles'
  evidence text,
  
  discovered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  verified_at timestamp with time zone,
  verified_by uuid references public.users(id)
);

-- Notification System for buying signals and updates
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Notification details
  type varchar(50) not null, -- 'buying_signal', 'document_upload', 'profile_claim', 'workspace_invite'
  title text not null,
  message text not null,
  
  -- Related entities
  related_profile_id uuid references public.unified_profiles(id),
  related_workspace_id uuid references public.company_workspaces(id),
  related_document_id uuid references public.company_documents(id),
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  read boolean default false,
  read_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for optimal performance
create index idx_unified_profiles_linkedin_url on public.unified_profiles(linkedin_url);
create index idx_unified_profiles_company on public.unified_profiles(company);
create index idx_unified_profiles_claimed_by on public.unified_profiles(claimed_by);
create index idx_unified_profiles_hierarchy_level on public.unified_profiles(hierarchy_level);

create index idx_social_posts_profile_id on public.social_posts(profile_id);
create index idx_social_posts_published_at on public.social_posts(published_at desc);
create index idx_social_posts_platform on public.social_posts(platform);
create index idx_social_posts_topics on public.social_posts using gin(topics);

create index idx_buying_signals_profile_id on public.buying_signals(profile_id);
create index idx_buying_signals_company on public.buying_signals(company_name);
create index idx_buying_signals_detected_at on public.buying_signals(detected_at desc);
create index idx_buying_signals_strength on public.buying_signals(strength desc);

create index idx_user_products_user_id on public.user_products(user_id);
create index idx_user_products_category on public.user_products(category);

create index idx_company_workspaces_owner_id on public.company_workspaces(owner_id);
create index idx_company_workspaces_company_name on public.company_workspaces(company_name);

create index idx_company_documents_workspace_id on public.company_documents(workspace_id);
create index idx_company_documents_uploaded_by on public.company_documents(uploaded_by);
create index idx_company_documents_document_type on public.company_documents(document_type);
create index idx_company_documents_tags on public.company_documents using gin(tags);

create index idx_document_embeddings_document_id on public.document_embeddings(document_id);
-- Vector similarity search index
create index idx_document_embeddings_vector on public.document_embeddings using ivfflat (embedding vector_cosine_ops);

create index idx_workspace_chats_workspace_id on public.workspace_chats(workspace_id);
create index idx_workspace_chats_user_id on public.workspace_chats(user_id);
create index idx_workspace_chats_created_at on public.workspace_chats(created_at desc);

create index idx_company_tech_stack_company on public.company_tech_stack(company_name);
create index idx_company_tech_stack_product on public.company_tech_stack(product_name);
create index idx_company_tech_stack_confidence on public.company_tech_stack(confidence desc);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_read on public.notifications(read);
create index idx_notifications_created_at on public.notifications(created_at desc);

-- Enable Row Level Security for all new tables
alter table public.unified_profiles enable row level security;
alter table public.social_posts enable row level security;
alter table public.buying_signals enable row level security;
alter table public.user_products enable row level security;
alter table public.decision_maker_rules enable row level security;
alter table public.company_workspaces enable row level security;
alter table public.company_documents enable row level security;
alter table public.document_embeddings enable row level security;
alter table public.workspace_chats enable row level security;
alter table public.company_tech_stack enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies for Social Intelligence tables

-- Unified Profiles: Public profiles visible, claimed profiles controlled by claimers
create policy "Public unified profiles viewable by everyone" on public.unified_profiles
  for select using (claimed_by is null or verified = false);

create policy "Users can view claimed profiles they own" on public.unified_profiles
  for select using (auth.uid() = claimed_by);

create policy "Users can update their claimed profiles" on public.unified_profiles
  for update using (auth.uid() = claimed_by);

create policy "Users can claim unclaimed profiles" on public.unified_profiles
  for update using (claimed_by is null and auth.uid() is not null);

-- Social Posts: Viewable by everyone for business intelligence
create policy "Social posts viewable by authenticated users" on public.social_posts
  for select using (auth.role() = 'authenticated');

-- Buying Signals: Viewable by authenticated users
create policy "Buying signals viewable by authenticated users" on public.buying_signals
  for select using (auth.role() = 'authenticated');

-- User Products: Users manage their own products
create policy "Users can manage their own products" on public.user_products
  for all using (auth.uid() = user_id);

-- Decision Maker Rules: Readable by all, manageable by admins
create policy "Decision maker rules readable by authenticated users" on public.decision_maker_rules
  for select using (auth.role() = 'authenticated');

-- Company Workspaces: Owner and collaborators access
create policy "Workspace owners can manage their workspaces" on public.company_workspaces
  for all using (auth.uid() = owner_id);

create policy "Workspace collaborators can view workspaces" on public.company_workspaces
  for select using (auth.uid() = any(collaborators));

-- Company Documents: Workspace-based access control
create policy "Document access based on workspace access" on public.company_documents
  for select using (
    exists (
      select 1 from public.company_workspaces cw 
      where cw.id = workspace_id 
      and (cw.owner_id = auth.uid() or auth.uid() = any(cw.collaborators))
    )
  );

create policy "Users can upload documents to their workspaces" on public.company_documents
  for insert with check (
    exists (
      select 1 from public.company_workspaces cw 
      where cw.id = workspace_id 
      and (cw.owner_id = auth.uid() or auth.uid() = any(cw.collaborators))
    )
  );

-- Document Embeddings: Same access as documents
create policy "Document embeddings access follows document access" on public.document_embeddings
  for select using (
    exists (
      select 1 from public.company_documents cd
      join public.company_workspaces cw on cd.workspace_id = cw.id
      where cd.id = document_id 
      and (cw.owner_id = auth.uid() or auth.uid() = any(cw.collaborators))
    )
  );

-- Workspace Chats: Workspace members only
create policy "Workspace chat access for members" on public.workspace_chats
  for all using (
    exists (
      select 1 from public.company_workspaces cw 
      where cw.id = workspace_id 
      and (cw.owner_id = auth.uid() or auth.uid() = any(cw.collaborators))
    )
  );

-- Company Tech Stack: Readable by authenticated users
create policy "Company tech stack readable by authenticated users" on public.company_tech_stack
  for select using (auth.role() = 'authenticated');

-- Notifications: Users see their own notifications
create policy "Users can manage their own notifications" on public.notifications
  for all using (auth.uid() = user_id);

-- Create functions for common operations

-- Function to get company hierarchy
create or replace function get_company_hierarchy(company_name text)
returns table (
  id uuid,
  name text,
  title text,
  department text,
  hierarchy_level integer,
  manager_id uuid,
  direct_reports_count bigint
) as $$
begin
  return query
  select 
    up.id,
    up.name,
    up.title,
    up.department,
    up.hierarchy_level,
    up.reports_to as manager_id,
    array_length(up.direct_reports, 1)::bigint as direct_reports_count
  from public.unified_profiles up
  where up.company ilike company_name
  order by up.hierarchy_level, up.department, up.name;
end;
$$ language plpgsql security definer;

-- Function to detect buying signals from posts
create or replace function detect_buying_signals_from_posts()
returns trigger as $$
declare
  signals jsonb;
  signal jsonb;
begin
  -- Extract business signals from the post analysis
  if new.business_signals is not null then
    for signal in select jsonb_array_elements(new.business_signals)
    loop
      insert into public.buying_signals (
        profile_id,
        company_name,
        signal_type,
        strength,
        source,
        description,
        evidence,
        relevant_categories,
        detected_at
      ) values (
        new.profile_id,
        coalesce((select company from public.unified_profiles where id = new.profile_id), 'Unknown'),
        (signal->>'type')::signal_type,
        (signal->>'confidence')::integer,
        'linkedin_post',
        signal->>'evidence',
        substring(new.content, 1, 500),
        array(select jsonb_array_elements_text(signal->'relevantFor')),
        new.published_at
      );
    end loop;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for automatic buying signal detection
create trigger trigger_detect_buying_signals
  after insert on public.social_posts
  for each row execute function detect_buying_signals_from_posts();

-- Function to update profile confidence based on data sources
create or replace function update_profile_confidence()
returns trigger as $$
declare
  total_weight numeric := 0;
  weighted_sum numeric := 0;
  source_record jsonb;
begin
  -- Calculate weighted confidence based on all data sources
  if new.sources is not null then
    for source_record in select jsonb_array_elements(new.sources)
    loop
      total_weight := total_weight + (source_record->>'quality')::numeric;
      weighted_sum := weighted_sum + 
        ((source_record->>'quality')::numeric * (source_record->>'confidence')::numeric);
    end loop;
    
    if total_weight > 0 then
      new.confidence := round(weighted_sum / total_weight);
    end if;
  end if;
  
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for profile confidence updates
create trigger trigger_update_profile_confidence
  before update on public.unified_profiles
  for each row execute function update_profile_confidence();