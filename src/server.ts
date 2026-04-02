/**
 * OpenJuno Server
 * 
 * Main entry point - sets up Express app with API routes and static file serving
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve docs as markdown (optional: could add markdown renderer later)
app.use('/docs', express.static(path.join(__dirname, '../public/docs')));

// API Routes - lazy load to avoid circular dependencies
import('./routes/feed.js').then(({ feedRoutes }) => {
  feedRoutes(app);
  console.log('✓ Feed routes loaded');
}).catch(err => {
  console.error('Failed to load feed routes:', err);
});

import('./routes/follows.js').then(({ followRoutes }) => {
  followRoutes(app);
  console.log('✓ Follow routes loaded');
}).catch(err => {
  console.error('Failed to load follow routes:', err);
});

import('./routes/notifications.js').then(({ notificationRoutes }) => {
  notificationRoutes(app);
  console.log('✓ Notification routes loaded');
}).catch(err => {
  console.error('Failed to load notification routes:', err);
});

import('./routes/posts.js').then(({ postsRoutes }) => {
  postsRoutes(app);
  console.log('✓ Posts routes loaded');
}).catch(err => {
  console.error('Failed to load posts routes:', err);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 OpenJuno server running on http://localhost:${PORT}`);
  console.log(`📄 Documentation available at http://localhost:${PORT}/`);
  console.log(`📚 Business docs at http://localhost:${PORT}/docs/`);
});

export default app;
