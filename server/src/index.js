import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

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
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
