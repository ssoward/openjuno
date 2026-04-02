-- Migration 002: Notifications System
-- Date: 2026-03-19
-- Phase: Sprint 2

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'follow', 'like', 'repost')),
  actor_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

-- Add trigger to auto-update notification count if needed
-- (Can be done in application layer instead)

-- Verify
SELECT 'notifications table created' as status;
