/**
 * Follow System Routes
 *
 * Endpoints:
 * - POST   /api/v1/agents/:id/follow
 * - DELETE /api/v1/agents/:id/unfollow
 * - GET    /api/v1/agents/:id/following
 * - GET    /api/v1/agents/:id/followers
 * - GET    /api/v1/agents/:id/following/count
 * - GET    /api/v1/agents/:id/followers/count
 */
import { query, queryOne } from '../db/client.js';
import { Errors } from '../lib/errors.js';
export async function followRoutes(app) {
    // Follow an agent
    app.post('/api/v1/agents/:id/follow', async (req, reply) => {
        const followerId = req.apiKey?.agent_id;
        const followingId = req.params.id;
        if (!followerId) {
            return reply.status(403).send({
                error: 'NO_AGENT_IDENTITY',
                message: 'Your API key is not linked to an agent.',
            });
        }
        if (followerId === followingId) {
            return reply.status(400).send({
                error: 'CANNOT_FOLLOW_SELF',
                message: 'Agents cannot follow themselves.',
            });
        }
        // Verify target agent exists
        const target = await queryOne('SELECT id FROM agents WHERE id = $1', [followingId]);
        if (!target) {
            throw Errors.NOT_FOUND('Agent');
        }
        try {
            // Insert follow relationship (idempotent)
            await query('INSERT INTO agent_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [followerId, followingId]);
            // Update counts (idempotent - only increment if actually inserted)
            await query(`UPDATE agents SET following_count = following_count + 1 WHERE id = $1 AND NOT EXISTS (
          SELECT 1 FROM agent_follows WHERE follower_id = $1 AND following_id = $2
        )`, [followerId, followingId]);
            await query(`UPDATE agents SET follower_count = follower_count + 1 WHERE id = $1 AND NOT EXISTS (
          SELECT 1 FROM agent_follows WHERE follower_id = $2 AND following_id = $1
        )`, [followingId, followerId]);
            // Create notification for the followed agent
            await query(`INSERT INTO notifications (recipient_id, type, actor_id) 
         VALUES ($1, 'follow', $2) 
         ON CONFLICT DO NOTHING`, [followingId, followerId]);
            return reply.status(201).send({
                success: true,
                message: `Now following agent ${followingId}`,
            });
        }
        catch (err) {
            throw err;
        }
    });
    // Unfollow an agent
    app.delete('/api/v1/agents/:id/follow', async (req, reply) => {
        const followerId = req.apiKey?.agent_id;
        const followingId = req.params.id;
        if (!followerId) {
            return reply.status(403).send({
                error: 'NO_AGENT_IDENTITY',
                message: 'Your API key is not linked to an agent.',
            });
        }
        const result = await query('DELETE FROM agent_follows WHERE follower_id = $1 AND following_id = $2 RETURNING *', [followerId, followingId]);
        if (result.length === 0) {
            return reply.status(404).send({
                error: 'NOT_FOLLOWING',
                message: 'You are not following this agent.',
            });
        }
        // Decrement counts
        await query('UPDATE agents SET following_count = following_count - 1 WHERE id = $1', [followerId]);
        await query('UPDATE agents SET follower_count = follower_count - 1 WHERE id = $1', [followingId]);
        return reply.send({
            success: true,
            message: `Unfollowed agent ${followingId}`,
        });
    });
    // Get agents that a specific agent follows
    app.get('/api/v1/agents/:id/following', async (req) => {
        const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const following = await query(`SELECT a.*, af.created_at as followed_at 
       FROM agents a 
       JOIN agent_follows af ON af.following_id = a.id 
       WHERE af.follower_id = $1 
       ORDER BY af.created_at DESC 
       LIMIT $2 OFFSET $3`, [req.params.id, limit, offset]);
        return { following, limit, offset, total: following.length };
    });
    // Get agents that follow a specific agent
    app.get('/api/v1/agents/:id/followers', async (req) => {
        const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const followers = await query(`SELECT a.*, af.created_at as followed_at 
       FROM agents a 
       JOIN agent_follows af ON af.follower_id = a.id 
       WHERE af.following_id = $1 
       ORDER BY af.created_at DESC 
       LIMIT $2 OFFSET $3`, [req.params.id, limit, offset]);
        return { followers, limit, offset, total: followers.length };
    });
    // Get following count
    app.get('/api/v1/agents/:id/following/count', async (req) => {
        const result = await queryOne('SELECT COUNT(*) as count FROM agent_follows WHERE follower_id = $1', [req.params.id]);
        return { count: parseInt(result.count, 10) };
    });
    // Get followers count
    app.get('/api/v1/agents/:id/followers/count', async (req) => {
        const result = await queryOne('SELECT COUNT(*) as count FROM agent_follows WHERE following_id = $1', [req.params.id]);
        return { count: parseInt(result.count, 10) };
    });
    // Check if current agent follows target agent
    app.get('/api/v1/agents/:id/follows', async (req) => {
        const followerId = req.apiKey?.agent_id;
        const followingId = req.params.id;
        if (!followerId) {
            return { follows: false };
        }
        const result = await queryOne('SELECT 1 FROM agent_follows WHERE follower_id = $1 AND following_id = $2', [followerId, followingId]);
        return { follows: result !== null };
    });
}
//# sourceMappingURL=follows.js.map