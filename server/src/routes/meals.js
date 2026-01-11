import { Router } from 'express';

const router = Router();

// Get all saved meals
router.get('/', async (req, res) => {
  try {
    const { cuisine, mealType } = req.query;
    const meals = await req.prisma.meal.findMany({
      where: {
        ...(cuisine && { cuisine }),
        ...(mealType && { mealType })
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single meal
router.get('/:id', async (req, res) => {
  try {
    const meal = await req.prisma.meal.findUnique({
      where: { id: req.params.id }
    });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a custom meal
router.post('/', async (req, res) => {
  try {
    const { name, cuisine, mealType, prepTime, ingredients, recipe } = req.body;
    const meal = await req.prisma.meal.create({
      data: {
        name,
        cuisine,
        mealType,
        prepTime,
        ingredients: JSON.stringify(ingredients),
        recipe,
        isCustom: true
      }
    });
    res.status(201).json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update meal
router.patch('/:id', async (req, res) => {
  try {
    const { name, cuisine, mealType, prepTime, ingredients, recipe } = req.body;
    const meal = await req.prisma.meal.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(cuisine !== undefined && { cuisine }),
        ...(mealType !== undefined && { mealType }),
        ...(prepTime !== undefined && { prepTime }),
        ...(ingredients !== undefined && { ingredients: JSON.stringify(ingredients) }),
        ...(recipe !== undefined && { recipe })
      }
    });
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meal
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.meal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
