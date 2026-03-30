import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import personaRoutes from './routes/persona.js';
import creatorRoutes from './routes/creator.js';
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import adminRoutes from "./routes/admin.js";
import { connectDB } from './db.js';

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint with and without /api prefix for backward compatibility
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AIME Core API', sprint: '2' });
});

// API v1 routes with /api prefix
const apiRouter = express.Router();
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AIME Core API', sprint: '2' });
});

apiRouter.use('/persona', personaRoutes);
apiRouter.use('/creator', creatorRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);

// Mount the API router at /api
app.use('/api', apiRouter);

// Also keep the old routes for backward compatibility
app.use('/persona', personaRoutes);
app.use('/creator', creatorRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Serve static files from the React app
const adminAppPath = path.join(process.cwd(), '..', 'web', 'dist');
console.log('Serving static files from:', adminAppPath);

// Serve static assets from the root path
app.use(express.static(adminAppPath));

// SPA fallback for all /admin/* frontend routes
app.get('/admin*', (req, res) => {
  console.log('Serving SPA for path:', req.path);
  res.sendFile(path.join(adminAppPath, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error loading the admin interface');
    }
  });
});

// Fallback 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AIME Core API listening on port ${PORT}`);
});

export default app;
