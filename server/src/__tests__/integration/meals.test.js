/**
 * Integration tests for Meals API
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('Meals API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/meals', () => {
    it('should return all meals', async () => {
      const meals = [
        testData.meal({ id: '1', name: 'Meal 1' }),
        testData.meal({ id: '2', name: 'Meal 2' })
      ];
      prismaMock.meal.findMany.mockResolvedValue(meals);

      const res = await request(app).get('/api/meals');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Meal 1');
    });

    it('should return empty array when no meals', async () => {
      prismaMock.meal.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/meals');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should filter by cuisine', async () => {
      const indianMeals = [testData.meal({ cuisine: 'indian' })];
      prismaMock.meal.findMany.mockResolvedValue(indianMeals);

      const res = await request(app).get('/api/meals?cuisine=indian');

      expect(res.status).toBe(200);
      expect(prismaMock.meal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cuisine: 'indian' })
        })
      );
    });

    it('should filter by mealType', async () => {
      const dinnerMeals = [testData.meal({ mealType: 'dinner' })];
      prismaMock.meal.findMany.mockResolvedValue(dinnerMeals);

      const res = await request(app).get('/api/meals?mealType=dinner');

      expect(res.status).toBe(200);
      expect(prismaMock.meal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mealType: 'dinner' })
        })
      );
    });

    it('should filter by both cuisine and mealType', async () => {
      prismaMock.meal.findMany.mockResolvedValue([]);

      await request(app).get('/api/meals?cuisine=indian&mealType=dinner');

      expect(prismaMock.meal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cuisine: 'indian',
            mealType: 'dinner'
          })
        })
      );
    });
  });

  describe('GET /api/meals/:id', () => {
    it('should return a single meal', async () => {
      const meal = testData.meal({ id: 'meal-123' });
      prismaMock.meal.findUnique.mockResolvedValue(meal);

      const res = await request(app).get('/api/meals/meal-123');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('meal-123');
    });

    it('should return 404 for non-existent meal', async () => {
      prismaMock.meal.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/meals/non-existent');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/meals', () => {
    const validMeal = {
      name: 'Butter Chicken',
      cuisine: 'indian',
      mealType: 'dinner'
    };

    it('should create a new meal', async () => {
      const createdMeal = testData.meal({ ...validMeal, id: 'new-id' });
      prismaMock.meal.create.mockResolvedValue(createdMeal);

      const res = await request(app)
        .post('/api/meals')
        .send(validMeal);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Butter Chicken');
      expect(prismaMock.meal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Butter Chicken',
          cuisine: 'indian',
          mealType: 'dinner',
          isCustom: true
        })
      });
    });

    it('should create meal with all optional fields', async () => {
      const fullMeal = {
        ...validMeal,
        prepTime: 45,
        ingredients: ['chicken', 'butter', 'tomato'],
        recipe: 'Cook the chicken in butter sauce'
      };
      prismaMock.meal.create.mockResolvedValue(testData.meal(fullMeal));

      const res = await request(app)
        .post('/api/meals')
        .send(fullMeal);

      expect(res.status).toBe(201);
      expect(prismaMock.meal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prepTime: 45,
          ingredients: JSON.stringify(['chicken', 'butter', 'tomato']),
          recipe: 'Cook the chicken in butter sauce'
        })
      });
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ name: 'Test' }); // Missing cuisine and mealType

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid cuisine', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ ...validMeal, cuisine: 'french' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid mealType', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ ...validMeal, mealType: 'brunch' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/meals')
        .send({ ...validMeal, name: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/meals/:id', () => {
    it('should update meal name', async () => {
      const updatedMeal = testData.meal({ name: 'New Name' });
      prismaMock.meal.update.mockResolvedValue(updatedMeal);

      const res = await request(app)
        .patch('/api/meals/meal-123')
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(prismaMock.meal.update).toHaveBeenCalledWith({
        where: { id: 'meal-123' },
        data: expect.objectContaining({ name: 'New Name' })
      });
    });

    it('should update multiple fields', async () => {
      const updatedMeal = testData.meal({ name: 'New Name', prepTime: 60 });
      prismaMock.meal.update.mockResolvedValue(updatedMeal);

      const res = await request(app)
        .patch('/api/meals/meal-123')
        .send({ name: 'New Name', prepTime: 60 });

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent meal', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.meal.update.mockRejectedValue(error);

      const res = await request(app)
        .patch('/api/meals/non-existent')
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid update data', async () => {
      const res = await request(app)
        .patch('/api/meals/meal-123')
        .send({ cuisine: 'invalid-cuisine' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/meals/:id', () => {
    it('should delete a meal', async () => {
      prismaMock.meal.delete.mockResolvedValue({});

      const res = await request(app).delete('/api/meals/meal-123');

      expect(res.status).toBe(204);
      expect(prismaMock.meal.delete).toHaveBeenCalledWith({
        where: { id: 'meal-123' }
      });
    });

    it('should return 404 for non-existent meal', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.meal.delete.mockRejectedValue(error);

      const res = await request(app).delete('/api/meals/non-existent');

      expect(res.status).toBe(404);
    });
  });
});
