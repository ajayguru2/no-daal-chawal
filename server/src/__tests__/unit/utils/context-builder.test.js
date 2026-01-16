/**
 * Unit tests for context builder utilities
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  CONFIG,
  buildCuisinePreferences,
  getRecentMealNames,
  getRecentMeals,
  getYesterdayCuisines,
  getCalorieContext,
  getReviewContext,
  getInventory,
  formatInventoryForPrompt,
  buildFullAIContext,
  processSuggestions
} from '../../../utils/context-builder.js';

describe('Context Builder Utilities', () => {
  // Mock Prisma client
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      mealHistory: {
        findMany: jest.fn().mockResolvedValue([])
      },
      userPreferences: {
        findUnique: jest.fn().mockResolvedValue(null)
      },
      dayReview: {
        findMany: jest.fn().mockResolvedValue([])
      },
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CONFIG constants', () => {
    it('should have correct default values', () => {
      expect(CONFIG.RECENT_MEALS_DAYS).toBe(14);
      expect(CONFIG.REVIEW_CONTEXT_DAYS).toBe(30);
      expect(CONFIG.HIGH_RATING_THRESHOLD).toBe(4);
      expect(CONFIG.LOW_RATING_THRESHOLD).toBe(2);
      expect(CONFIG.DEFAULT_CALORIE_GOAL).toBe(2000);
    });
  });

  describe('buildCuisinePreferences', () => {
    it('should return empty preferences when no rated meals', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      const result = await buildCuisinePreferences(mockPrisma);
      expect(result).toEqual({ preferred: [], avoided: [], all: [] });
    });

    it('should calculate average ratings per cuisine', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { cuisine: 'indian', rating: 5 },
        { cuisine: 'indian', rating: 4 },
        { cuisine: 'chinese', rating: 2 },
        { cuisine: 'chinese', rating: 1 }
      ]);

      const result = await buildCuisinePreferences(mockPrisma);
      expect(result.preferred).toContain('indian');
      expect(result.avoided).toContain('chinese');
      expect(result.all).toHaveLength(2);
    });

    it('should sort all cuisines by average rating', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { cuisine: 'indian', rating: 5 },
        { cuisine: 'chinese', rating: 3 },
        { cuisine: 'italian', rating: 4 }
      ]);

      const result = await buildCuisinePreferences(mockPrisma);
      expect(result.all[0].cuisine).toBe('indian');
      expect(result.all[1].cuisine).toBe('italian');
      expect(result.all[2].cuisine).toBe('chinese');
    });

    it('should use custom days parameter', async () => {
      await buildCuisinePreferences(mockPrisma, 7);
      expect(mockPrisma.mealHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eatenAt: expect.any(Object),
            rating: { not: null }
          })
        })
      );
    });
  });

  describe('getRecentMealNames', () => {
    it('should return empty array when no meals', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      const result = await getRecentMealNames(mockPrisma);
      expect(result).toEqual([]);
    });

    it('should return distinct meal names', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { mealName: 'Butter Chicken' },
        { mealName: 'Palak Paneer' }
      ]);

      const result = await getRecentMealNames(mockPrisma);
      expect(result).toContain('Butter Chicken');
      expect(result).toContain('Palak Paneer');
    });

    it('should use default 14 days lookback', async () => {
      await getRecentMealNames(mockPrisma);
      expect(mockPrisma.mealHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          distinct: ['mealName']
        })
      );
    });
  });

  describe('getRecentMeals', () => {
    it('should return empty array when no meals', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      const result = await getRecentMeals(mockPrisma);
      expect(result).toEqual([]);
    });

    it('should return meals ordered by date', async () => {
      const meals = [
        { id: '1', mealName: 'Meal 1', eatenAt: new Date() },
        { id: '2', mealName: 'Meal 2', eatenAt: new Date() }
      ];
      mockPrisma.mealHistory.findMany.mockResolvedValue(meals);

      const result = await getRecentMeals(mockPrisma);
      expect(result).toEqual(meals);
      expect(mockPrisma.mealHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { eatenAt: 'desc' }
        })
      );
    });
  });

  describe('getYesterdayCuisines', () => {
    it('should return empty array when no meals yesterday', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      const result = await getYesterdayCuisines(mockPrisma);
      expect(result).toEqual([]);
    });

    it('should return unique cuisines', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { cuisine: 'indian' },
        { cuisine: 'indian' },
        { cuisine: 'chinese' }
      ]);

      const result = await getYesterdayCuisines(mockPrisma);
      expect(result).toHaveLength(2);
      expect(result).toContain('indian');
      expect(result).toContain('chinese');
    });
  });

  describe('getCalorieContext', () => {
    it('should return default calorie goal when no preference set', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);

      const result = await getCalorieContext(mockPrisma);
      expect(result.dailyGoal).toBe(CONFIG.DEFAULT_CALORIE_GOAL);
    });

    it('should use stored calorie goal preference', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({ value: '2500' });
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);

      const result = await getCalorieContext(mockPrisma);
      expect(result.dailyGoal).toBe(2500);
    });

    it('should calculate consumed calories from today meals', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { calories: 300 },
        { calories: 500 },
        { calories: 200 }
      ]);

      const result = await getCalorieContext(mockPrisma);
      expect(result.consumed).toBe(1000);
      expect(result.remaining).toBe(1000); // 2000 - 1000
    });

    it('should handle meals with null calories', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { calories: 300 },
        { calories: null },
        { calories: 200 }
      ]);

      const result = await getCalorieContext(mockPrisma);
      expect(result.consumed).toBe(500);
    });

    it('should not return negative remaining calories', async () => {
      mockPrisma.userPreferences.findUnique.mockResolvedValue({ value: '1000' });
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { calories: 800 },
        { calories: 500 }
      ]);

      const result = await getCalorieContext(mockPrisma);
      expect(result.remaining).toBe(0); // Max of 0
    });
  });

  describe('getReviewContext', () => {
    it('should return empty context when no data', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      mockPrisma.dayReview.findMany.mockResolvedValue([]);

      const result = await getReviewContext(mockPrisma);
      expect(result.highRatedMeals).toEqual([]);
      expect(result.lowRatedMeals).toEqual([]);
      expect(result.recentDayReviews).toEqual([]);
    });

    it('should separate high and low rated meals', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([
        { mealName: 'Great', rating: 5 },
        { mealName: 'Good', rating: 4 },
        { mealName: 'Bad', rating: 1 },
        { mealName: 'OK', rating: 3 }
      ]);

      const result = await getReviewContext(mockPrisma);
      expect(result.highRatedMeals.map(m => m.mealName)).toContain('Great');
      expect(result.highRatedMeals.map(m => m.mealName)).toContain('Good');
      expect(result.lowRatedMeals.map(m => m.mealName)).toContain('Bad');
    });
  });

  describe('getInventory', () => {
    it('should return empty array when no inventory', async () => {
      mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
      const result = await getInventory(mockPrisma);
      expect(result).toEqual([]);
    });

    it('should return inventory items with select fields', async () => {
      const items = [
        { name: 'Rice', quantity: 5, unit: 'kg' },
        { name: 'Salt', quantity: 1, unit: 'kg' }
      ];
      mockPrisma.inventoryItem.findMany.mockResolvedValue(items);

      const result = await getInventory(mockPrisma);
      expect(result).toEqual(items);
      expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith({
        select: { name: true, quantity: true, unit: true }
      });
    });
  });

  describe('formatInventoryForPrompt', () => {
    it('should return message when inventory is empty', () => {
      expect(formatInventoryForPrompt([])).toBe('No inventory information available');
      expect(formatInventoryForPrompt(null)).toBe('No inventory information available');
      expect(formatInventoryForPrompt(undefined)).toBe('No inventory information available');
    });

    it('should format inventory with quantity and unit', () => {
      const inventory = [
        { name: 'Rice', quantity: 5, unit: 'kg' },
        { name: 'Salt', quantity: 1, unit: 'kg' }
      ];
      const result = formatInventoryForPrompt(inventory);
      expect(result).toBe('Rice (5 kg), Salt (1 kg)');
    });

    it('should handle items without quantity', () => {
      const inventory = [
        { name: 'Rice', quantity: null, unit: null }
      ];
      const result = formatInventoryForPrompt(inventory);
      expect(result).toBe('Rice');
    });

    it('should handle items without unit', () => {
      const inventory = [
        { name: 'Eggs', quantity: 12, unit: null }
      ];
      const result = formatInventoryForPrompt(inventory);
      expect(result).toBe('Eggs (12)');
    });
  });

  describe('processSuggestions', () => {
    it('should sort suggestions by calories', () => {
      const suggestions = [
        { name: 'High Cal', estimatedCalories: 800 },
        { name: 'Low Cal', estimatedCalories: 200 },
        { name: 'Med Cal', estimatedCalories: 500 }
      ];

      const result = processSuggestions(suggestions, 1000);
      expect(result[0].name).toBe('Low Cal');
      expect(result[1].name).toBe('Med Cal');
      expect(result[2].name).toBe('High Cal');
    });

    it('should add calorie warning when exceeds budget', () => {
      const suggestions = [
        { name: 'Under Budget', estimatedCalories: 300 },
        { name: 'Over Budget', estimatedCalories: 600 }
      ];

      const result = processSuggestions(suggestions, 500);
      expect(result[0].calorieWarning).toBeNull();
      expect(result[1].calorieWarning).toContain('Exceeds remaining 500 kcal');
    });

    it('should handle suggestions without calories', () => {
      const suggestions = [
        { name: 'No Cal Info' }
      ];

      const result = processSuggestions(suggestions, 500);
      expect(result[0].calorieWarning).toBeNull();
    });

    it('should preserve all suggestion properties', () => {
      const suggestions = [
        { name: 'Test', estimatedCalories: 300, cuisine: 'indian', prepTime: 30 }
      ];

      const result = processSuggestions(suggestions, 500);
      expect(result[0].cuisine).toBe('indian');
      expect(result[0].prepTime).toBe(30);
    });
  });

  describe('buildFullAIContext', () => {
    it('should combine all context sources', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.dayReview.findMany.mockResolvedValue([]);
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { name: 'Rice', quantity: 5, unit: 'kg' }
      ]);

      const result = await buildFullAIContext(mockPrisma);

      expect(result).toHaveProperty('inventory');
      expect(result).toHaveProperty('inventoryFormatted');
      expect(result).toHaveProperty('recentMeals');
      expect(result).toHaveProperty('recentMealNames');
      expect(result).toHaveProperty('yesterdayCuisines');
      expect(result).toHaveProperty('calorieContext');
      expect(result).toHaveProperty('reviewContext');
    });

    it('should format inventory correctly', async () => {
      mockPrisma.mealHistory.findMany.mockResolvedValue([]);
      mockPrisma.userPreferences.findUnique.mockResolvedValue(null);
      mockPrisma.dayReview.findMany.mockResolvedValue([]);
      mockPrisma.inventoryItem.findMany.mockResolvedValue([
        { name: 'Rice', quantity: 5, unit: 'kg' }
      ]);

      const result = await buildFullAIContext(mockPrisma);
      expect(result.inventoryFormatted).toBe('Rice (5 kg)');
    });
  });
});
