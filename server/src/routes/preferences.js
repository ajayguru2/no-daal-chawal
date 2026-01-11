import { Router } from 'express';

const router = Router();

// Get a preference
router.get('/:key', async (req, res) => {
  try {
    const pref = await req.prisma.userPreferences.findUnique({
      where: { key: req.params.key }
    });
    res.json({ value: pref?.value || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set a preference
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const pref = await req.prisma.userPreferences.upsert({
      where: { key: req.params.key },
      update: { value: String(value) },
      create: { key: req.params.key, value: String(value) }
    });
    res.json(pref);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all preferences
router.get('/', async (req, res) => {
  try {
    const prefs = await req.prisma.userPreferences.findMany();
    const result = {};
    prefs.forEach(p => { result[p.key] = p.value; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
