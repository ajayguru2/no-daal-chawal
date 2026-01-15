import { Router } from 'express';
import { validate, dayReviewSchema, weekReviewSchema } from '../validators/index.js';
import { startOfDay, tomorrow, daysAgo } from '../utils/date.js';
import { buildCuisinePreferences, CONFIG } from '../utils/context-builder.js';

const router = Router();

// Get unrated meals for today
router.get('/unrated-today', async (req, res, next) => {
  try {
    const today = startOfDay();
    const tomorrowDate = tomorrow();

    const unrated = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: today, lt: tomorrowDate },
        rating: null
      },
      orderBy: { eatenAt: 'desc' }
    });
    res.json(unrated);
  } catch (error) {
    next(error);
  }
});

// Get day review
router.get('/day/:date', async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }
    date.setHours(0, 0, 0, 0);

    const review = await req.prisma.dayReview.findUnique({
      where: { date }
    });
    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Create/update day review
router.put('/day/:date', validate(dayReviewSchema), async (req, res, next) => {
  try {
    const { varietyScore, effortScore, satisfactionScore, notes } = req.validated.body;
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }
    date.setHours(0, 0, 0, 0);

    const review = await req.prisma.dayReview.upsert({
      where: { date },
      create: { date, varietyScore, effortScore, satisfactionScore, notes },
      update: { varietyScore, effortScore, satisfactionScore, notes }
    });
    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Get week review
router.get('/week/:weekStart', async (req, res, next) => {
  try {
    const weekStart = new Date(req.params.weekStart);
    if (isNaN(weekStart.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }
    weekStart.setHours(0, 0, 0, 0);

    const review = await req.prisma.weekReview.findUnique({
      where: { weekStart }
    });
    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Create/update week review
router.put('/week/:weekStart', validate(weekReviewSchema), async (req, res, next) => {
  try {
    const { varietyBalance, effortVsSatisfaction, highlights, improvements, notes } = req.validated.body;
    const weekStart = new Date(req.params.weekStart);
    if (isNaN(weekStart.getTime())) {
      return res.status(400).json({ error: 'Invalid date format', code: 'VALIDATION_ERROR' });
    }
    weekStart.setHours(0, 0, 0, 0);

    const review = await req.prisma.weekReview.upsert({
      where: { weekStart },
      create: { weekStart, varietyBalance, effortVsSatisfaction, highlights, improvements, notes },
      update: { varietyBalance, effortVsSatisfaction, highlights, improvements, notes }
    });
    res.json(review);
  } catch (error) {
    next(error);
  }
});

// Get review summary for AI context
router.get('/summary', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = daysAgo(days);

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
      take: CONFIG.RECENT_REVIEWS_LIMIT
    });

    // Get week reviews
    const weekReviews = await req.prisma.weekReview.findMany({
      where: { weekStart: { gte: since } },
      orderBy: { weekStart: 'desc' },
      take: 4
    });

    // Calculate insights
    const highRatedMeals = ratedMeals.filter(m => m.rating >= CONFIG.HIGH_RATING_THRESHOLD);
    const lowRatedMeals = ratedMeals.filter(m => m.rating <= CONFIG.LOW_RATING_THRESHOLD);
    const avgRating = ratedMeals.length > 0
      ? ratedMeals.reduce((sum, m) => sum + m.rating, 0) / ratedMeals.length
      : null;

    // Use shared utility for cuisine preferences
    const cuisinePrefs = await buildCuisinePreferences(req.prisma, days);

    res.json({
      highRatedMeals: highRatedMeals.slice(0, CONFIG.HIGH_RATED_MEALS_LIMIT),
      lowRatedMeals: lowRatedMeals.slice(0, CONFIG.LOW_RATED_MEALS_LIMIT),
      avgRating,
      recentDayReviews: dayReviews,
      recentWeekReviews: weekReviews,
      cuisinePreferences: cuisinePrefs.all
    });
  } catch (error) {
    next(error);
  }
});

// Note: preferences routes were incorrectly duplicated here - they should be in preferences.js

export default router;
