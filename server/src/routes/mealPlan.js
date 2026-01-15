import { Router } from 'express';
import { generateWeekMealPlan } from '../services/ai.js';
import {
  validate,
  mealPlanSchema,
  mealPlanQuerySchema,
  generateWeekSchema
} from '../validators/index.js';
import {
  buildFullAIContext,
  formatInventoryForPrompt
} from '../utils/context-builder.js';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../utils/date.js';

const router = Router();

// Get meal plan for a week or month
router.get('/', validate(mealPlanQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { week, year, month } = req.validated.query;

    let startDate, endDate;

    if (year && month !== undefined) {
      // Get plans for a whole month
      startDate = startOfMonth(year, month);
      endDate = endOfMonth(year, month);
    } else {
      // Get plans for a week
      const baseDate = week ? new Date(week) : new Date();
      startDate = startOfWeek(baseDate);
      endDate = endOfWeek(baseDate);
    }

    const plans = await req.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { meal: true },
      orderBy: [{ date: 'asc' }, { mealType: 'asc' }]
    });

    res.json(plans);
  } catch (error) {
    next(error);
  }
});

// Add meal to plan
router.post('/', validate(mealPlanSchema), async (req, res, next) => {
  try {
    const { date, mealType, mealId, notes } = req.validated.body;
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
    next(error);
  }
});

// Update meal plan
router.patch('/:id', async (req, res, next) => {
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
    next(error);
  }
});

// Mark meal as completed
router.post('/:id/complete', async (req, res, next) => {
  try {
    const plan = await req.prisma.mealPlan.update({
      where: { id: req.params.id },
      data: {
        completed: true,
        completedAt: new Date()
      },
      include: { meal: true }
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// Unmark meal as completed
router.post('/:id/uncomplete', async (req, res, next) => {
  try {
    const plan = await req.prisma.mealPlan.update({
      where: { id: req.params.id },
      data: {
        completed: false,
        completedAt: null
      },
      include: { meal: true }
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// Delete from plan
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.mealPlan.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// AI Generate entire week's meal plan
router.post('/generate-week', validate(generateWeekSchema), async (req, res, next) => {
  try {
    const { weekStart } = req.validated.body;

    // Get context using shared utility (eliminates ~60 lines of duplicate code)
    const context = await buildFullAIContext(req.prisma);

    // Generate week plan
    const result = await generateWeekMealPlan({
      weekStart,
      inventory: context.inventoryFormatted,
      recentMeals: context.recentMealNames.join(', '),
      reviewContext: context.reviewContext,
      calorieContext: { dailyGoal: context.calorieContext.dailyGoal }
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
    next(error);
  }
});

export default router;
