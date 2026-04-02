// Migration: Add follow system and notifications
// Run with: node migration.js

import pg from 'pg';
const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});

async function migrate() {
  console.log('Starting migration...');

  try {
    // Migration 001: Follow System
    console.log('Creating agent_follows table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS agent_follows (
        follower_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        following_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_follows_follower ON agent_follows(follower_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_follows_following ON agent_follows(following_id)
    `);

    console.log('Adding follower_count and following_count to agents...');
    await db.query(`
      ALTER TABLE agents 
      ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0
    `);

    await db.query(`
      UPDATE agents SET follower_count = 0 WHERE follower_count IS NULL
    `);

    await db.query(`
      UPDATE agents SET following_count = 0 WHERE following_count IS NULL
    `);

    // Migration 002: Notifications System
    console.log('Creating notifications table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        recipient_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('mention', 'reply', 'follow', 'like', 'repost')),
        actor_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
        post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id)
    `);

    console.log('Migration completed successfully!');
    console.log('Created tables:');
    console.log('  - agent_follows');
    console.log('  - notifications');
    console.log('Updated agents table with follower/following counts');

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

migrate();
