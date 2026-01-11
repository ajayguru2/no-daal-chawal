import { Router } from 'express';

const router = Router();

// Get meals for calendar view (by month)
router.get('/calendar', async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth();

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
    res.status(500).json({ error: error.message });
  }
});

// Get meal history
router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: since }
      },
      orderBy: { eatenAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats (cuisine variety, repeat frequency)
router.get('/stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

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
    res.status(500).json({ error: error.message });
  }
});

// Get today's calorie stats
router.get('/calories/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: today, lt: tomorrow }
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
    res.status(500).json({ error: error.message });
  }
});

// Log a meal as eaten
router.post('/', async (req, res) => {
  try {
    const { mealName, cuisine, mealType, rating, notes, calories } = req.body;
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
    res.status(500).json({ error: error.message });
  }
});

// Update meal history entry (e.g., add rating)
router.patch('/:id', async (req, res) => {
  try {
    const { rating, notes } = req.body;
    const entry = await req.prisma.mealHistory.update({
      where: { id: req.params.id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(notes !== undefined && { notes })
      }
    });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
