/**
 * Integration tests for Inventory API
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createTestApp } from '../setup/test-app.js';
import { createPrismaMock, testData } from '../setup/prisma-mock.js';

describe('Inventory API', () => {
  let app;
  let prismaMock;

  beforeEach(() => {
    prismaMock = createPrismaMock();
    app = createTestApp(prismaMock);
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      const items = [
        testData.inventoryItem({ id: '1', name: 'Rice' }),
        testData.inventoryItem({ id: '2', name: 'Salt' })
      ];
      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const res = await request(app).get('/api/inventory');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Rice');
    });

    it('should return empty array when no items', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/inventory');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should order items by category', async () => {
      prismaMock.inventoryItem.findMany.mockResolvedValue([]);

      await request(app).get('/api/inventory');

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        orderBy: { category: 'asc' }
      });
    });
  });

  describe('GET /api/inventory/low-stock', () => {
    it('should return items below low stock threshold', async () => {
      const items = [
        testData.inventoryItem({ name: 'Rice', quantity: 1, lowStockAt: 5 }),
        testData.inventoryItem({ name: 'Salt', quantity: 10, lowStockAt: 2 })
      ];
      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const res = await request(app).get('/api/inventory/low-stock');

      expect(res.status).toBe(200);
      // Only Rice should be low stock (1 <= 5)
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Rice');
    });

    it('should return empty when no low stock items', async () => {
      const items = [
        testData.inventoryItem({ name: 'Rice', quantity: 10, lowStockAt: 5 })
      ];
      prismaMock.inventoryItem.findMany.mockResolvedValue(items);

      const res = await request(app).get('/api/inventory/low-stock');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should only check items with lowStockAt set', async () => {
      await request(app).get('/api/inventory/low-stock');

      expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith({
        where: { lowStockAt: { not: null } }
      });
    });
  });

  describe('POST /api/inventory', () => {
    const validItem = {
      name: 'Rice',
      quantity: 5
    };

    it('should create a new inventory item', async () => {
      const createdItem = testData.inventoryItem(validItem);
      prismaMock.inventoryItem.create.mockResolvedValue(createdItem);

      const res = await request(app)
        .post('/api/inventory')
        .send(validItem);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Rice');
    });

    it('should create item with all optional fields', async () => {
      const fullItem = {
        name: 'Rice',
        category: 'grains',
        quantity: 5,
        unit: 'kg',
        lowStockAt: 1,
        expiresAt: '2024-12-31T00:00:00.000Z'
      };
      prismaMock.inventoryItem.create.mockResolvedValue(testData.inventoryItem(fullItem));

      const res = await request(app)
        .post('/api/inventory')
        .send(fullItem);

      expect(res.status).toBe(201);
      expect(prismaMock.inventoryItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Rice',
          category: 'grains',
          unit: 'kg',
          lowStockAt: 1
        })
      });
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .send({ quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing quantity', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .send({ name: 'Rice' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for negative quantity', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .send({ name: 'Rice', quantity: -5 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for zero quantity', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .send({ name: 'Rice', quantity: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid category', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .send({ name: 'Rice', quantity: 5, category: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should accept float quantity', async () => {
      prismaMock.inventoryItem.create.mockResolvedValue(
        testData.inventoryItem({ quantity: 2.5 })
      );

      const res = await request(app)
        .post('/api/inventory')
        .send({ name: 'Rice', quantity: 2.5 });

      expect(res.status).toBe(201);
    });
  });

  describe('PATCH /api/inventory/:id', () => {
    it('should update item quantity', async () => {
      const updatedItem = testData.inventoryItem({ quantity: 10 });
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/api/inventory/item-123')
        .send({ quantity: 10 });

      expect(res.status).toBe(200);
      expect(prismaMock.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: expect.objectContaining({ quantity: 10 })
      });
    });

    it('should update item name', async () => {
      const updatedItem = testData.inventoryItem({ name: 'Basmati Rice' });
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/api/inventory/item-123')
        .send({ name: 'Basmati Rice' });

      expect(res.status).toBe(200);
    });

    it('should update multiple fields', async () => {
      const updatedItem = testData.inventoryItem({
        name: 'Basmati Rice',
        quantity: 10,
        unit: 'kg'
      });
      prismaMock.inventoryItem.update.mockResolvedValue(updatedItem);

      const res = await request(app)
        .patch('/api/inventory/item-123')
        .send({ name: 'Basmati Rice', quantity: 10, unit: 'kg' });

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent item', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.inventoryItem.update.mockRejectedValue(error);

      const res = await request(app)
        .patch('/api/inventory/non-existent')
        .send({ quantity: 10 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/inventory/:id', () => {
    it('should delete an inventory item', async () => {
      prismaMock.inventoryItem.delete.mockResolvedValue({});

      const res = await request(app).delete('/api/inventory/item-123');

      expect(res.status).toBe(204);
      expect(prismaMock.inventoryItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-123' }
      });
    });

    it('should return 404 for non-existent item', async () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      error.name = 'PrismaClientKnownRequestError';
      prismaMock.inventoryItem.delete.mockRejectedValue(error);

      const res = await request(app).delete('/api/inventory/non-existent');

      expect(res.status).toBe(404);
    });
  });
});
