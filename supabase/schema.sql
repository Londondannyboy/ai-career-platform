-- AI Career Platform Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type connection_status as enum ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');
create type repo_access_level as enum ('VIEW_ONLY', 'VIEW_AUDIO', 'COACHING', 'FULL_ACCESS');
create type request_status as enum ('PENDING', 'APPROVED', 'DECLINED');
create type coaching_status as enum ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  headline text,
  location text,
  company text,
  skills text[] default '{}',
  experience jsonb,
  profile_image text,
  is_public boolean default true,
  linkedin_id text unique,
  linkedin_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Connections table for networking
create table public.connections (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  status connection_status default 'PENDING' not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

-- Repo sessions table (core feature)
create table public.repo_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  audio_url text,
  transcript text,
  ai_analysis jsonb,
  topics text[] default '{}',
  skills text[] default '{}',
  experiences jsonb[] default '{}',
  goals jsonb[] default '{}',
  challenges jsonb[] default '{}',
  duration integer default 0,
  is_private boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Repo permissions table for selective sharing
create table public.repo_permissions (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.users(id) on delete cascade not null,
  granted_to_id uuid references public.users(id) on delete cascade not null,
  access_level repo_access_level not null,
  can_add_notes boolean default false,
  can_view_audio boolean default false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(owner_id, granted_to_id)
);

-- Repo access requests table
create table public.repo_access_requests (
  id uuid default uuid_generate_v4() primary key,
  requester_id uuid references public.users(id) on delete cascade not null,
  repo_owner_id uuid references public.users(id) on delete cascade not null,
  purpose text not null,
  requested_level repo_access_level not null,
  status request_status default 'PENDING' not null,
  message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coaching sessions table
create table public.coaching_sessions (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.users(id) on delete cascade not null,
  coach_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  audio_url text,
  transcript text,
  coaching_notes text,
  action_items jsonb[] default '{}',
  follow_up_date timestamp with time zone,
  status coaching_status default 'SCHEDULED' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Coaching notes table
create table public.coaching_notes (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.users(id) on delete cascade not null,
  repo_session_id uuid references public.repo_sessions(id) on delete cascade,
  coaching_session_id uuid references public.coaching_sessions(id) on delete cascade,
  content text not null,
  is_private boolean default false,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jobs table (for job search feature)
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  company text not null,
  location text not null,
  description text,
  requirements text,
  salary text,
  is_remote boolean default false,
  url text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Saved jobs table
create table public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  notes text,
  status text default 'saved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, job_id)
);

-- Job searches table
create table public.job_searches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  query text not null,
  transcript text,
  results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_users_linkedin_id on public.users(linkedin_id);
create index idx_connections_sender_id on public.connections(sender_id);
create index idx_connections_receiver_id on public.connections(receiver_id);
create index idx_connections_status on public.connections(status);
create index idx_repo_sessions_user_id on public.repo_sessions(user_id);
create index idx_repo_sessions_created_at on public.repo_sessions(created_at desc);
create index idx_repo_permissions_owner_id on public.repo_permissions(owner_id);
create index idx_repo_permissions_granted_to_id on public.repo_permissions(granted_to_id);
create index idx_coaching_sessions_client_id on public.coaching_sessions(client_id);
create index idx_coaching_sessions_coach_id on public.coaching_sessions(coach_id);
create index idx_saved_jobs_user_id on public.saved_jobs(user_id);
create index idx_job_searches_user_id on public.job_searches(user_id);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.connections enable row level security;
alter table public.repo_sessions enable row level security;
alter table public.repo_permissions enable row level security;
alter table public.repo_access_requests enable row level security;
alter table public.coaching_sessions enable row level security;
alter table public.coaching_notes enable row level security;
alter table public.jobs enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_searches enable row level security;

-- RLS Policies

-- Users: Users can view public profiles and update their own
create policy "Public profiles are viewable by everyone" on public.users
  for select using (is_public = true);

create policy "Users can view their own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);

-- Connections: Users can manage their own connections
create policy "Users can view their connections" on public.connections
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can create connection requests" on public.connections
  for insert with check (auth.uid() = sender_id);

create policy "Users can update their connections" on public.connections
  for update using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Repo Sessions: Private by default, shared based on permissions
create policy "Users can view their own repo sessions" on public.repo_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create their own repo sessions" on public.repo_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own repo sessions" on public.repo_sessions
  for update using (auth.uid() = user_id);

create policy "Users can view shared repo sessions" on public.repo_sessions
  for select using (
    exists (
      select 1 from public.repo_permissions 
      where owner_id = repo_sessions.user_id 
      and granted_to_id = auth.uid()
    )
  );

-- Repo Permissions: Users control access to their repos
create policy "Users can manage their repo permissions" on public.repo_permissions
  for all using (auth.uid() = owner_id);

create policy "Users can view permissions granted to them" on public.repo_permissions
  for select using (auth.uid() = granted_to_id);

-- Functions for automatic timestamp updates
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_users_updated_at before update on public.users
  for each row execute procedure update_updated_at_column();

create trigger update_connections_updated_at before update on public.connections
  for each row execute procedure update_updated_at_column();

create trigger update_repo_sessions_updated_at before update on public.repo_sessions
  for each row execute procedure update_updated_at_column();

create trigger update_repo_access_requests_updated_at before update on public.repo_access_requests
  for each row execute procedure update_updated_at_column();

create trigger update_coaching_sessions_updated_at before update on public.coaching_sessions
  for each row execute procedure update_updated_at_column();