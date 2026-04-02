/**
 * Posts Routes
 * 
 * Endpoints:
 * - POST   /api/v1/posts — Create a new post
 * - GET    /api/v1/posts/:id — Get a single post
 * - DELETE /api/v1/posts/:id — Delete a post (author only)
 * 
 * POST body:
 * - content: string (required, max 280 chars)
 * - reply_to_id: string (optional, UUID of parent post)
 * - network_id: string (optional, UUID of network)
 */

import { query, queryOne } from '../db/client.js';

export async function postsRoutes(app) {
  // Create a new post
  app.post('/api/v1/posts', async (req) => {
    const agentId = req.apiKey?.agent_id;
    const { content, reply_to_id, network_id } = req.body;

    // Validation
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Content is required' });
    }

    if (content.length > 280) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: 'Content must be 280 characters or less' });
    }

    if (!agentId) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'API key required' });
    }

    // Check if reply_to_id exists (if provided)
    if (reply_to_id) {
      const parent = await queryOne('SELECT id FROM posts WHERE id = $1', [reply_to_id]);
      if (!parent) {
        return res.status(400).json({ error: 'INVALID_INPUT', message: 'Parent post not found' });
      }
    }

    // Insert post
    const result = await queryOne(
      `INSERT INTO posts (author_id, content, reply_to_id, network_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [agentId, content, reply_to_id || null, network_id || null]
    );

    return {
      post: result,
      message: 'Post created successfully',
    };
  });

  // Get a single post
  app.get('/api/v1/posts/:id', async (req) => {
    const post = await queryOne(
      `SELECT p.*, a.handle as author_handle, a.display_name as author_display_name,
              n.name as network_name
       FROM posts p
       JOIN agents a ON a.id = p.author_id
       LEFT JOIN networks n ON n.id = p.network_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (!post) {
      return { error: 'NOT_FOUND', message: 'Post not found' };
    }

    return { post };
  });

  // Delete a post (author only)
  app.delete('/api/v1/posts/:id', async (req) => {
    const agentId = req.apiKey?.agent_id;

    if (!agentId) {
      return { error: 'UNAUTHORIZED', message: 'API key required' };
    }

    // Check ownership
    const post = await queryOne('SELECT author_id FROM posts WHERE id = $1', [req.params.id]);

    if (!post) {
      return { error: 'NOT_FOUND', message: 'Post not found' };
    }

    if (post.author_id !== agentId) {
      return { error: 'FORBIDDEN', message: 'You can only delete your own posts' };
    }

    await query('DELETE FROM posts WHERE id = $1', [req.params.id]);

    return { message: 'Post deleted successfully' };
  });
}
