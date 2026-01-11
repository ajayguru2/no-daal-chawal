import { Router } from 'express';
import { generateRecipe } from '../services/ai.js';

const router = Router();

// Generate and save a recipe for a meal
router.post('/generate', async (req, res) => {
  try {
    const { meal } = req.body;

    if (!meal || !meal.name) {
      return res.status(400).json({ error: 'Meal data required' });
    }

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
    console.error('Recipe generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all saved recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await req.prisma.recipe.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Parse JSON fields
    const parsed = recipes.map(r => ({
      ...r,
      ingredients: JSON.parse(r.ingredients),
      instructions: JSON.parse(r.instructions),
      tips: r.tips ? JSON.parse(r.tips) : []
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await req.prisma.recipe.findUnique({
      where: { id: req.params.id }
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
      instructions: JSON.parse(recipe.instructions),
      tips: recipe.tips ? JSON.parse(recipe.tips) : []
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a recipe
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.recipe.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search recipes by name or cuisine
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const recipes = await req.prisma.recipe.findMany({
      where: {
        OR: [
          { mealName: { contains: query } },
          { cuisine: { contains: query } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    const parsed = recipes.map(r => ({
      ...r,
      ingredients: JSON.parse(r.ingredients),
      instructions: JSON.parse(r.instructions),
      tips: r.tips ? JSON.parse(r.tips) : []
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
