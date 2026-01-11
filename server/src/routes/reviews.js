import { Router } from 'express';

const router = Router();

// Get unrated meals for today
router.get('/unrated-today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const unrated = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: today, lt: tomorrow },
        rating: null
      },
      orderBy: { eatenAt: 'desc' }
    });
    res.json(unrated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get day review
router.get('/day/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const review = await req.prisma.dayReview.findUnique({
      where: { date }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/update day review
router.put('/day/:date', async (req, res) => {
  try {
    const { varietyScore, effortScore, satisfactionScore, notes } = req.body;
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    const review = await req.prisma.dayReview.upsert({
      where: { date },
      create: { date, varietyScore, effortScore, satisfactionScore, notes },
      update: { varietyScore, effortScore, satisfactionScore, notes }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get week review
router.get('/week/:weekStart', async (req, res) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    weekStart.setHours(0, 0, 0, 0);

    const review = await req.prisma.weekReview.findUnique({
      where: { weekStart }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/update week review
router.put('/week/:weekStart', async (req, res) => {
  try {
    const { varietyBalance, effortVsSatisfaction, highlights, improvements, notes } = req.body;
    const weekStart = new Date(req.params.weekStart);
    weekStart.setHours(0, 0, 0, 0);

    const review = await req.prisma.weekReview.upsert({
      where: { weekStart },
      create: { weekStart, varietyBalance, effortVsSatisfaction, highlights, improvements, notes },
      update: { varietyBalance, effortVsSatisfaction, highlights, improvements, notes }
    });
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get review summary for AI context
router.get('/summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get rated meals
    const ratedMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: since },
        rating: { not: null }
      },
      orderBy: { rating: 'desc' }
    });

    // Get day reviews
    const dayReviews = await req.prisma.dayReview.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 7
    });

    // Get week reviews
    const weekReviews = await req.prisma.weekReview.findMany({
      where: { weekStart: { gte: since } },
      orderBy: { weekStart: 'desc' },
      take: 4
    });

    // Calculate insights
    const highRatedMeals = ratedMeals.filter(m => m.rating >= 4);
    const lowRatedMeals = ratedMeals.filter(m => m.rating <= 2);
    const avgRating = ratedMeals.length > 0
      ? ratedMeals.reduce((sum, m) => sum + m.rating, 0) / ratedMeals.length
      : null;

    res.json({
      highRatedMeals: highRatedMeals.slice(0, 10),
      lowRatedMeals: lowRatedMeals.slice(0, 5),
      avgRating,
      recentDayReviews: dayReviews,
      recentWeekReviews: weekReviews,
      cuisinePreferences: calculateCuisinePreferences(ratedMeals)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateCuisinePreferences(ratedMeals) {
  const cuisineRatings = {};
  ratedMeals.forEach(m => {
    if (!cuisineRatings[m.cuisine]) {
      cuisineRatings[m.cuisine] = { total: 0, count: 0 };
    }
    cuisineRatings[m.cuisine].total += m.rating;
    cuisineRatings[m.cuisine].count += 1;
  });

  return Object.entries(cuisineRatings)
    .map(([cuisine, data]) => ({
      cuisine,
      avgRating: data.total / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgRating - a.avgRating);
}

// Get user preference
router.get('/preferences/:key', async (req, res) => {
  try {
    const pref = await req.prisma.userPreferences.findUnique({
      where: { key: req.params.key }
    });
    res.json(pref ? JSON.parse(pref.value) : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set user preference
router.put('/preferences/:key', async (req, res) => {
  try {
    const pref = await req.prisma.userPreferences.upsert({
      where: { key: req.params.key },
      create: { key: req.params.key, value: JSON.stringify(req.body.value) },
      update: { value: JSON.stringify(req.body.value) }
    });
    res.json(JSON.parse(pref.value));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
