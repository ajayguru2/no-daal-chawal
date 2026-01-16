/**
 * Integration tests for Reviews API
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('Reviews API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/reviews/unrated-today', () => {
    it('should return unrated meals from today', async () => {
      const meals = [
        testData.mealHistory({ rating: null }),
        testData.mealHistory({ rating: null })
      ];
      prismaMock.mealHistory.findMany.mockResolvedValue(meals);

      const res = await request(app).get('/api/reviews/unrated-today');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty when all meals rated', async () => {
      prismaMock.mealHistory.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/reviews/unrated-today');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/reviews/day/:date', () => {
    it('should return day review', async () => {
      const review = testData.dayReview();
      prismaMock.dayReview.findUnique.mockResolvedValue(review);

      const res = await request(app).get('/api/reviews/day/2024-06-15');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('varietyScore');
    });

    it('should return 404 when no review exists', async () => {
      prismaMock.dayReview.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/reviews/day/2024-06-15');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid date format', async () => {
      const res = await request(app).get('/api/reviews/day/06-15-2024');

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/reviews/day/:date', () => {
    const validReview = {
      varietyScore: 7,
      effortScore: 5,
      satisfactionScore: 8
    };

    it('should create day review', async () => {
      const created = testData.dayReview(validReview);
      prismaMock.dayReview.upsert.mockResolvedValue(created);

      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send(validReview);

      expect(res.status).toBe(200);
      expect(res.body.varietyScore).toBe(7);
    });

    it('should update existing day review', async () => {
      const updated = testData.dayReview({ ...validReview, notes: 'Updated' });
      prismaMock.dayReview.upsert.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({ ...validReview, notes: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for missing required scores', async () => {
      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({ varietyScore: 7 }); // Missing effortScore and satisfactionScore

      expect(res.status).toBe(400);
    });

    it('should return 400 for score below 0', async () => {
      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({ ...validReview, varietyScore: -1 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for score above 10', async () => {
      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({ ...validReview, varietyScore: 11 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for non-integer score', async () => {
      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({ ...validReview, varietyScore: 5.5 });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/week/:weekStart', () => {
    it('should return week review', async () => {
      const review = testData.weekReview();
      prismaMock.weekReview.findUnique.mockResolvedValue(review);

      const res = await request(app).get('/api/reviews/week/2024-06-10');

      expect(res.status).toBe(200);
    });

    it('should return 404 when no review exists', async () => {
      prismaMock.weekReview.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/reviews/week/2024-06-10');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/reviews/week/:weekStart', () => {
    it('should create week review', async () => {
      const review = { varietyBalance: 7 };
      prismaMock.weekReview.upsert.mockResolvedValue(testData.weekReview(review));

      const res = await request(app)
        .put('/api/reviews/week/2024-06-10')
        .send(review);

      expect(res.status).toBe(200);
    });

    it('should accept full week review', async () => {
      const review = {
        varietyBalance: 7,
        effortVsSatisfaction: 8,
        highlights: 'Great week!',
        improvements: 'More variety',
        notes: 'Overall good'
      };
      prismaMock.weekReview.upsert.mockResolvedValue(testData.weekReview(review));

      const res = await request(app)
        .put('/api/reviews/week/2024-06-10')
        .send(review);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/reviews/summary', () => {
    it('should return review summary', async () => {
      prismaMock.mealHistory.findMany.mockResolvedValue([]);
      prismaMock.dayReview.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/reviews/summary');

      expect(res.status).toBe(200);
    });
  });
});
