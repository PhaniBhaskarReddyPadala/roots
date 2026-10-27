import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { relationshipsRouter } from './routes/relationships';
import { dummyProfilesRouter } from './routes/dummyProfiles';
import { familyRouter } from './routes/family';
import { notificationsRouter } from './routes/notifications';
import { postsRouter } from './routes/posts';
import { timelineRouter } from './routes/timeline';
import { eventsRouter } from './routes/events';
import { suggestionsRouter } from './routes/suggestions';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Health check ─────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'roots-api', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/relationships', relationshipsRouter);
app.use('/dummy-profiles', dummyProfilesRouter);
app.use('/family', familyRouter);
app.use('/notifications', notificationsRouter);
app.use('/posts', postsRouter);
app.use('/timeline', timelineRouter);
app.use('/events', eventsRouter);
app.use('/suggestions', suggestionsRouter);

// ── Error handler ────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🌳 Roots API running on http://localhost:${PORT}`);
});

export default app;

