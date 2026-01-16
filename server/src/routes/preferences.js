import { Router } from 'express';
import { validate, preferenceSchema } from '../validators/index.js';

const router = Router();

// Get a preference
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!key || key.length > 100) {
      return res.status(400).json({
        error: 'Invalid preference key',
        code: 'VALIDATION_ERROR'
      });
    }

    const pref = await req.prisma.userPreferences.findUnique({
      where: { key }
    });
    if (!pref) {
      return res.status(404).json({ error: 'Preference not found', code: 'NOT_FOUND' });
    }
    res.json(pref);
  } catch (error) {
    next(error);
  }
});

// Set a preference
router.put('/:key', validate(preferenceSchema), async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!key || key.length > 100) {
      return res.status(400).json({
        error: 'Invalid preference key',
        code: 'VALIDATION_ERROR'
      });
    }

    const { value } = req.validated.body;
    const pref = await req.prisma.userPreferences.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
    res.json(pref);
  } catch (error) {
    next(error);
  }
});

// Get all preferences
router.get('/', async (req, res, next) => {
  try {
    const prefs = await req.prisma.userPreferences.findMany();
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

export default router;
