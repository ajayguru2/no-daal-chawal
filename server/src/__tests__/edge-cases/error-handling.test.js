/**
 * Edge case tests for error handling
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock } from '../setup/prisma-mock.js';

describe('Error Handling', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ENDPOINT_NOT_FOUND');
    });

    it('should return 404 for unknown POST endpoints', async () => {
      const res = await request(app)
        .post('/api/nonexistent')
        .send({ data: 'test' });

      expect(res.status).toBe(404);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 with validation details', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ name: '' }); // Invalid - empty name

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
      expect(Array.isArray(res.body.details)).toBe(true);
    });

    it('should return field path in validation error', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ name: 'Test', cuisine: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body.details.some(d => d.field.includes('cuisine'))).toBe(true);
    });

    it('should handle multiple validation errors', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({}); // Missing all required fields

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThan(1);
    });
  });

  describe('Prisma Errors', () => {
    it('should handle duplicate entry errors (P2002)', async () => {
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.userPreferences.upsert.mockRejectedValue(error);

      const res = await request(app)
        .put('/api/preferences/testKey')
        .send({ value: 'test' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('DUPLICATE_ENTRY');
    });

    it('should handle record not found errors (P2025)', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.meal.update.mockRejectedValue(error);

      const res = await request(app)
        .patch('/api/meals/nonexistent')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it('should handle foreign key constraint errors (P2003)', async () => {
      const error = new Error('Foreign key constraint failed');
      error.code = 'P2003';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.mealPlan.create.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/meal-plan')
        .send({ date: '2024-06-15', mealType: 'dinner', mealId: 999 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('FK_CONSTRAINT');
    });
  });

  describe('JSON Parsing Errors', () => {
    it('should handle invalid JSON body', async () => {
      const res = await request(app)
        .post('/api/meals')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(res.status).toBe(400);
    });
  });

  describe('Empty Database Queries', () => {
    it('should return empty array for meals when database is empty', async () => {
      prismaMock.meal.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/meals');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return empty array for inventory when database is empty', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/inventory');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return empty array for shopping when database is empty', async () => {
      prismaMock.shoppingItem.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/shopping');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Boundary Values', () => {
    it('should accept max valid rating (5)', async () => {
      prismaMock.mealHistory.create.mockResolvedValue({ rating: 5 });

      const res = await request(app)
        .post('/api/history')
        .send({
          mealName: 'Test',
          cuisine: 'indian',
          mealType: 'dinner',
          rating: 5
        });

      expect(res.status).toBe(201);
    });

    it('should accept min valid rating (1)', async () => {
      prismaMock.mealHistory.create.mockResolvedValue({ rating: 1 });

      const res = await request(app)
        .post('/api/history')
        .send({
          mealName: 'Test',
          cuisine: 'indian',
          mealType: 'dinner',
          rating: 1
        });

      expect(res.status).toBe(201);
    });

    it('should accept max valid review score (10)', async () => {
      prismaMock.dayReview.upsert.mockResolvedValue({});

      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({
          varietyScore: 10,
          effortScore: 10,
          satisfactionScore: 10
        });

      expect(res.status).toBe(200);
    });

    it('should accept min valid review score (0)', async () => {
      prismaMock.dayReview.upsert.mockResolvedValue({});

      const res = await request(app)
        .put('/api/reviews/day/2024-06-15')
        .send({
          varietyScore: 0,
          effortScore: 0,
          satisfactionScore: 0
        });

      expect(res.status).toBe(200);
    });

    it('should reject rating boundary (0)', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({
          mealName: 'Test',
          cuisine: 'indian',
          mealType: 'dinner',
          rating: 0
        });

      expect(res.status).toBe(400);
    });

    it('should reject rating boundary (6)', async () => {
      const res = await request(app)
        .post('/api/history')
        .send({
          mealName: 'Test',
          cuisine: 'indian',
          mealType: 'dinner',
          rating: 6
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Date Boundaries', () => {
    it('should handle leap year date', async () => {
      prismaMock.dayReview.upsert.mockResolvedValue({});

      const res = await request(app)
        .put('/api/reviews/day/2024-02-29')
        .send({
          varietyScore: 5,
          effortScore: 5,
          satisfactionScore: 5
        });

      expect(res.status).toBe(200);
    });

    it('should handle year boundary', async () => {
      prismaMock.dayReview.upsert.mockResolvedValue({});

      const res = await request(app)
        .put('/api/reviews/day/2024-12-31')
        .send({
          varietyScore: 5,
          effortScore: 5,
          satisfactionScore: 5
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Internal Server Errors', () => {
    it('should handle unexpected errors gracefully', async () => {
      prismaMock.meal.findMany.mockRejectedValue(new Error('Database connection lost'));

      const res = await request(app).get('/api/meals');

      expect(res.status).toBe(500);
    });
  });
});
