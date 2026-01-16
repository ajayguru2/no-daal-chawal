/**
 * Integration tests for Preferences API
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('Preferences API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/preferences', () => {
    it('should return all preferences', async () => {
      const prefs = [
        testData.userPreference({ key: 'dailyCalorieGoal', value: '2000' }),
        testData.userPreference({ key: 'theme', value: 'dark' })
      ];
      prismaMock.userPreferences.findMany.mockResolvedValue(prefs);

      const res = await request(app).get('/api/preferences');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array when no preferences', async () => {
      prismaMock.userPreferences.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/preferences');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/preferences/:key', () => {
    it('should return specific preference', async () => {
      const pref = testData.userPreference({ key: 'dailyCalorieGoal', value: '2000' });
      prismaMock.userPreferences.findUnique.mockResolvedValue(pref);

      const res = await request(app).get('/api/preferences/dailyCalorieGoal');

      expect(res.status).toBe(200);
      expect(res.body.value).toBe('2000');
    });

    it('should return 404 for non-existent key', async () => {
      prismaMock.userPreferences.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/preferences/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/preferences/:key', () => {
    it('should create new preference', async () => {
      const pref = testData.userPreference({ key: 'dailyCalorieGoal', value: '2500' });
      prismaMock.userPreferences.upsert.mockResolvedValue(pref);

      const res = await request(app)
        .put('/api/preferences/dailyCalorieGoal')
        .send({ value: '2500' });

      expect(res.status).toBe(200);
      expect(res.body.value).toBe('2500');
    });

    it('should update existing preference', async () => {
      const pref = testData.userPreference({ key: 'theme', value: 'light' });
      prismaMock.userPreferences.upsert.mockResolvedValue(pref);

      const res = await request(app)
        .put('/api/preferences/theme')
        .send({ value: 'light' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for missing value', async () => {
      const res = await request(app)
        .put('/api/preferences/theme')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for value exceeding max length', async () => {
      const res = await request(app)
        .put('/api/preferences/theme')
        .send({ value: 'a'.repeat(1001) });

      expect(res.status).toBe(400);
    });
  });
});
