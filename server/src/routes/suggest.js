import { Router } from 'express';
import { suggestMeals, chatSuggestMeals } from '../services/ai.js';
import { validate, suggestSchema, chatSuggestSchema } from '../validators/index.js';
import {
  buildFullAIContext,
  getYesterdayCuisines,
  formatInventoryForPrompt,
  processSuggestions
} from '../utils/context-builder.js';

const router = Router();

// Get AI meal suggestions
router.post('/', validate(suggestSchema), async (req, res, next) => {
  try {
    const { mood, timeAvailable, cuisine, mealType, rejectedMeals = [] } = req.validated.body;

    // Get all context using shared utility (eliminates ~80 lines of duplicate code)
    const context = await buildFullAIContext(req.prisma);
    const avoidCuisines = await getYesterdayCuisines(req.prisma);

    const suggestions = await suggestMeals({
      mood,
      timeAvailable,
      cuisine,
      mealType,
      inventory: context.inventory,
      recentMeals: context.recentMealNames,
      avoidCuisines,
      rejectedMeals,
      reviewContext: context.reviewContext,
      calorieContext: context.calorieContext
    });

    // Process and sort suggestions
    const processedSuggestions = processSuggestions(
      suggestions,
      context.calorieContext.remaining
    );

    res.json({
      suggestions: processedSuggestions,
      calorieInfo: context.calorieContext
    });
  } catch (error) {
    next(error);
  }
});

// Conversational meal suggestions
router.post('/chat', validate(chatSuggestSchema), async (req, res, next) => {
  try {
    const { mealType, conversation } = req.validated.body;

    // Get all context using shared utility
    const context = await buildFullAIContext(req.prisma);

    const result = await chatSuggestMeals({
      mealType,
      conversation,
      inventory: context.inventoryFormatted,
      recentMeals: context.recentMealNames.join(', '),
      reviewContext: context.reviewContext,
      calorieContext: context.calorieContext
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
