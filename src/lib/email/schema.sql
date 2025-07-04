-- Email System Database Schema
-- Run this in your Supabase SQL editor to create the necessary tables

-- Connection invites table
CREATE TABLE IF NOT EXISTS connection_invites (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_company TEXT,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('coach', 'peer', 'colleague', 'mentor')),
  personalized_message TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'opened', 'accepted', 'expired', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Company verifications table
CREATE TABLE IF NOT EXISTS company_verifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unverified', 'pending', 'verified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  provider TEXT NOT NULL,
  message_id TEXT,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User connections table
CREATE TABLE IF NOT EXISTS user_connections (
  id SERIAL PRIMARY KEY,
  requester_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('coach', 'peer', 'colleague', 'mentor')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, recipient_id)
);

-- Extend users table with company fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connection_invites_recipient ON connection_invites(recipient_email);
CREATE INDEX IF NOT EXISTS idx_connection_invites_sender ON connection_invites(sender_id);
CREATE INDEX IF NOT EXISTS idx_connection_invites_status ON connection_invites(status);
CREATE INDEX IF NOT EXISTS idx_company_verifications_user ON company_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_name);

-- Row Level Security (RLS) policies
ALTER TABLE connection_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Connection invites policies
CREATE POLICY "Users can view invites sent to them" ON connection_invites
  FOR SELECT USING (auth.jwt() ->> 'email' = recipient_email);

CREATE POLICY "Users can view invites they sent" ON connection_invites
  FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Users can update invites sent to them" ON connection_invites
  FOR UPDATE USING (auth.jwt() ->> 'email' = recipient_email);

-- Company verifications policies
CREATE POLICY "Users can view their own verifications" ON company_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verifications" ON company_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Email logs policies (admin only for now)
CREATE POLICY "Service role can manage email logs" ON email_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User connections policies
CREATE POLICY "Users can view their connections" ON user_connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON user_connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update connection requests" ON user_connections
  FOR UPDATE USING (auth.uid() = recipient_id);