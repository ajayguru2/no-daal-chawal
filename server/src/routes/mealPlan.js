import { Router } from 'express';

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

export default router;
