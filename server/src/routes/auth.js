import { Router } from 'express';
import { validate, authSchema } from '../validators/index.js';

const router = Router();

// Verify PIN
router.post('/verify', validate(authSchema), (req, res) => {
  const { pin } = req.validated.body;
  const appPin = process.env.APP_PIN;

  if (!appPin) {
    // No PIN configured, allow access
    return res.json({ valid: true });
  }

  if (pin === appPin) {
    return res.json({ valid: true });
  }

  res.status(401).json({ valid: false, error: 'Invalid PIN', code: 'AUTH_ERROR' });
});

// Check if PIN is required
router.get('/status', (req, res) => {
  const appPin = process.env.APP_PIN;
  res.json({ pinRequired: !!appPin });
});

export default router;
