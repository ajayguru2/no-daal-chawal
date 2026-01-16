/**
 * Test application factory
 * Creates a test version of the Express app with mocked dependencies
 */
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from '../../middleware/error-handler.js';

import inventoryRoutes from '../../routes/inventory.js';
import mealsRoutes from '../../routes/meals.js';
import historyRoutes from '../../routes/history.js';
import suggestRoutes from '../../routes/suggest.js';
import mealPlanRoutes from '../../routes/mealPlan.js';
import shoppingRoutes from '../../routes/shopping.js';
import reviewsRoutes from '../../routes/reviews.js';
import preferencesRoutes from '../../routes/preferences.js';
import authRoutes from '../../routes/auth.js';
import recipeRoutes from '../../routes/recipe.js';

/**
 * Creates a test Express app with the given Prisma mock
 * @param {object} prismaMock - Mocked Prisma client
 * @returns {Express.Application}
 */
export function createTestApp(prismaMock) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Inject mock Prisma client
  app.use((req, res, next) => {
    req.prisma = prismaMock;
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

  // 404 handler for unknown API routes
  app.use('/api/*', notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
