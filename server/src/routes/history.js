import { Router } from 'express';
import { validate, historySchema, historyUpdateSchema, calendarQuerySchema } from '../validators/index.js';
import { daysAgo, startOfDay, tomorrow } from '../utils/date.js';

const router = Router();

// Get meals for calendar view (by month)
router.get('/calendar', validate(calendarQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { year, month } = req.validated.query;
    const y = year || new Date().getFullYear();
    // Note: month from query is 1-indexed, but Date constructor expects 0-indexed
    const m = month ? month - 1 : new Date().getMonth();

    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 1);

    const meals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { eatenAt: 'asc' }
    });

    // Group by date
    const grouped = {};
    meals.forEach(meal => {
      const dateKey = meal.eatenAt.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meal);
    });

    res.json(grouped);
  } catch (error) {
    next(error);
  }
});

// Get meal history
router.get('/', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = daysAgo(days);

    const history = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: since }
      },
      orderBy: { eatenAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Get stats (cuisine variety, repeat frequency)
router.get('/stats', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = daysAgo(days);

    const history = await req.prisma.mealHistory.findMany({
      where: { eatenAt: { gte: since } }
    });

    // Cuisine distribution
    const cuisineCount = {};
    const mealCount = {};

    history.forEach(h => {
      cuisineCount[h.cuisine] = (cuisineCount[h.cuisine] || 0) + 1;
      mealCount[h.mealName] = (mealCount[h.mealName] || 0) + 1;
    });

    // Most repeated meals
    const repeatedMeals = Object.entries(mealCount)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    res.json({
      totalMeals: history.length,
      cuisineDistribution: cuisineCount,
      repeatedMeals,
      varietyScore: Object.keys(mealCount).length / (history.length || 1)
    });
  } catch (error) {
    next(error);
  }
});

// Get today's calorie stats
router.get('/calories/today', async (req, res, next) => {
  try {
    const today = startOfDay();
    const tomorrowDate = tomorrow();

    const meals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: today, lt: tomorrowDate }
      },
      orderBy: { eatenAt: 'asc' }
    });

    const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);

    res.json({
      totalCalories,
      mealCount: meals.length,
      meals: meals.map(m => ({
        id: m.id,
        mealName: m.mealName,
        mealType: m.mealType,
        calories: m.calories
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Log a meal as eaten
router.post('/', validate(historySchema), async (req, res, next) => {
  try {
    const { mealName, cuisine, mealType, rating, notes, calories } = req.validated.body;
    const entry = await req.prisma.mealHistory.create({
      data: {
        mealName,
        cuisine,
        mealType,
        rating,
        notes,
        calories
      }
    });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// Update meal history entry (e.g., add rating)
router.patch('/:id', validate(historyUpdateSchema), async (req, res, next) => {
  try {
    const { rating, notes } = req.validated.body;
    const entry = await req.prisma.mealHistory.update({
      where: { id: req.params.id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(notes !== undefined && { notes })
      }
    });
    res.json(entry);
  } catch (error) {
    next(error);
  }
});

export default router;
