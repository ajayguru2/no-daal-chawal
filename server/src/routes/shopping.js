import { Router } from 'express';

const router = Router();

// Get shopping list
router.get('/', async (req, res) => {
  try {
    const items = await req.prisma.shoppingItem.findMany({
      orderBy: [{ isPurchased: 'asc' }, { category: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate shopping list from meal plan
router.post('/generate', async (req, res) => {
  try {
    const { week } = req.body;
    const startDate = week ? new Date(week) : new Date();

    // Get week start
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(startDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get meal plans - look for plans with notes (meal data stored as JSON)
    const plans = await req.prisma.mealPlan.findMany({
      where: {
        date: { gte: weekStart, lt: weekEnd },
        notes: { not: null }
      }
    });

    if (plans.length === 0) {
      return res.status(400).json({
        error: 'No meals planned for this week. Add meals to your meal plan first.'
      });
    }

    // Get current inventory
    const inventory = await req.prisma.inventoryItem.findMany();
    const inventoryMap = new Map(
      inventory.map(i => [i.name.toLowerCase(), i])
    );

    // Aggregate ingredients needed
    const needed = new Map();

    for (const plan of plans) {
      // Parse meal data from notes field
      let mealData = null;
      try {
        mealData = JSON.parse(plan.notes);
      } catch {
        continue;
      }

      if (!mealData || !mealData.ingredients) continue;

      const ingredients = Array.isArray(mealData.ingredients)
        ? mealData.ingredients
        : [];

      for (const ing of ingredients) {
        // Handle both formats: { name, quantity, unit } and { item, quantity, unit }
        const ingredientName = ing.name || ing.item;
        if (!ingredientName) continue;

        const key = ingredientName.toLowerCase();
        const current = needed.get(key) || {
          name: ingredientName,
          quantity: 0,
          unit: ing.unit || 'pieces',
          category: categorizeIngredient(ingredientName)
        };
        // Handle quantity as string or number
        const qty = typeof ing.quantity === 'string' ? parseFloat(ing.quantity) || 1 : ing.quantity || 1;
        current.quantity += qty;
        needed.set(key, current);
      }
    }

    // Check against inventory and create shopping items
    const shoppingItems = [];

    for (const [key, item] of needed) {
      const inStock = inventoryMap.get(key);
      const neededQty = item.quantity;
      const haveQty = inStock?.quantity || 0;

      if (haveQty < neededQty) {
        shoppingItems.push({
          name: item.name,
          quantity: neededQty - haveQty,
          unit: item.unit,
          category: item.category,
          isPurchased: false
        });
      }
    }

    // Create shopping items in DB
    if (shoppingItems.length > 0) {
      await req.prisma.shoppingItem.createMany({
        data: shoppingItems
      });
    }

    const allItems = await req.prisma.shoppingItem.findMany({
      orderBy: [{ isPurchased: 'asc' }, { category: 'asc' }]
    });

    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add item manually
router.post('/', async (req, res) => {
  try {
    const { name, quantity, unit, category } = req.body;
    const item = await req.prisma.shoppingItem.create({
      data: {
        name,
        quantity,
        unit,
        category: category || categorizeIngredient(name)
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as purchased
router.patch('/:id', async (req, res) => {
  try {
    const { isPurchased, quantity } = req.body;
    const item = await req.prisma.shoppingItem.update({
      where: { id: req.params.id },
      data: {
        ...(isPurchased !== undefined && { isPurchased }),
        ...(quantity !== undefined && { quantity })
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.shoppingItem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear purchased items
router.delete('/clear/purchased', async (req, res) => {
  try {
    await req.prisma.shoppingItem.deleteMany({
      where: { isPurchased: true }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to categorize ingredients
function categorizeIngredient(name) {
  const n = name.toLowerCase();

  const categories = {
    vegetables: ['onion', 'tomato', 'potato', 'carrot', 'beans', 'capsicum', 'cauliflower', 'cabbage', 'spinach', 'palak', 'methi', 'bhindi', 'brinjal', 'lauki', 'turai', 'parwal', 'peas', 'mushroom'],
    dairy: ['milk', 'curd', 'paneer', 'butter', 'ghee', 'cream', 'cheese', 'yogurt', 'dahi'],
    grains: ['rice', 'atta', 'maida', 'besan', 'rava', 'suji', 'poha', 'oats', 'bread', 'roti'],
    proteins: ['chicken', 'mutton', 'fish', 'egg', 'prawn', 'dal', 'chana', 'rajma', 'chole', 'tofu', 'soya'],
    spices: ['haldi', 'mirchi', 'jeera', 'dhania', 'garam masala', 'hing', 'rai', 'methi', 'kasuri', 'chaat masala'],
    others: []
  };

  for (const [cat, items] of Object.entries(categories)) {
    if (items.some(item => n.includes(item))) {
      return cat;
    }
  }
  return 'others';
}

export default router;
