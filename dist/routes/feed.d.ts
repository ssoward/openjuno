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
export declare function feedRoutes(app: any): Promise<void>;
//# sourceMappingURL=feed.d.ts.map