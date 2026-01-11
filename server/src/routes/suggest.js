import { Router } from 'express';
import { suggestMeals, chatSuggestMeals } from '../services/ai.js';

const router = Router();

// Get AI meal suggestions
router.post('/', async (req, res) => {
  try {
    const { mood, timeAvailable, cuisine, mealType, rejectedMeals = [] } = req.body;

    // Get inventory
    const inventory = await req.prisma.inventoryItem.findMany();

    // Get recent meal history (last 14 days) to avoid repeats
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentMeals = await req.prisma.mealHistory.findMany({
      where: { eatenAt: { gte: twoWeeksAgo } },
      orderBy: { eatenAt: 'desc' }
    });

    // Get yesterday's meals to avoid same cuisine
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: yesterday }
      }
    });
    const recentCuisines = [...new Set(yesterdayMeals.map(m => m.cuisine))];

    // Get review context for AI (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ratedMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: thirtyDaysAgo },
        rating: { not: null }
      },
      orderBy: { rating: 'desc' }
    });

    const dayReviews = await req.prisma.dayReview.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      take: 7
    });

    // Build cuisine preferences from ratings
    const cuisineRatings = {};
    ratedMeals.forEach(m => {
      if (!cuisineRatings[m.cuisine]) {
        cuisineRatings[m.cuisine] = { total: 0, count: 0 };
      }
      cuisineRatings[m.cuisine].total += m.rating;
      cuisineRatings[m.cuisine].count += 1;
    });

    const cuisinePreferences = Object.entries(cuisineRatings)
      .map(([cuisine, data]) => ({
        cuisine,
        avgRating: data.total / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    const reviewContext = {
      highRatedMeals: ratedMeals.filter(m => m.rating >= 4).slice(0, 10),
      lowRatedMeals: ratedMeals.filter(m => m.rating <= 2).slice(0, 5),
      cuisinePreferences,
      recentDayReviews: dayReviews
    };

    // Get calorie context
    const calorieGoalPref = await req.prisma.userPreferences.findUnique({
      where: { key: 'dailyCalorieGoal' }
    });
    const dailyCalorieGoal = calorieGoalPref ? parseInt(calorieGoalPref.value) : 2000;

    // Get today's consumed calories
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: today, lt: tomorrow }
      }
    });
    const consumedCalories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const remainingCalories = dailyCalorieGoal - consumedCalories;

    const calorieContext = {
      dailyGoal: dailyCalorieGoal,
      consumed: consumedCalories,
      remaining: remainingCalories
    };

    const suggestions = await suggestMeals({
      mood,
      timeAvailable,
      cuisine,
      mealType,
      inventory,
      recentMeals: recentMeals.map(m => m.mealName),
      avoidCuisines: recentCuisines,
      rejectedMeals,
      reviewContext,
      calorieContext
    });

    // Sort by calories (ascending) and add warnings
    const processedSuggestions = suggestions
      .sort((a, b) => (a.estimatedCalories || 0) - (b.estimatedCalories || 0))
      .map(s => ({
        ...s,
        calorieWarning: s.estimatedCalories > remainingCalories
          ? `Exceeds remaining ${remainingCalories} kcal`
          : null
      }));

    res.json({
      suggestions: processedSuggestions,
      calorieInfo: calorieContext
    });
  } catch (error) {
    console.error('Suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conversational meal suggestions
router.post('/chat', async (req, res) => {
  try {
    const { mealType, conversation } = req.body;

    // Get context from DB
    const inventory = await req.prisma.inventoryItem.findMany();

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentMeals = await req.prisma.mealHistory.findMany({
      where: { eatenAt: { gte: twoWeeksAgo } },
      orderBy: { eatenAt: 'desc' }
    });

    // Get review context for AI (last 30 days) - same as main suggest
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ratedMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: thirtyDaysAgo },
        rating: { not: null }
      },
      orderBy: { rating: 'desc' }
    });

    // Build cuisine preferences from ratings
    const cuisineRatings = {};
    ratedMeals.forEach(m => {
      if (!cuisineRatings[m.cuisine]) {
        cuisineRatings[m.cuisine] = { total: 0, count: 0 };
      }
      cuisineRatings[m.cuisine].total += m.rating;
      cuisineRatings[m.cuisine].count += 1;
    });

    const cuisinePreferences = Object.entries(cuisineRatings)
      .map(([cuisine, data]) => ({
        cuisine,
        avgRating: data.total / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    const reviewContext = {
      highRatedMeals: ratedMeals.filter(m => m.rating >= 4).slice(0, 10),
      lowRatedMeals: ratedMeals.filter(m => m.rating <= 2).slice(0, 5),
      cuisinePreferences
    };

    // Get calorie context
    const calorieGoalPref = await req.prisma.userPreferences.findUnique({
      where: { key: 'dailyCalorieGoal' }
    });
    const dailyCalorieGoal = calorieGoalPref ? parseInt(calorieGoalPref.value) : 2000;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMeals = await req.prisma.mealHistory.findMany({
      where: { eatenAt: { gte: today, lt: tomorrow } }
    });
    const consumedCalories = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

    const result = await chatSuggestMeals({
      mealType,
      conversation,
      inventory: inventory.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', '),
      recentMeals: recentMeals.map(m => m.mealName).join(', '),
      reviewContext,
      calorieContext: {
        dailyGoal: dailyCalorieGoal,
        consumed: consumedCalories,
        remaining: dailyCalorieGoal - consumedCalories
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Chat suggestion error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
