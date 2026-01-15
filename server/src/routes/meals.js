import { Router } from 'express';
import { validate, mealSchema, mealUpdateSchema } from '../validators/index.js';

const router = Router();

// Get all saved meals
router.get('/', async (req, res, next) => {
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
    next(error);
  }
});

// Get single meal
router.get('/:id', async (req, res, next) => {
  try {
    const meal = await req.prisma.meal.findUnique({
      where: { id: req.params.id }
    });
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found', code: 'NOT_FOUND' });
    }
    res.json(meal);
  } catch (error) {
    next(error);
  }
});

// Add a custom meal
router.post('/', validate(mealSchema), async (req, res, next) => {
  try {
    const { name, cuisine, mealType, prepTime, ingredients, recipe } = req.validated.body;
    const meal = await req.prisma.meal.create({
      data: {
        name,
        cuisine,
        mealType,
        prepTime,
        ingredients: ingredients ? JSON.stringify(ingredients) : null,
        recipe,
        isCustom: true
      }
    });
    res.status(201).json(meal);
  } catch (error) {
    next(error);
  }
});

// Update meal
router.patch('/:id', validate(mealUpdateSchema), async (req, res, next) => {
  try {
    const { name, cuisine, mealType, prepTime, ingredients, recipe } = req.validated.body;
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
    next(error);
  }
});

// Delete meal
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.meal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
