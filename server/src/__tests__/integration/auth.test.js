/**
 * Integration tests for Auth API
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock } from '../setup/prisma-mock.js';

describe('Auth API', () => {
  let app;
  let prismaMock;
  let originalPin;

  beforeEach(() => {
    originalPin = process.env.APP_PIN;
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  afterEach(() => {
    process.env.APP_PIN = originalPin;
  });

  describe('GET /api/auth/status', () => {
    it('should return PIN enabled when APP_PIN is set', async () => {
      process.env.APP_PIN = 'test1234';
      app = createTestApp(prismaMock);

      const res = await request(app).get('/api/auth/status');

      expect(res.status).toBe(200);
      expect(res.body.pinEnabled).toBe(true);
    });

    it('should return PIN disabled when APP_PIN is not set', async () => {
      delete process.env.APP_PIN;
      app = createTestApp(prismaMock);

      const res = await request(app).get('/api/auth/status');

      expect(res.status).toBe(200);
      expect(res.body.pinEnabled).toBe(false);
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return success for correct PIN', async () => {
      process.env.APP_PIN = 'test1234';
      app = createTestApp(prismaMock);

      const res = await request(app)
        .post('/api/auth/verify')
        .send({ pin: 'test1234' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 for incorrect PIN', async () => {
      process.env.APP_PIN = 'test1234';
      app = createTestApp(prismaMock);

      const res = await request(app)
        .post('/api/auth/verify')
        .send({ pin: 'wrongpin' });

      expect(res.status).toBe(401);
    });

    it('should return 400 for missing PIN', async () => {
      process.env.APP_PIN = 'test1234';
      app = createTestApp(prismaMock);

      const res = await request(app)
        .post('/api/auth/verify')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for PIN too short', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .send({ pin: '123' }); // Less than 4 chars

      expect(res.status).toBe(400);
    });

    it('should return success when APP_PIN is not configured', async () => {
      delete process.env.APP_PIN;
      app = createTestApp(prismaMock);

      const res = await request(app)
        .post('/api/auth/verify')
        .send({ pin: 'anypin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
