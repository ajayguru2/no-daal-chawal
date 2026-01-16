/**
 * Integration tests for History API
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('History API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/history', () => {
    it('should return meal history', async () => {
      const history = [
        testData.mealHistory({ id: '1', mealName: 'Meal 1' }),
        testData.mealHistory({ id: '2', mealName: 'Meal 2' })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(history);

      const res = await request(app).get('/api/history');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array when no history', async () => {
      prismaMock.mealHistory.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/history');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should filter by days parameter', async () => {
      prismaMock.mealHistory.findMany.mockResolvedValue([]);

      await request(app).get('/api/history?days=30');

      expect(prismaMock.mealHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eatenAt: expect.any(Object)
          })
        })
      );
    });
  });

  describe('GET /api/history/calendar', () => {
    it('should return history grouped by date', async () => {
      const history = [
        testData.mealHistory({ mealName: 'Breakfast', eatenAt: new Date('2024-06-15') }),
        testData.mealHistory({ mealName: 'Lunch', eatenAt: new Date('2024-06-15') })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(history);

      const res = await request(app).get('/api/history/calendar?year=2024&month=6');

      expect(res.status).toBe(200);
    });

    it('should accept year and month parameters', async () => {
      prismaMock.mealHistory.findMany.mockResolvedValue([]);

      await request(app).get('/api/history/calendar?year=2024&month=6');

      expect(prismaMock.mealHistory.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/history/stats', () => {
    it('should return cuisine variety stats', async () => {
      const history = [
        testData.mealHistory({ cuisine: 'indian' }),
        testData.mealHistory({ cuisine: 'indian' }),
        testData.mealHistory({ cuisine: 'chinese' })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(history);

      const res = await request(app).get('/api/history/stats');

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/history/calories/today', () => {
    it('should return today\'s calorie total', async () => {
      const todayMeals = [
        testData.mealHistory({ calories: 300 }),
        testData.mealHistory({ calories: 500 })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(todayMeals);

      const res = await request(app).get('/api/history/calories/today');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalCalories');
    });

    it('should handle meals without calories', async () => {
      const todayMeals = [
        testData.mealHistory({ calories: 300 }),
        testData.mealHistory({ calories: null })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(todayMeals);

      const res = await request(app).get('/api/history/calories/today');

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/history', () => {
    const validHistory = {
      mealName: 'Butter Chicken',
      cuisine: 'indian',
      mealType: 'dinner'
    };

    it('should log a meal as eaten', async () => {
      const created = testData.mealHistory(validHistory);
      prismaMock.mealHistory.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/history')
        .send(validHistory);

      expect(res.status).toBe(201);
      expect(res.body.mealName).toBe('Butter Chicken');
    });

    it('should log meal with rating', async () => {
      const withRating = { ...validHistory, rating: 5 };
      prismaMock.mealHistory.create.mockResolvedValue(testData.mealHistory(withRating));

      const res = await request(app)
        .post('/api/history')
        .send(withRating);

      expect(res.status).toBe(201);
    });

    it('should log meal with calories', async () => {
      const withCalories = { ...validHistory, calories: 500 };
      prismaMock.mealHistory.create.mockResolvedValue(testData.mealHistory(withCalories));

      const res = await request(app)
        .post('/api/history')
        .send(withCalories);

      expect(res.status).toBe(201);
    });

    it('should return 400 for missing mealName', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({ cuisine: 'indian', mealType: 'dinner' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid rating', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({ ...validHistory, rating: 6 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for rating below 1', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({ ...validHistory, rating: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid cuisine', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({ ...validHistory, cuisine: 'french' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/history/:id', () => {
    it('should update rating', async () => {
      const updated = testData.mealHistory({ rating: 4 });
      prismaMock.mealHistory.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/history/history-123')
        .send({ rating: 4 });

      expect(res.status).toBe(200);
    });

    it('should update notes', async () => {
      const updated = testData.mealHistory({ notes: 'Great meal!' });
      prismaMock.mealHistory.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/history/history-123')
        .send({ notes: 'Great meal!' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid rating', async () => {
      const res = await request(app)
        .patch('/api/history/history-123')
        .send({ rating: 10 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent history', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.mealHistory.update.mockRejectedValue(error);

      const res = await request(app)
        .patch('/api/history/non-existent')
        .send({ rating: 4 });

      expect(res.status).toBe(404);
    });
  });
});
