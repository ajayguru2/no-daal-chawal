/**
 * Integration tests for Shopping API
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('Shopping API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/shopping', () => {
    it('should return shopping list', async () => {
      const items = [
        testData.shoppingItem({ id: '1', name: 'Tomatoes' }),
        testData.shoppingItem({ id: '2', name: 'Onions' })
      ];
      prismaMock.shoppingItem.findMany.mockResolvedValue(items);

      const res = await request(app).get('/api/shopping');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should return empty array when no items', async () => {
      prismaMock.shoppingItem.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/shopping');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/shopping', () => {
    it('should add shopping item', async () => {
      const item = { name: 'Tomatoes' };
      prismaMock.shoppingItem.create.mockResolvedValue(testData.shoppingItem(item));

      const res = await request(app)
        .post('/api/shopping')
        .send(item);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Tomatoes');
    });

    it('should add item with quantity and unit', async () => {
      const item = { name: 'Tomatoes', quantity: 2, unit: 'kg' };
      prismaMock.shoppingItem.create.mockResolvedValue(testData.shoppingItem(item));

      const res = await request(app)
        .post('/api/shopping')
        .send(item);

      expect(res.status).toBe(201);
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/shopping')
        .send({ quantity: 2 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/shopping')
        .send({ name: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/shopping/:id', () => {
    it('should mark item as purchased', async () => {
      const updated = testData.shoppingItem({ isPurchased: true });
      prismaMock.shoppingItem.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/shopping/item-123')
        .send({ isPurchased: true });

      expect(res.status).toBe(200);
      expect(prismaMock.shoppingItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: expect.objectContaining({ isPurchased: true })
      });
    });

    it('should update quantity', async () => {
      const updated = testData.shoppingItem({ quantity: 5 });
      prismaMock.shoppingItem.update.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/shopping/item-123')
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent item', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.shoppingItem.update.mockRejectedValue(error);

      const res = await request(app)
        .patch('/api/shopping/non-existent')
        .send({ isPurchased: true });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/shopping/:id', () => {
    it('should delete shopping item', async () => {
      prismaMock.shoppingItem.delete.mockResolvedValue({});

      const res = await request(app).delete('/api/shopping/item-123');

      expect(res.status).toBe(204);
    });

    it('should return 404 for non-existent item', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.shoppingItem.delete.mockRejectedValue(error);

      const res = await request(app).delete('/api/shopping/non-existent');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/shopping/clear/purchased', () => {
    it('should clear all purchased items', async () => {
      prismaMock.shoppingItem.deleteMany.mockResolvedValue({ count: 5 });

      const res = await request(app).delete('/api/shopping/clear/purchased');

      expect(res.status).toBe(204);
      expect(prismaMock.shoppingItem.deleteMany).toHaveBeenCalledWith({
        where: { isPurchased: true }
      });
    });
  });
});
