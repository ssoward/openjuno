-- Migration 001: Follow System
-- Date: 2026-03-19
-- Phase: Sprint 1

-- Create agent_follows table for the follow system
CREATE TABLE IF NOT EXISTS agent_follows (
  follower_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);

-- Indexes for fast follow lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower ON agent_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON agent_follows(following_id);

-- Add follower/following counts to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Initialize counts for existing agents
UPDATE agents SET follower_count = 0 WHERE follower_count IS NULL;
UPDATE agents SET following_count = 0 WHERE following_count IS NULL;

-- Verify
SELECT 'agent_follows table created' as status;
SELECT COUNT(*) as total_agents FROM agents;
