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

// Serve static files from public directory (includes docs)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes will be added as they're compiled
// For now, server focuses on static file serving for docs

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
