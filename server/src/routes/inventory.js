import { Router } from 'express';

const router = Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await req.prisma.inventoryItem.findMany({
      orderBy: { category: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const items = await req.prisma.inventoryItem.findMany({
      where: {
        AND: [
          { lowStockAt: { not: null } },
          { quantity: { lte: req.prisma.inventoryItem.fields.lowStockAt } }
        ]
      }
    });
    // Filter in JS since SQLite doesn't support comparing two columns easily
    const allItems = await req.prisma.inventoryItem.findMany({
      where: { lowStockAt: { not: null } }
    });
    const lowStock = allItems.filter(item => item.quantity <= item.lowStockAt);
    res.json(lowStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add inventory item
router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, lowStockAt, expiresAt } = req.body;
    const item = await req.prisma.inventoryItem.create({
      data: {
        name,
        category,
        quantity,
        unit,
        lowStockAt,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, lowStockAt, expiresAt } = req.body;
    const item = await req.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(lowStockAt !== undefined && { lowStockAt }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await req.prisma.inventoryItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
