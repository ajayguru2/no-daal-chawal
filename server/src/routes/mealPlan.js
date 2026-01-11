import { Router } from 'express';
import { generateWeekMealPlan } from '../services/ai.js';

const router = Router();

// Get meal plan for a week or month
router.get('/', async (req, res) => {
  try {
    const { week, year, month } = req.query;

    let startDate, endDate;

    if (year && month !== undefined) {
      // Get plans for a whole month
      startDate = new Date(parseInt(year), parseInt(month), 1);
      endDate = new Date(parseInt(year), parseInt(month) + 1, 1);
    } else {
      // Get plans for a week
      const baseDate = week ? new Date(week) : new Date();
      const day = baseDate.getDay();
      const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(baseDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    }

    const plans = await req.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      include: { meal: true },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }]
    });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add meal to plan
router.post('/', async (req, res) => {
  try {
    const { date, mealType, mealId, notes } = req.body;
    const plan = await req.prisma.mealPlan.create({
      data: {
        date: new Date(date),
        mealType,
        mealId,
        notes
      },
      include: { meal: true }
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update meal plan
router.patch('/:id', async (req, res) => {
  try {
    const { mealId, notes } = req.body;
    const plan = await req.prisma.mealPlan.update({
      where: { id: req.params.id },
      data: {
        ...(mealId !== undefined && { mealId }),
        ...(notes !== undefined && { notes })
      },
      include: { meal: true }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete from plan
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.mealPlan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Generate entire week's meal plan
router.post('/generate-week', async (req, res) => {
  try {
    const { weekStart } = req.body;

    // Get context data
    const inventory = await req.prisma.inventoryItem.findMany();

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentMeals = await req.prisma.mealHistory.findMany({
      where: { eatenAt: { gte: twoWeeksAgo } },
      orderBy: { eatenAt: 'desc' }
    });

    // Get review context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ratedMeals = await req.prisma.mealHistory.findMany({
      where: {
        eatenAt: { gte: thirtyDaysAgo },
        rating: { not: null }
      },
      orderBy: { rating: 'desc' }
    });

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

    // Get calorie goal
    const calorieGoalPref = await req.prisma.userPreferences.findUnique({
      where: { key: 'dailyCalorieGoal' }
    });
    const dailyCalorieGoal = calorieGoalPref ? parseInt(calorieGoalPref.value) : 2000;

    // Generate week plan
    const result = await generateWeekMealPlan({
      weekStart,
      inventory: inventory.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', '),
      recentMeals: recentMeals.map(m => m.mealName).join(', '),
      reviewContext,
      calorieContext: { dailyGoal: dailyCalorieGoal }
    });

    // Calculate week dates
    const startDate = new Date(weekStart);
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Save all meals to the plan
    const createdPlans = [];
    for (const dayPlan of result.weekPlan) {
      const dayIndex = DAYS.indexOf(dayPlan.day);
      const planDate = new Date(startDate);
      planDate.setDate(startDate.getDate() + dayIndex);

      for (const [mealType, meal] of Object.entries(dayPlan.meals)) {
        if (meal && meal.name) {
          const plan = await req.prisma.mealPlan.create({
            data: {
              date: planDate,
              mealType,
              notes: JSON.stringify({
                name: meal.name,
                cuisine: meal.cuisine,
                prepTime: meal.prepTime,
                estimatedCalories: meal.estimatedCalories,
                description: meal.description,
                ingredients: meal.ingredients
              })
            }
          });
          createdPlans.push(plan);
        }
      }
    }

    res.json({
      success: true,
      weekPlan: result.weekPlan,
      createdPlans: createdPlans.length
    });
  } catch (error) {
    console.error('Generate week error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
