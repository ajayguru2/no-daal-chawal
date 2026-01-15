import { Router } from 'express';
import { generateRecipe } from '../services/ai.js';
import { validate, generateRecipeSchema } from '../validators/index.js';
import { safeJsonParse } from '../utils/json.js';

const router = Router();

// Helper to safely parse JSON fields in recipes
function parseRecipeJson(recipe) {
  return {
    ...recipe,
    ingredients: safeJsonParse(recipe.ingredients, []),
    instructions: safeJsonParse(recipe.instructions, []),
    tips: recipe.tips ? safeJsonParse(recipe.tips, []) : []
  };
}

// Generate and save a recipe for a meal
router.post('/generate', validate(generateRecipeSchema), async (req, res, next) => {
  try {
    const { meal } = req.validated.body;

    // Generate recipe using AI
    const recipeData = await generateRecipe(meal);

    // Save to database
    const recipe = await req.prisma.recipe.create({
      data: {
        mealName: recipeData.mealName,
        cuisine: recipeData.cuisine || meal.cuisine,
        prepTime: recipeData.prepTime || meal.prepTime || 30,
        cookTime: recipeData.cookTime || 20,
        servings: recipeData.servings || 2,
        ingredients: JSON.stringify(recipeData.ingredients),
        instructions: JSON.stringify(recipeData.instructions),
        tips: recipeData.tips ? JSON.stringify(recipeData.tips) : null,
        description: recipeData.description,
        calories: recipeData.calories || meal.estimatedCalories
      }
    });

    // Return recipe with parsed JSON fields
    res.json({
      ...recipe,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      tips: recipeData.tips
    });
  } catch (error) {
    next(error);
  }
});

// Get all saved recipes
router.get('/', async (req, res, next) => {
  try {
    const recipes = await req.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const parsed = recipes.map(parseRecipeJson);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

// Search recipes by name or cuisine (must be before /:id to avoid conflicts)
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'VALIDATION_ERROR'
      });
    }

    const recipes = await req.prisma.recipe.findMany({
      where: {
        OR: [
          { mealName: { contains: query } },
          { cuisine: { contains: query } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsed = recipes.map(parseRecipeJson);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

// Get a single recipe by ID
router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await req.prisma.recipe.findUnique({
      where: { id: req.params.id }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found', code: 'NOT_FOUND' });
    }

    res.json(parseRecipeJson(recipe));
  } catch (error) {
    next(error);
  }
});

// Delete a recipe
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.recipe.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
