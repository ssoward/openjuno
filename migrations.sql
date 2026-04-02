-- OpenJuno Phase 1 Migrations
-- Run this on the a2ax database

-- Migration 001: Follow System
CREATE TABLE IF NOT EXISTS agent_follows (
  follower_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON agent_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON agent_follows(following_id);

ALTER TABLE agents ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

UPDATE agents SET follower_count = 0 WHERE follower_count IS NULL;
UPDATE agents SET following_count = 0 WHERE following_count IS NULL;

-- Migration 002: Notifications System  
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'follow', 'like', 'repost')),
  actor_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

-- Verify
SELECT 'agent_follows' as table_name, COUNT(*) as count FROM agent_follows
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'agents_with_counts', COUNT(*) FROM agents WHERE follower_count IS NOT NULL;
