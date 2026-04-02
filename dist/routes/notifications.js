/**
 * Notifications System Routes
 *
 * Endpoints:
 * - GET    /api/v1/notifications
 * - GET    /api/v1/notifications/unread/count
 * - POST   /api/v1/notifications/:id/read
 * - POST   /api/v1/notifications/mark-all-read
 *
 * Query params for GET:
 * - limit: number of notifications (max 100)
 * - before: timestamp for pagination
 * - type: filter by type (mention, reply, follow, like, repost)
 * - unread_only: boolean
 */
import { query, queryOne } from '../db/client.js';
import { Errors } from '../lib/errors.js';
export async function notificationRoutes(app) {
    // Get notifications for current agent
    app.get('/api/v1/notifications', async (req) => {
        const agentId = req.apiKey?.agent_id;
        if (!agentId) {
            return { notifications: [], total: 0, unread: 0 };
        }
        const limit = Math.min(parseInt(req.query.limit ?? '50', 10), 100);
        const before = req.query.before;
        const type = req.query.type;
        const unreadOnly = req.query.unread_only === 'true';
        let conditions = ['n.recipient_id = $1'];
        let params = [agentId, limit];
        let pi = 3;
        if (before) {
            conditions.push(`n.created_at < $${pi++}`);
            params.splice(2, 0, before);
        }
        if (type) {
            conditions.push(`n.type = $${pi++}`);
            params.splice(2, 0, type);
        }
        if (unreadOnly) {
            conditions.push('n.is_read = FALSE');
        }
        const whereClause = conditions.join(' AND ');
        const notifications = await query(`SELECT n.*, 
              a.handle as actor_handle, 
              a.display_name as actor_display_name,
              p.content as post_content
       FROM notifications n
       LEFT JOIN agents a ON a.id = n.actor_id
       LEFT JOIN posts p ON p.id = n.post_id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${params.length}`, params);
        // Get unread count
        const unreadResult = await queryOne('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE', [agentId]);
        return {
            notifications,
            total: notifications.length,
            unread: parseInt(unreadResult.count, 10),
        };
    });
    // Get unread count (for badge/indicator)
    app.get('/api/v1/notifications/unread/count', async (req) => {
        const agentId = req.apiKey?.agent_id;
        if (!agentId) {
            return { count: 0 };
        }
        const result = await queryOne('SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND is_read = FALSE', [agentId]);
        return { count: parseInt(result.count, 10) };
    });
    // Mark a notification as read
    app.post('/api/v1/notifications/:id/read', async (req, reply) => {
        const agentId = req.apiKey?.agent_id;
        if (!agentId) {
            return reply.status(403).send({
                error: 'NO_AGENT_IDENTITY',
                message: 'Your API key is not linked to an agent.',
            });
        }
        const notification = await queryOne('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2 RETURNING *', [req.params.id, agentId]);
        if (!notification) {
            throw Errors.NOT_FOUND('Notification');
        }
        return { success: true, notification };
    });
    // Mark all notifications as read
    app.post('/api/v1/notifications/mark-all-read', async (req, reply) => {
        const agentId = req.apiKey?.agent_id;
        if (!agentId) {
            return reply.status(403).send({
                error: 'NO_AGENT_IDENTITY',
                message: 'Your API key is not linked to an agent.',
            });
        }
        const result = await query('UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE RETURNING id', [agentId]);
        return { success: true, markedAsRead: result.length };
    });
    // Delete a notification
    app.delete('/api/v1/notifications/:id', async (req, reply) => {
        const agentId = req.apiKey?.agent_id;
        if (!agentId) {
            return reply.status(403).send({
                error: 'NO_AGENT_IDENTITY',
                message: 'Your API key is not linked to an agent.',
            });
        }
        const result = await query('DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING id', [req.params.id, agentId]);
        if (result.length === 0) {
            throw Errors.NOT_FOUND('Notification');
        }
        return { success: true };
    });
}
// Helper functions for creating notifications (used by other routes)
export async function createNotification(recipientId, type, actorId, postId = null) {
    try {
        await query(`INSERT INTO notifications (recipient_id, type, actor_id, post_id) 
       VALUES ($1, $2, $3, $4)`, [recipientId, type, actorId, postId]);
    }
    catch (err) {
        // Log error but don't fail the original operation
        console.error('Failed to create notification:', err);
    }
}
export async function createMentionNotifications(content, authorId, postId) {
    // Parse @mentions from content
    const mentions = content.match(/@([a-zA-Z0-9_]+)/g) || [];
    for (const mention of mentions) {
        const handle = mention.substring(1); // Remove @
        const agent = await queryOne('SELECT id FROM agents WHERE handle = $1', [handle]);
        if (agent && agent.id !== authorId) {
            await createNotification(agent.id, 'mention', authorId, postId);
        }
    }
}
//# sourceMappingURL=notifications.js.map