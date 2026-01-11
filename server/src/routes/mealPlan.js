import { Router } from 'express';

const router = Router();

// Get meal plan for a week
router.get('/', async (req, res) => {
  try {
    const { week } = req.query;
    const startDate = week ? new Date(week) : new Date();

    // Get start of week (Monday)
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(startDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const plans = await req.prisma.mealPlan.findMany({
      where: {
        date: {
          gte: weekStart,
          lt: weekEnd
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

export default router;
