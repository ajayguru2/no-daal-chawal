/**
 * Prisma client mock factory
 * Creates mock implementations for all Prisma models
 */
import { jest } from '@jest/globals';

/**
 * Creates a mock Prisma client with all models and methods
 * Each call returns a fresh mock with reset state
 */
export function createPrismaMock() {
  const createModelMock = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-id', ...data, createdAt: new Date(), updatedAt: new Date() })),
    update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-id', ...data, updatedAt: new Date() })),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'mock-id', ...create })),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({})
  });

  return {
    inventoryItem: createModelMock(),
    meal: createModelMock(),
    mealPlan: createModelMock(),
    mealHistory: createModelMock(),
    recipe: createModelMock(),
    shoppingItem: createModelMock(),
    dayReview: createModelMock(),
    weekReview: createModelMock(),
    userPreferences: createModelMock(),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockImplementation(fn => fn())
  };
}

/**
 * Sample test data factories
 */
export const testData = {
  meal: (overrides = {}) => ({
    id: 'meal-1',
    name: 'Test Meal',
    cuisine: 'indian',
    mealType: 'dinner',
    prepTime: 30,
    ingredients: JSON.stringify(['ingredient1', 'ingredient2']),
    recipe: 'Test recipe instructions',
    isCustom: true,
    createdAt: new Date(),
    ...overrides
  }),

  inventoryItem: (overrides = {}) => ({
    id: 'inv-1',
    name: 'Test Item',
    category: 'vegetables',
    quantity: 10,
    unit: 'kg',
    lowStockAt: 2,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  mealHistory: (overrides = {}) => ({
    id: 'history-1',
    mealName: 'Test Meal',
    cuisine: 'indian',
    mealType: 'lunch',
    eatenAt: new Date(),
    rating: 4,
    notes: 'Test notes',
    calories: 500,
    recipeId: null,
    ...overrides
  }),

  mealPlan: (overrides = {}) => ({
    id: 'plan-1',
    date: new Date(),
    mealType: 'dinner',
    mealId: null,
    notes: 'Test plan',
    completed: false,
    completedAt: null,
    ...overrides
  }),

  recipe: (overrides = {}) => ({
    id: 'recipe-1',
    mealName: 'Test Recipe',
    cuisine: 'indian',
    prepTime: 15,
    cookTime: 30,
    servings: 2,
    ingredients: JSON.stringify([{ item: 'Test', quantity: '100', unit: 'g' }]),
    instructions: JSON.stringify([{ step: 1, text: 'Step 1' }]),
    tips: 'Test tips',
    description: 'Test description',
    calories: 400,
    createdAt: new Date(),
    ...overrides
  }),

  shoppingItem: (overrides = {}) => ({
    id: 'shop-1',
    name: 'Test Shopping Item',
    quantity: 2,
    unit: 'kg',
    category: 'vegetables',
    isPurchased: false,
    createdAt: new Date(),
    ...overrides
  }),

  dayReview: (overrides = {}) => ({
    id: 'day-review-1',
    date: new Date(),
    varietyScore: 7,
    effortScore: 5,
    satisfactionScore: 8,
    notes: 'Good day',
    createdAt: new Date(),
    ...overrides
  }),

  weekReview: (overrides = {}) => ({
    id: 'week-review-1',
    weekStart: new Date(),
    varietyBalance: 7,
    effortVsSatisfaction: 8,
    highlights: 'Great week',
    improvements: 'More variety',
    notes: 'Good week overall',
    createdAt: new Date(),
    ...overrides
  }),

  userPreference: (overrides = {}) => ({
    id: 'pref-1',
    key: 'dailyCalorieGoal',
    value: '2000',
    updatedAt: new Date(),
    ...overrides
  })
};
