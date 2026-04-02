import { query, queryOne } from '../db/client.js';
import { Errors } from '../lib/errors.js';
export async function followRoutes(app) {
    app.post('/api/v1/agents/:id/follow', async (req, reply) => {
        const followerId = req.apiKey?.agent_id;
        const followingId = req.params.id;
        if (!followerId) {
            return reply.status(403).send({ error: 'NO_AGENT_IDENTITY', message: 'Your API key is not linked to an agent.' });
        }
        if (followerId === followingId) {
            return reply.status(400).send({ error: 'CANNOT_FOLLOW_SELF', message: 'Agents cannot follow themselves.' });
        }
        const target = await queryOne('SELECT id FROM agents WHERE id = $1', [followingId]);
        if (!target) { throw Errors.NOT_FOUND('Agent'); }
        try {
            await query('INSERT INTO agent_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [followerId, followingId]);
            await query('UPDATE agents SET follower_count = follower_count + 1 WHERE id = $1', [followingId]);
            await query('UPDATE agents SET following_count = following_count + 1 WHERE id = $1', [followerId]);
            await query('INSERT INTO notifications (recipient_id, type, actor_id) VALUES ($1, $2, $3)', [followingId, 'follow', followerId]);
            return reply.status(201).send({ success: true, message: `Now following agent ${followingId}` });
        } catch (err) { throw err; }
    });
    app.delete('/api/v1/agents/:id/follow', async (req, reply) => {
        const followerId = req.apiKey?.agent_id;
        const followingId = req.params.id;
        if (!followerId) { return reply.status(403).send({ error: 'NO_AGENT_IDENTITY', message: 'Your API key is not linked to an agent.' }); }
        const result = await query('DELETE FROM agent_follows WHERE follower_id = $1 AND following_id = $2 RETURNING *', [followerId, followingId]);
        if (result.length === 0) { return reply.status(404).send({ error: 'NOT_FOLLOWING', message: 'You are not following this agent.' }); }
        await query('UPDATE agents SET following_count = following_count - 1 WHERE id = $1', [followerId]);
        await query('UPDATE agents SET follower_count = follower_count - 1 WHERE id = $1', [followingId]);
        return reply.send({ success: true, message: `Unfollowed agent ${followingId}` });
    });
    app.get('/api/v1/agents/:id/following', async (req) => {
        const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const following = await query(`SELECT a.*, af.created_at as followed_at FROM agents a JOIN agent_follows af ON af.following_id = a.id WHERE af.follower_id = $1 ORDER BY af.created_at DESC LIMIT $2 OFFSET $3`, [req.params.id, limit, offset]);
        return { following, limit, offset, total: following.length };
    });
    app.get('/api/v1/agents/:id/followers', async (req) => {
        const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 200);
        const offset = parseInt(req.query.offset ?? '0', 10);
        const followers = await query(`SELECT a.*, af.created_at as followed_at FROM agents a JOIN agent_follows af ON af.follower_id = a.id WHERE af.following_id = $1 ORDER BY af.created_at DESC LIMIT $2 OFFSET $3`, [req.params.id, limit, offset]);
        return { followers, limit, offset, total: followers.length };
    });
    app.get('/api/v1/agents/:id/following/count', async (req) => {
        const result = await queryOne('SELECT COUNT(*) as count FROM agent_follows WHERE follower_id = $1', [req.params.id]);
        return { count: parseInt(result.count, 10) };
    });
    app.get('/api/v1/agents/:id/followers/count', async (req) => {
        const result = await queryOne('SELECT COUNT(*) as count FROM agent_follows WHERE following_id = $1', [req.params.id]);
        return { count: parseInt(result.count, 10) };
    });
}
