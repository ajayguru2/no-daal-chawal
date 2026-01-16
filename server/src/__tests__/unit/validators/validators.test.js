/**
 * Unit tests for Zod validators
 */
import { describe, it, expect, jest } from '@jest/globals';
import {
  MealTypeEnum,
  CuisineEnum,
  InventoryCategoryEnum,
  mealSchema,
  mealUpdateSchema,
  mealPlanSchema,
  mealPlanQuerySchema,
  inventorySchema,
  inventoryUpdateSchema,
  historySchema,
  historyUpdateSchema,
  calendarQuerySchema,
  dayReviewSchema,
  weekReviewSchema,
  shoppingItemSchema,
  shoppingUpdateSchema,
  generateRecipeSchema,
  preferenceSchema,
  authSchema,
  dateParamSchema,
  idParamSchema,
  suggestSchema,
  chatSuggestSchema,
  validate,
  validateAll
} from '../../../validators/index.js';

describe('Validators', () => {
  describe('Enums', () => {
    describe('MealTypeEnum', () => {
      it('should accept valid meal types', () => {
        expect(MealTypeEnum.parse('breakfast')).toBe('breakfast');
        expect(MealTypeEnum.parse('lunch')).toBe('lunch');
        expect(MealTypeEnum.parse('dinner')).toBe('dinner');
        expect(MealTypeEnum.parse('snack')).toBe('snack');
      });

      it('should reject invalid meal types', () => {
        expect(() => MealTypeEnum.parse('brunch')).toThrow();
        expect(() => MealTypeEnum.parse('')).toThrow();
        expect(() => MealTypeEnum.parse(null)).toThrow();
      });
    });

    describe('CuisineEnum', () => {
      it('should accept valid cuisines', () => {
        const validCuisines = ['indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american', 'mediterranean', 'korean', 'other'];
        validCuisines.forEach(cuisine => {
          expect(CuisineEnum.parse(cuisine)).toBe(cuisine);
        });
      });

      it('should reject invalid cuisines', () => {
        expect(() => CuisineEnum.parse('french')).toThrow();
        expect(() => CuisineEnum.parse('German')).toThrow(); // Case sensitive
      });
    });

    describe('InventoryCategoryEnum', () => {
      it('should accept valid categories', () => {
        const validCategories = ['grains', 'spices', 'vegetables', 'dairy', 'proteins', 'fruits', 'others'];
        validCategories.forEach(category => {
          expect(InventoryCategoryEnum.parse(category)).toBe(category);
        });
      });

      it('should reject invalid categories', () => {
        expect(() => InventoryCategoryEnum.parse('beverages')).toThrow();
      });
    });
  });

  describe('mealSchema', () => {
    const validMeal = {
      name: 'Butter Chicken',
      cuisine: 'indian',
      mealType: 'dinner'
    };

    it('should accept valid meal data', () => {
      const result = mealSchema.parse(validMeal);
      expect(result.name).toBe('Butter Chicken');
    });

    it('should accept full meal with all optional fields', () => {
      const fullMeal = {
        ...validMeal,
        prepTime: 45,
        ingredients: ['chicken', 'butter', 'tomato'],
        recipe: 'Cook chicken in butter sauce',
        isCustom: true
      };
      const result = mealSchema.parse(fullMeal);
      expect(result.prepTime).toBe(45);
    });

    it('should reject empty name', () => {
      expect(() => mealSchema.parse({ ...validMeal, name: '' })).toThrow();
    });

    it('should reject name exceeding max length', () => {
      expect(() => mealSchema.parse({ ...validMeal, name: 'a'.repeat(201) })).toThrow();
    });

    it('should reject invalid cuisine', () => {
      expect(() => mealSchema.parse({ ...validMeal, cuisine: 'french' })).toThrow();
    });

    it('should reject invalid mealType', () => {
      expect(() => mealSchema.parse({ ...validMeal, mealType: 'brunch' })).toThrow();
    });

    it('should reject negative prepTime', () => {
      expect(() => mealSchema.parse({ ...validMeal, prepTime: -10 })).toThrow();
    });

    it('should reject prepTime exceeding 480 minutes', () => {
      expect(() => mealSchema.parse({ ...validMeal, prepTime: 500 })).toThrow();
    });

    it('should reject non-integer prepTime', () => {
      expect(() => mealSchema.parse({ ...validMeal, prepTime: 30.5 })).toThrow();
    });
  });

  describe('mealUpdateSchema', () => {
    it('should accept partial updates', () => {
      const result = mealUpdateSchema.parse({ name: 'New Name' });
      expect(result.name).toBe('New Name');
    });

    it('should accept empty update', () => {
      const result = mealUpdateSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('mealPlanSchema', () => {
    it('should accept valid meal plan', () => {
      const result = mealPlanSchema.parse({
        date: '2024-06-15',
        mealType: 'dinner'
      });
      expect(result.date).toBe('2024-06-15');
    });

    it('should accept with optional mealId', () => {
      const result = mealPlanSchema.parse({
        date: '2024-06-15',
        mealType: 'dinner',
        mealId: 123
      });
      expect(result.mealId).toBe(123);
    });

    it('should reject invalid date format', () => {
      expect(() => mealPlanSchema.parse({ date: '06/15/2024', mealType: 'dinner' })).toThrow();
      expect(() => mealPlanSchema.parse({ date: '2024-6-15', mealType: 'dinner' })).toThrow();
    });
  });

  describe('mealPlanQuerySchema', () => {
    it('should accept week query', () => {
      const result = mealPlanQuerySchema.parse({ week: '2024-06-10' });
      expect(result.week).toBe('2024-06-10');
    });

    it('should accept year and month query', () => {
      const result = mealPlanQuerySchema.parse({ year: '2024', month: '6' });
      expect(result.year).toBe(2024);
      expect(result.month).toBe(6);
    });

    it('should coerce string numbers', () => {
      const result = mealPlanQuerySchema.parse({ year: '2024', month: '12' });
      expect(typeof result.year).toBe('number');
      expect(typeof result.month).toBe('number');
    });

    it('should reject invalid month', () => {
      expect(() => mealPlanQuerySchema.parse({ month: '13' })).toThrow();
      expect(() => mealPlanQuerySchema.parse({ month: '0' })).toThrow();
    });

    it('should reject year out of range', () => {
      expect(() => mealPlanQuerySchema.parse({ year: '1999' })).toThrow();
      expect(() => mealPlanQuerySchema.parse({ year: '2101' })).toThrow();
    });
  });

  describe('inventorySchema', () => {
    const validItem = {
      name: 'Rice',
      quantity: 5
    };

    it('should accept valid inventory item', () => {
      const result = inventorySchema.parse(validItem);
      expect(result.name).toBe('Rice');
    });

    it('should accept with optional fields', () => {
      const result = inventorySchema.parse({
        ...validItem,
        category: 'grains',
        unit: 'kg',
        lowStockAt: 1
      });
      expect(result.category).toBe('grains');
    });

    it('should reject empty name', () => {
      expect(() => inventorySchema.parse({ ...validItem, name: '' })).toThrow();
    });

    it('should reject zero quantity', () => {
      expect(() => inventorySchema.parse({ ...validItem, quantity: 0 })).toThrow();
    });

    it('should reject negative quantity', () => {
      expect(() => inventorySchema.parse({ ...validItem, quantity: -5 })).toThrow();
    });

    it('should reject quantity over 10000', () => {
      expect(() => inventorySchema.parse({ ...validItem, quantity: 10001 })).toThrow();
    });

    it('should accept float quantity', () => {
      const result = inventorySchema.parse({ ...validItem, quantity: 2.5 });
      expect(result.quantity).toBe(2.5);
    });
  });

  describe('historySchema', () => {
    const validHistory = {
      mealName: 'Test Meal',
      cuisine: 'indian',
      mealType: 'lunch'
    };

    it('should accept valid history entry', () => {
      const result = historySchema.parse(validHistory);
      expect(result.mealName).toBe('Test Meal');
    });

    it('should accept with optional rating', () => {
      const result = historySchema.parse({ ...validHistory, rating: 5 });
      expect(result.rating).toBe(5);
    });

    it('should reject rating below 1', () => {
      expect(() => historySchema.parse({ ...validHistory, rating: 0 })).toThrow();
    });

    it('should reject rating above 5', () => {
      expect(() => historySchema.parse({ ...validHistory, rating: 6 })).toThrow();
    });

    it('should reject non-integer rating', () => {
      expect(() => historySchema.parse({ ...validHistory, rating: 3.5 })).toThrow();
    });

    it('should accept calories', () => {
      const result = historySchema.parse({ ...validHistory, calories: 500 });
      expect(result.calories).toBe(500);
    });

    it('should reject calories over 5000', () => {
      expect(() => historySchema.parse({ ...validHistory, calories: 5001 })).toThrow();
    });
  });

  describe('historyUpdateSchema', () => {
    it('should accept rating update', () => {
      const result = historyUpdateSchema.parse({ rating: 4 });
      expect(result.rating).toBe(4);
    });

    it('should accept notes update', () => {
      const result = historyUpdateSchema.parse({ notes: 'Great meal!' });
      expect(result.notes).toBe('Great meal!');
    });

    it('should reject invalid rating in update', () => {
      expect(() => historyUpdateSchema.parse({ rating: 10 })).toThrow();
    });
  });

  describe('dayReviewSchema', () => {
    it('should accept valid day review', () => {
      const result = dayReviewSchema.parse({
        varietyScore: 7,
        effortScore: 5,
        satisfactionScore: 8
      });
      expect(result.varietyScore).toBe(7);
    });

    it('should reject scores below 0', () => {
      expect(() => dayReviewSchema.parse({
        varietyScore: -1,
        effortScore: 5,
        satisfactionScore: 5
      })).toThrow();
    });

    it('should reject scores above 10', () => {
      expect(() => dayReviewSchema.parse({
        varietyScore: 11,
        effortScore: 5,
        satisfactionScore: 5
      })).toThrow();
    });

    it('should require integer scores', () => {
      expect(() => dayReviewSchema.parse({
        varietyScore: 5.5,
        effortScore: 5,
        satisfactionScore: 5
      })).toThrow();
    });
  });

  describe('weekReviewSchema', () => {
    it('should accept partial week review', () => {
      const result = weekReviewSchema.parse({ varietyBalance: 7 });
      expect(result.varietyBalance).toBe(7);
    });

    it('should accept full week review', () => {
      const result = weekReviewSchema.parse({
        varietyBalance: 7,
        effortVsSatisfaction: 8,
        highlights: 'Great Indian week!',
        improvements: 'Try more cuisines',
        notes: 'Overall good'
      });
      expect(result.highlights).toBe('Great Indian week!');
    });
  });

  describe('shoppingItemSchema', () => {
    it('should accept valid shopping item', () => {
      const result = shoppingItemSchema.parse({ name: 'Tomatoes' });
      expect(result.name).toBe('Tomatoes');
    });

    it('should accept with quantity and unit', () => {
      const result = shoppingItemSchema.parse({
        name: 'Tomatoes',
        quantity: 2,
        unit: 'kg'
      });
      expect(result.quantity).toBe(2);
    });

    it('should reject empty name', () => {
      expect(() => shoppingItemSchema.parse({ name: '' })).toThrow();
    });
  });

  describe('shoppingUpdateSchema', () => {
    it('should accept isPurchased update', () => {
      const result = shoppingUpdateSchema.parse({ isPurchased: true });
      expect(result.isPurchased).toBe(true);
    });

    it('should accept quantity update', () => {
      const result = shoppingUpdateSchema.parse({ quantity: 5 });
      expect(result.quantity).toBe(5);
    });
  });

  describe('generateRecipeSchema', () => {
    it('should accept valid recipe request', () => {
      const result = generateRecipeSchema.parse({
        meal: { name: 'Butter Chicken' }
      });
      expect(result.meal.name).toBe('Butter Chicken');
    });

    it('should accept with optional fields', () => {
      const result = generateRecipeSchema.parse({
        meal: {
          name: 'Butter Chicken',
          cuisine: 'indian',
          prepTime: 45,
          estimatedCalories: 500
        }
      });
      expect(result.meal.cuisine).toBe('indian');
    });
  });

  describe('preferenceSchema', () => {
    it('should accept valid preference', () => {
      const result = preferenceSchema.parse({ value: '2000' });
      expect(result.value).toBe('2000');
    });

    it('should reject value exceeding max length', () => {
      expect(() => preferenceSchema.parse({ value: 'a'.repeat(1001) })).toThrow();
    });
  });

  describe('authSchema', () => {
    it('should accept valid PIN', () => {
      const result = authSchema.parse({ pin: '1234' });
      expect(result.pin).toBe('1234');
    });

    it('should reject PIN shorter than 4 chars', () => {
      expect(() => authSchema.parse({ pin: '123' })).toThrow();
    });

    it('should reject PIN longer than 10 chars', () => {
      expect(() => authSchema.parse({ pin: '12345678901' })).toThrow();
    });
  });

  describe('dateParamSchema', () => {
    it('should accept valid date format', () => {
      const result = dateParamSchema.parse('2024-06-15');
      expect(result).toBe('2024-06-15');
    });

    it('should reject invalid format', () => {
      expect(() => dateParamSchema.parse('06/15/2024')).toThrow();
      expect(() => dateParamSchema.parse('2024-6-15')).toThrow();
    });
  });

  describe('idParamSchema', () => {
    it('should coerce string to number', () => {
      const result = idParamSchema.parse('123');
      expect(result).toBe(123);
    });

    it('should accept positive integer', () => {
      const result = idParamSchema.parse(456);
      expect(result).toBe(456);
    });

    it('should reject zero', () => {
      expect(() => idParamSchema.parse(0)).toThrow();
    });

    it('should reject negative', () => {
      expect(() => idParamSchema.parse(-1)).toThrow();
    });
  });

  describe('suggestSchema', () => {
    it('should accept empty request', () => {
      const result = suggestSchema.parse({});
      expect(result).toEqual({});
    });

    it('should accept full request', () => {
      const result = suggestSchema.parse({
        mood: 'hungry',
        timeAvailable: '30',
        cuisine: 'indian',
        mealType: 'dinner',
        rejectedMeals: [{ name: 'Dal', reason: 'Too boring' }]
      });
      expect(result.mood).toBe('hungry');
    });

    it('should reject mood exceeding 50 chars', () => {
      expect(() => suggestSchema.parse({ mood: 'a'.repeat(51) })).toThrow();
    });

    it('should limit rejected meals to 20', () => {
      const rejected = Array(21).fill({ name: 'Test' });
      expect(() => suggestSchema.parse({ rejectedMeals: rejected })).toThrow();
    });
  });

  describe('chatSuggestSchema', () => {
    it('should accept valid conversation', () => {
      const result = chatSuggestSchema.parse({
        conversation: [
          { role: 'user', content: 'I want Indian food' }
        ]
      });
      expect(result.conversation).toHaveLength(1);
    });

    it('should accept with mealType', () => {
      const result = chatSuggestSchema.parse({
        mealType: 'dinner',
        conversation: [
          { role: 'user', content: 'suggestions please' }
        ]
      });
      expect(result.mealType).toBe('dinner');
    });

    it('should reject invalid role', () => {
      expect(() => chatSuggestSchema.parse({
        conversation: [{ role: 'system', content: 'test' }]
      })).toThrow();
    });

    it('should limit conversation to 50 messages', () => {
      const conversation = Array(51).fill({ role: 'user', content: 'test' });
      expect(() => chatSuggestSchema.parse({ conversation })).toThrow();
    });
  });

  describe('validate middleware', () => {
    it('should validate body by default', () => {
      const middleware = validate(mealSchema);
      const req = {
        body: { name: 'Test', cuisine: 'indian', mealType: 'dinner' },
        validated: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.validated.body).toBeDefined();
    });

    it('should return 400 on validation failure', () => {
      const middleware = validate(mealSchema);
      const req = { body: { name: '' }, validated: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate query when specified', () => {
      const middleware = validate(mealPlanQuerySchema, 'query');
      const req = { query: { year: '2024', month: '6' }, validated: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.validated.query.year).toBe(2024);
    });
  });

  describe('validateAll middleware', () => {
    it('should validate multiple sources', () => {
      const middleware = validateAll({
        body: mealSchema,
        query: mealPlanQuerySchema
      });
      const req = {
        body: { name: 'Test', cuisine: 'indian', mealType: 'dinner' },
        query: { year: '2024' },
        validated: {}
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.validated.body).toBeDefined();
      expect(req.validated.query).toBeDefined();
    });
  });
});
