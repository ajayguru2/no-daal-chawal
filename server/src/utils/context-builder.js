/**
 * Shared context building utilities for AI meal suggestions
 * Eliminates code duplication across suggest.js, mealPlan.js, and other routes
 */

import { daysAgo, startOfDay, tomorrow } from './date.js';

// Configuration constants
export const CONFIG = {
  RECENT_MEALS_DAYS: 14,
  REVIEW_CONTEXT_DAYS: 30,
  HIGH_RATING_THRESHOLD: 4,
  LOW_RATING_THRESHOLD: 2,
  DEFAULT_CALORIE_GOAL: 2000,
  HIGH_RATED_MEALS_LIMIT: 10,
  LOW_RATED_MEALS_LIMIT: 5,
  RECENT_REVIEWS_LIMIT: 7
};

/**
 * Build cuisine preferences from meal history ratings
 * @param {object} prisma - Prisma client instance
 * @param {number} [days=30] - Number of days to look back
 * @returns {Promise<{preferred: string[], avoided: string[], all: Array}>}
 */
export async function buildCuisinePreferences(prisma, days = CONFIG.REVIEW_CONTEXT_DAYS) {
  const since = daysAgo(days);

  const ratedMeals = await prisma.mealHistory.findMany({
    where: {
      eatenAt: { gte: since },
      rating: { not: null }
    },
    select: { cuisine: true, rating: true }
  });

  // Calculate average rating per cuisine
  const cuisineRatings = {};
  for (const meal of ratedMeals) {
    if (!cuisineRatings[meal.cuisine]) {
      cuisineRatings[meal.cuisine] = { total: 0, count: 0 };
    }
    cuisineRatings[meal.cuisine].total += meal.rating;
    cuisineRatings[meal.cuisine].count += 1;
  }

  // Build sorted preferences
  const all = Object.entries(cuisineRatings)
    .map(([cuisine, data]) => ({
      cuisine,
      avgRating: data.total / data.count,
      count: data.count
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  const preferred = all
    .filter(c => c.avgRating >= CONFIG.HIGH_RATING_THRESHOLD)
    .map(c => c.cuisine);

  const avoided = all
    .filter(c => c.avgRating <= CONFIG.LOW_RATING_THRESHOLD)
    .map(c => c.cuisine);

  return { preferred, avoided, all };
}

/**
 * Get recent meals to avoid repetition
 * @param {object} prisma - Prisma client instance
 * @param {number} [days=14] - Number of days to look back
 * @returns {Promise<string[]>} Array of meal names
 */
export async function getRecentMealNames(prisma, days = CONFIG.RECENT_MEALS_DAYS) {
  const since = daysAgo(days);

  const meals = await prisma.mealHistory.findMany({
    where: { eatenAt: { gte: since } },
    select: { mealName: true },
    distinct: ['mealName']
  });

  return meals.map(m => m.mealName);
}

/**
 * Get recent meal history with full details
 * @param {object} prisma - Prisma client instance
 * @param {number} [days=14] - Number of days to look back
 * @returns {Promise<Array>}
 */
export async function getRecentMeals(prisma, days = CONFIG.RECENT_MEALS_DAYS) {
  const since = daysAgo(days);

  return prisma.mealHistory.findMany({
    where: { eatenAt: { gte: since } },
    orderBy: { eatenAt: 'desc' }
  });
}

/**
 * Get cuisines eaten yesterday to avoid same-day repetition
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<string[]>}
 */
export async function getYesterdayCuisines(prisma) {
  const yesterdayStart = daysAgo(1);

  const meals = await prisma.mealHistory.findMany({
    where: { eatenAt: { gte: yesterdayStart } },
    select: { cuisine: true }
  });

  return [...new Set(meals.map(m => m.cuisine))];
}

/**
 * Get today's calorie context
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<{dailyGoal: number, consumed: number, remaining: number}>}
 */
export async function getCalorieContext(prisma) {
  const today = startOfDay();
  const tomorrowDate = tomorrow();

  // Get calorie goal preference
  let dailyGoal = CONFIG.DEFAULT_CALORIE_GOAL;
  try {
    const goalPref = await prisma.userPreferences.findUnique({
      where: { key: 'dailyCalorieGoal' }
    });
    if (goalPref?.value) {
      dailyGoal = parseInt(goalPref.value, 10) || CONFIG.DEFAULT_CALORIE_GOAL;
    }
  } catch {
    // UserPreferences table might not exist, use default
  }

  // Get today's consumed calories
  const todaysMeals = await prisma.mealHistory.findMany({
    where: {
      eatenAt: { gte: today, lt: tomorrowDate }
    },
    select: { calories: true }
  });

  const consumed = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const remaining = Math.max(0, dailyGoal - consumed);

  return { dailyGoal, consumed, remaining };
}

/**
 * Get review context for AI suggestions
 * @param {object} prisma - Prisma client instance
 * @param {number} [days=30] - Number of days to look back
 * @returns {Promise<object>}
 */
export async function getReviewContext(prisma, days = CONFIG.REVIEW_CONTEXT_DAYS) {
  const since = daysAgo(days);

  // Get rated meals
  const ratedMeals = await prisma.mealHistory.findMany({
    where: {
      eatenAt: { gte: since },
      rating: { not: null }
    },
    orderBy: { rating: 'desc' }
  });

  // Get recent day reviews
  const dayReviews = await prisma.dayReview.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
    take: CONFIG.RECENT_REVIEWS_LIMIT
  });

  // Get cuisine preferences
  const cuisinePrefs = await buildCuisinePreferences(prisma, days);

  return {
    highRatedMeals: ratedMeals
      .filter(m => m.rating >= CONFIG.HIGH_RATING_THRESHOLD)
      .slice(0, CONFIG.HIGH_RATED_MEALS_LIMIT),
    lowRatedMeals: ratedMeals
      .filter(m => m.rating <= CONFIG.LOW_RATING_THRESHOLD)
      .slice(0, CONFIG.LOW_RATED_MEALS_LIMIT),
    cuisinePreferences: cuisinePrefs.all,
    recentDayReviews: dayReviews
  };
}

/**
 * Get current inventory
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<Array>}
 */
export async function getInventory(prisma) {
  return prisma.inventoryItem.findMany({
    select: { name: true, quantity: true, unit: true }
  });
}

/**
 * Format inventory for AI prompt
 * @param {Array} inventory
 * @returns {string}
 */
export function formatInventoryForPrompt(inventory) {
  if (!inventory?.length) return 'No inventory information available';
  return inventory
    .map(i => `${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : ''}`)
    .join(', ');
}

/**
 * Build complete AI context for meal suggestions
 * This is the main function that combines all context for AI
 * @param {object} prisma - Prisma client instance
 * @returns {Promise<object>}
 */
export async function buildFullAIContext(prisma) {
  const [
    inventory,
    recentMeals,
    recentMealNames,
    yesterdayCuisines,
    calorieContext,
    reviewContext
  ] = await Promise.all([
    getInventory(prisma),
    getRecentMeals(prisma),
    getRecentMealNames(prisma),
    getYesterdayCuisines(prisma),
    getCalorieContext(prisma),
    getReviewContext(prisma)
  ]);

  return {
    inventory,
    inventoryFormatted: formatInventoryForPrompt(inventory),
    recentMeals,
    recentMealNames,
    yesterdayCuisines,
    calorieContext,
    reviewContext
  };
}

/**
 * Process and sort suggestions with calorie warnings
 * @param {Array} suggestions - Raw suggestions from AI
 * @param {number} remainingCalories - Remaining calorie budget
 * @returns {Array}
 */
export function processSuggestions(suggestions, remainingCalories) {
  return suggestions
    .sort((a, b) => (a.estimatedCalories || 0) - (b.estimatedCalories || 0))
    .map(s => ({
      ...s,
      calorieWarning: s.estimatedCalories > remainingCalories
        ? `Exceeds remaining ${remainingCalories} kcal`
        : null
    }));
}
