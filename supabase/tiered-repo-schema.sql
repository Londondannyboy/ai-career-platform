-- Tiered Repository System for Quest
-- Four-level professional repository with controlled access

-- Add new enums for repo levels and request types
create type repo_tier as enum ('SURFACE', 'MID', 'DEEP', 'FULL');
create type network_request_type as enum ('CONNECTION', 'MID_ACCESS', 'DEEP_ACCESS', 'FULL_ACCESS');
create type export_format as enum ('PDF_STANDARD', 'PDF_TECH', 'PDF_CREATIVE', 'PDF_EXECUTIVE', 'PDF_STARTUP');

-- Surface Repo - Public LinkedIn-style profile
create table public.surface_repo (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  
  -- Basic Information
  professional_headline text not null,
  summary text,
  current_role text,
  current_company text,
  location text,
  
  -- Experience
  work_experience jsonb[] default '{}', -- {title, company, duration, description, achievements[]}
  education jsonb[] default '{}', -- {institution, degree, field, year, honors}
  certifications jsonb[] default '{}', -- {name, issuer, date, credential_id}
  
  -- Skills & Endorsements
  core_skills text[] default '{}',
  skill_endorsements jsonb default '{}', -- {skill: count}
  languages jsonb[] default '{}', -- {language, proficiency}
  
  -- Portfolio & Links
  portfolio_items jsonb[] default '{}', -- {title, description, url, type, featured}
  social_links jsonb default '{}', -- {platform: url}
  
  -- Export Settings
  preferred_export_format export_format default 'PDF_STANDARD',
  custom_templates jsonb default '{}', -- Job-specific template preferences
  
  -- Visibility & Privacy
  is_public boolean default true,
  is_searchable boolean default true,
  show_contact_info boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Mid Repo - Professional depth for recruiters
create table public.mid_repo (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  
  -- Detailed Professional Information
  detailed_achievements jsonb[] default '{}', -- {role, company, metrics, impact, context}
  project_deep_dives jsonb[] default '{}', -- {title, role, challenge, solution, outcome, technologies}
  leadership_examples jsonb[] default '{}', -- {situation, action, result, team_size, duration}
  
  -- Performance & Recognition
  performance_reviews jsonb[] default '{}', -- {period, company, highlights, ratings}
  awards_recognition jsonb[] default '{}', -- {title, organization, year, description}
  peer_recommendations jsonb[] default '{}', -- {recommender, relationship, text, date}
  
  -- Career Progression
  salary_progression jsonb[] default '{}', -- {role, company, year, range, equity}
  career_transitions jsonb[] default '{}', -- {from_role, to_role, reason, challenges, outcomes}
  industry_expertise jsonb[] default '{}', -- {domain, years, depth, notable_work}
  
  -- Professional Network
  internal_referrals jsonb[] default '{}', -- {company, contact_name, relationship}
  mentorship_given jsonb[] default '{}', -- {mentee_role, duration, outcomes}
  mentorship_received jsonb[] default '{}', -- {mentor_name, focus, duration}
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Deep Repo - Authentic peer/coach sharing
create table public.deep_repo (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  
  -- Honest Self-Assessment
  core_strengths jsonb[] default '{}', -- {strength, evidence, development_stage}
  growth_areas jsonb[] default '{}', -- {area, current_level, target, action_plan}
  working_style jsonb default '{}', -- {preferences, communication, decision_making}
  
  -- Learning & Development
  skill_gaps jsonb[] default '{}', -- {skill, importance, current_level, learning_plan}
  failed_experiments jsonb[] default '{}', -- {attempt, context, lesson_learned, next_steps}
  feedback_received jsonb[] default '{}', -- {source, topic, feedback, action_taken}
  
  -- Professional Challenges
  career_obstacles jsonb[] default '{}', -- {challenge, impact, coping_strategy, outcome}
  difficult_decisions jsonb[] default '{}', -- {situation, options, choice, reasoning, result}
  conflicts_resolved jsonb[] default '{}', -- {context, approach, outcome, learning}
  
  -- Peer Insights
  360_feedback jsonb[] default '{}', -- {reviewer_role, strengths, improvements, overall}
  collaboration_style jsonb default '{}', -- {approach, preferences, effectiveness}
  leadership_philosophy jsonb default '{}', -- {beliefs, approach, examples}
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Full Repo - Life goals and personal mission
create table public.full_repo (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade unique not null,
  
  -- Life & Career Vision
  personal_mission text,
  life_goals jsonb[] default '{}', -- {goal, timeline, progress, obstacles}
  career_aspirations jsonb[] default '{}', -- {role, industry, timeline, steps}
  legacy_goals jsonb[] default '{}', -- {impact, timeline, measures}
  
  -- Values & Motivation
  core_values jsonb[] default '{}', -- {value, description, examples}
  motivations jsonb[] default '{}', -- {driver, context, evolution}
  deal_breakers jsonb[] default '{}', -- {factor, reason, flexibility}
  
  -- Work-Life Integration
  life_priorities jsonb[] default '{}', -- {priority, weight, balance_strategy}
  family_considerations jsonb default '{}', -- {commitments, constraints, support}
  geographic_preferences jsonb default '{}', -- {locations, flexibility, reasons}
  
  -- Personal Development
  character_development jsonb[] default '{}', -- {trait, current_state, desired_state}
  life_lessons jsonb[] default '{}', -- {lesson, source, application}
  support_network jsonb[] default '{}', -- {person, relationship, support_type}
  
  -- Future Planning
  scenario_planning jsonb[] default '{}', -- {scenario, probability, preparation}
  contingency_plans jsonb[] default '{}', -- {situation, response, resources_needed}
  retirement_vision jsonb default '{}', -- {timeline, lifestyle, preparation}
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Network Requests - Enhanced for repo-level access
create table public.network_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  request_type network_request_type not null,
  
  -- Request Details
  purpose text not null,
  message text,
  professional_context text, -- How they know each other
  mutual_connections text[], -- Shared network members
  
  -- Justification for Access Level
  access_justification text, -- Why they need this level
  intended_use text, -- How they plan to use the information
  referral_source text, -- Who referred them or how they found the person
  
  -- Status & Timeline
  status request_status default 'PENDING' not null,
  expires_at timestamp with time zone, -- Auto-expire requests
  responded_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(sender_id, receiver_id, request_type)
);

-- Repo Access Permissions - Track who can see what level
create table public.repo_access (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  granted_to_id uuid references public.users(id) on delete cascade not null,
  
  -- Access Levels
  surface_access boolean default true, -- Everyone gets surface by default if public
  mid_access boolean default false,
  deep_access boolean default false,
  full_access boolean default false,
  
  -- Access Context
  relationship_type text, -- colleague, manager, coach, friend, etc.
  granted_reason text, -- Why access was granted
  access_source text, -- How the access was obtained
  
  -- Time & Usage Tracking
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone, -- Optional expiration
  last_accessed timestamp with time zone,
  access_count integer default 0,
  
  -- Permissions
  can_export_pdf boolean default false, -- Can export surface repo as PDF
  can_add_feedback boolean default false, -- Can add feedback to deep repo
  can_see_network boolean default false, -- Can see network connections
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(owner_id, granted_to_id)
);

-- PDF Export Templates - Job-optimized formats
create table public.pdf_templates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  template_name text not null,
  job_type text not null, -- tech, creative, executive, startup, etc.
  industry text,
  
  -- Template Configuration
  sections_included text[] default '{}', -- Which surface repo sections to include
  section_order text[] default '{}', -- Order of sections
  emphasis_areas text[] default '{}', -- Which areas to highlight
  
  -- Styling
  color_scheme text default 'professional',
  font_choice text default 'modern',
  layout_style text default 'clean',
  
  -- Content Customization
  custom_summary text, -- Job-specific summary override
  skills_filter text[], -- Which skills to emphasize
  experience_filter jsonb default '{}', -- How to present experience
  
  is_default boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Feedback & Endorsements for Deep Repo
create table public.peer_feedback (
  id uuid default uuid_generate_v4() primary key,
  feedback_giver_id uuid references public.users(id) on delete cascade not null,
  feedback_receiver_id uuid references public.users(id) on delete cascade not null,
  
  -- Feedback Content
  strengths_observed text[],
  growth_suggestions text[],
  collaboration_rating integer check (collaboration_rating >= 1 and collaboration_rating <= 5),
  communication_rating integer check (communication_rating >= 1 and communication_rating <= 5),
  leadership_rating integer check (leadership_rating >= 1 and leadership_rating <= 5),
  
  -- Context
  relationship_context text not null, -- How they worked together
  time_period text, -- When they worked together
  project_context text, -- What project/context
  
  -- Metadata
  is_anonymous boolean default false,
  is_verified boolean default false, -- Verified working relationship
  visibility_level repo_tier default 'DEEP', -- Which repo level can see this
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for performance
create index idx_surface_repo_user_id on public.surface_repo(user_id);
create index idx_mid_repo_user_id on public.mid_repo(user_id);
create index idx_deep_repo_user_id on public.deep_repo(user_id);
create index idx_full_repo_user_id on public.full_repo(user_id);
create index idx_network_requests_sender on public.network_requests(sender_id);
create index idx_network_requests_receiver on public.network_requests(receiver_id);
create index idx_network_requests_status on public.network_requests(status);
create index idx_repo_access_owner on public.repo_access(owner_id);
create index idx_repo_access_granted_to on public.repo_access(granted_to_id);
create index idx_pdf_templates_user on public.pdf_templates(user_id);
create index idx_peer_feedback_receiver on public.peer_feedback(feedback_receiver_id);

-- Enable Row Level Security
alter table public.surface_repo enable row level security;
alter table public.mid_repo enable row level security;
alter table public.deep_repo enable row level security;
alter table public.full_repo enable row level security;
alter table public.network_requests enable row level security;
alter table public.repo_access enable row level security;
alter table public.pdf_templates enable row level security;
alter table public.peer_feedback enable row level security;

-- RLS Policies

-- Surface Repo: Public if user allows, always own access
create policy "Public surface repos are viewable" on public.surface_repo
  for select using (is_public = true);

create policy "Users can manage their surface repo" on public.surface_repo
  for all using (auth.uid() = user_id);

-- Mid Repo: Requires explicit access
create policy "Users can manage their mid repo" on public.mid_repo
  for all using (auth.uid() = user_id);

create policy "Mid repo access via permissions" on public.mid_repo
  for select using (
    exists (
      select 1 from public.repo_access 
      where owner_id = mid_repo.user_id 
      and granted_to_id = auth.uid()
      and mid_access = true
    )
  );

-- Deep Repo: Restricted access
create policy "Users can manage their deep repo" on public.deep_repo
  for all using (auth.uid() = user_id);

create policy "Deep repo access via permissions" on public.deep_repo
  for select using (
    exists (
      select 1 from public.repo_access 
      where owner_id = deep_repo.user_id 
      and granted_to_id = auth.uid()
      and deep_access = true
    )
  );

-- Full Repo: Most restricted
create policy "Users can manage their full repo" on public.full_repo
  for all using (auth.uid() = user_id);

create policy "Full repo access via permissions" on public.full_repo
  for select using (
    exists (
      select 1 from public.repo_access 
      where owner_id = full_repo.user_id 
      and granted_to_id = auth.uid()
      and full_access = true
    )
  );

-- Network Requests: Users can see their own requests
create policy "Users can manage their network requests" on public.network_requests
  for all using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Repo Access: Users control their own access grants
create policy "Users can manage repo access they grant" on public.repo_access
  for all using (auth.uid() = owner_id);

create policy "Users can view access granted to them" on public.repo_access
  for select using (auth.uid() = granted_to_id);

-- PDF Templates: Private to user
create policy "Users can manage their PDF templates" on public.pdf_templates
  for all using (auth.uid() = user_id);

-- Peer Feedback: Based on visibility level and access
create policy "Users can manage feedback they give or receive" on public.peer_feedback
  for all using (auth.uid() = feedback_giver_id or auth.uid() = feedback_receiver_id);

create policy "Peer feedback visibility based on repo access" on public.peer_feedback
  for select using (
    auth.uid() = feedback_receiver_id or
    auth.uid() = feedback_giver_id or
    (visibility_level = 'SURFACE' and exists (
      select 1 from public.surface_repo where user_id = feedback_receiver_id and is_public = true
    )) or
    (visibility_level = 'MID' and exists (
      select 1 from public.repo_access 
      where owner_id = feedback_receiver_id and granted_to_id = auth.uid() and mid_access = true
    )) or
    (visibility_level = 'DEEP' and exists (
      select 1 from public.repo_access 
      where owner_id = feedback_receiver_id and granted_to_id = auth.uid() and deep_access = true
    )) or
    (visibility_level = 'FULL' and exists (
      select 1 from public.repo_access 
      where owner_id = feedback_receiver_id and granted_to_id = auth.uid() and full_access = true
    ))
  );

-- Update triggers for timestamp management
create trigger update_surface_repo_updated_at before update on public.surface_repo
  for each row execute procedure update_updated_at_column();

create trigger update_mid_repo_updated_at before update on public.mid_repo
  for each row execute procedure update_updated_at_column();

create trigger update_deep_repo_updated_at before update on public.deep_repo
  for each row execute procedure update_updated_at_column();

create trigger update_full_repo_updated_at before update on public.full_repo
  for each row execute procedure update_updated_at_column();

create trigger update_network_requests_updated_at before update on public.network_requests
  for each row execute procedure update_updated_at_column();

create trigger update_repo_access_updated_at before update on public.repo_access
  for each row execute procedure update_updated_at_column();

create trigger update_pdf_templates_updated_at before update on public.pdf_templates
  for each row execute procedure update_updated_at_column();