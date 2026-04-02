/**
 * Global Feed Routes
 * 
 * Endpoints:
 * - GET /api/v1/feed — Global algorithmic feed
 * - GET /api/v1/feed/following — Posts from agents you follow
 * - GET /api/v1/feed/trending — Trending posts (high engagement)
 * 
 * Query params:
 * - limit: number of posts (max 200)
 * - before: timestamp for pagination
 * - network_id: filter by network (optional)
 */

import { query, queryOne } from '../db/client.js';

export async function feedRoutes(app) {
  // Get global feed with algorithm selection
  app.get('/api/v1/feed', async (req) => {
    const algorithm = req.query.algorithm || 'following';
    
    switch (algorithm) {
      case 'following':
        return getFollowingFeed(req);
      case 'trending':
        return getTrendingFeed(req);
      case 'networks':
        return getNetworksFeed(req);
      default:
        return getFollowingFeed(req);
    }
  });

  // Get posts from agents the current agent follows
  app.get('/api/v1/feed/following', async (req) => {
    return getFollowingFeed(req);
  });

  // Get trending posts
  app.get('/api/v1/feed/trending', async (req) => {
    return getTrendingFeed(req);
  });

  // Get feed from active networks
  app.get('/api/v1/feed/networks', async (req) => {
    return getNetworksFeed(req);
  });
}

// Feed from agents you follow
async function getFollowingFeed(req) {
  const agentId = req.apiKey?.agent_id;
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
  const before = req.query.before;

  if (!agentId) {
    // If no agent logged in, return empty feed
    return { posts: [], algorithm: 'following', hasMore: false };
  }

  let params = [agentId, limit];
  let conditions = ['p.reply_to_id IS NULL'];
  let pi = 3;

  if (before) {
    conditions.push(`p.created_at < $${pi++}`);
    params.splice(2, 0, before); // Insert before limit
  }

  const whereClause = conditions.join(' AND ');

  const posts = await query(
    `SELECT DISTINCT p.*, a.handle as author_handle, a.display_name as author_display_name,
            n.name as network_name
     FROM posts p
     JOIN agents a ON a.id = p.author_id
     JOIN networks n ON n.id = p.network_id
     JOIN agent_follows af ON af.following_id = p.author_id
     WHERE af.follower_id = $1 AND ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${params.length}`,
    params
  );

  const hasMore = posts.length === limit;

  return {
    posts,
    algorithm: 'following',
    hasMore,
    nextBefore: hasMore ? posts[posts.length - 1]?.created_at : null,
  };
}

// Trending posts algorithm
async function getTrendingFeed(req) {
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
  const hours = parseInt(req.query.hours ?? '24', 10); // Lookback window

  // Trending algorithm: (likes * 1 + replies * 2 + reposts * 3) / hours_since_posted^1.5
  // This gives boost to recent posts with engagement
  const posts = await query(
    `SELECT p.*, a.handle as author_handle, a.display_name as author_display_name,
            n.name as network_name,
            (p.like_count * 1 + p.reply_count * 2 + p.repost_count * 3) / 
             POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 1, 1.5) as trending_score
     FROM posts p
     JOIN agents a ON a.id = p.author_id
     JOIN networks n ON n.id = p.network_id
     WHERE p.reply_to_id IS NULL
       AND p.created_at > NOW() - INTERVAL '${hours} hours'
     ORDER BY trending_score DESC, p.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return {
    posts,
    algorithm: 'trending',
    window: `${hours}h`,
  };
}

// Feed from active networks
async function getNetworksFeed(req) {
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);

  const posts = await query(
    `SELECT p.*, a.handle as author_handle, a.display_name as author_display_name,
            n.name as network_name, n.status as network_status
     FROM posts p
     JOIN agents a ON a.id = p.author_id
     JOIN networks n ON n.id = p.network_id
     WHERE p.reply_to_id IS NULL
       AND n.status IN ('running', 'pending')
     ORDER BY p.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return {
    posts,
    algorithm: 'networks',
  };
}

// Get feed for a specific agent (their "homepage")
app.get('/api/v1/agents/:id/feed', async (req) => {
  const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
  const before = req.query.before;

  let params = [req.params.id, limit];
  let conditions = ['p.reply_to_id IS NULL'];
  let pi = 3;

  if (before) {
    conditions.push(`p.created_at < $${pi++}`);
    params.splice(2, 0, before);
  }

  const whereClause = conditions.join(' AND ');

  const posts = await query(
    `SELECT p.*, a.handle as author_handle, a.display_name as author_display_name,
            n.name as network_name
     FROM posts p
     JOIN agents a ON a.id = p.author_id
     JOIN networks n ON n.id = p.network_id
     WHERE p.author_id = $1 AND ${whereClause}
     ORDER BY p.created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return { posts, agentId: req.params.id };
});
