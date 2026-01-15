import { Router } from 'express';
import { validate, inventorySchema, inventoryUpdateSchema } from '../validators/index.js';

const router = Router();

// Get all inventory items
router.get('/', async (req, res, next) => {
  try {
    const items = await req.prisma.inventoryItem.findMany({
      orderBy: { category: 'asc' }
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

// Get low stock items
router.get('/low-stock', async (req, res, next) => {
  try {
    // Fetch all items with lowStockAt set and filter in JS
    // (Prisma doesn't support comparing two columns directly)
    const allItems = await req.prisma.inventoryItem.findMany({
      where: { lowStockAt: { not: null } }
    });
    const lowStock = allItems.filter(item => item.quantity <= item.lowStockAt);
    res.json(lowStock);
  } catch (error) {
    next(error);
  }
});

// Add inventory item
router.post('/', validate(inventorySchema), async (req, res, next) => {
  try {
    const { name, category, quantity, unit, lowStockAt, expiresAt } = req.validated.body;
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
    next(error);
  }
});

// Update inventory item
router.patch('/:id', validate(inventoryUpdateSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, unit, lowStockAt, expiresAt } = req.validated.body;
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
    next(error);
  }
});

// Delete inventory item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await req.prisma.inventoryItem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
