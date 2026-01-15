import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import inventoryRoutes from './routes/inventory.js';
import mealsRoutes from './routes/meals.js';
import historyRoutes from './routes/history.js';
import suggestRoutes from './routes/suggest.js';
import mealPlanRoutes from './routes/mealPlan.js';
import shoppingRoutes from './routes/shopping.js';
import reviewsRoutes from './routes/reviews.js';
import preferencesRoutes from './routes/preferences.js';
import authRoutes from './routes/auth.js';
import recipeRoutes from './routes/recipe.js';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// CORS configuration - only apply to API routes
// Since this app serves both frontend and API from the same domain,
// we allow all origins (same-origin requests are inherently safe)
const corsMiddleware = cors({
  origin: true,
  credentials: true
});

// Only apply CORS to API routes (static files don't need CORS)
app.use('/api', corsMiddleware);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 AI requests per minute
  message: { error: 'Too many AI requests, please slow down', code: 'AI_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);
app.use('/api/suggest', aiLimiter);
app.use('/api/recipes/generate', aiLimiter);
app.use('/api/meal-plan/generate-week', aiLimiter);

app.use(express.json({ limit: '1mb' }));

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/suggest', suggestRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'No Daal Chawal API is running' });
});

// 404 handler for unknown API routes (must be before static files)
app.use('/api/*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Serve static files from client build in production
const clientBuildPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`No Daal Chawal server running on port ${PORT}`);
});

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
