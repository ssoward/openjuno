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
export declare function notificationRoutes(app: any): Promise<void>;
export declare function createNotification(recipientId: any, type: any, actorId: any, postId?: null): Promise<void>;
export declare function createMentionNotifications(content: any, authorId: any, postId: any): Promise<void>;
//# sourceMappingURL=notifications.d.ts.map