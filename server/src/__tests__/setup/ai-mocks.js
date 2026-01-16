/**
 * AI Service mocks
 * Provides mock responses for OpenAI-powered features
 */
import { jest } from '@jest/globals';

/**
 * Mock meal suggestions response
 */
export const mockSuggestions = [
  {
    name: 'Paneer Tikka',
    cuisine: 'indian',
    mealType: 'dinner',
    prepTime: 30,
    estimatedCalories: 450,
    ingredients: [
      { name: 'Paneer', quantity: 250, unit: 'g' },
      { name: 'Capsicum', quantity: 1, unit: 'medium' }
    ],
    reason: 'Perfect for a quick dinner',
    description: 'Succulent paneer cubes grilled with spices'
  },
  {
    name: 'Butter Chicken',
    cuisine: 'indian',
    mealType: 'dinner',
    prepTime: 45,
    estimatedCalories: 550,
    ingredients: [
      { name: 'Chicken', quantity: 500, unit: 'g' },
      { name: 'Butter', quantity: 50, unit: 'g' }
    ],
    reason: 'Classic comfort food',
    description: 'Creamy tomato-based chicken curry'
  },
  {
    name: 'Fried Rice',
    cuisine: 'chinese',
    mealType: 'lunch',
    prepTime: 20,
    estimatedCalories: 380,
    ingredients: [
      { name: 'Rice', quantity: 300, unit: 'g' },
      { name: 'Vegetables', quantity: 200, unit: 'g' }
    ],
    reason: 'Quick and filling',
    description: 'Wok-tossed rice with vegetables'
  }
];

/**
 * Mock chat response
 */
export const mockChatResponse = {
  message: "Here are some meal suggestions based on your preferences!",
  suggestions: mockSuggestions.slice(0, 2)
};

/**
 * Mock week meal plan
 */
export const mockWeekPlan = {
  weekPlan: [
    {
      day: 'Monday',
      date: '2024-01-15',
      meals: {
        breakfast: {
          name: 'Poha',
          cuisine: 'indian',
          prepTime: 15,
          estimatedCalories: 250,
          description: 'Light and fluffy flattened rice'
        },
        lunch: {
          name: 'Dal Rice',
          cuisine: 'indian',
          prepTime: 25,
          estimatedCalories: 400,
          description: 'Comforting lentil curry with rice'
        },
        dinner: {
          name: 'Paneer Butter Masala',
          cuisine: 'indian',
          prepTime: 35,
          estimatedCalories: 500,
          description: 'Rich creamy paneer curry'
        }
      }
    }
  ]
};

/**
 * Mock recipe response
 */
export const mockRecipe = {
  mealName: 'Paneer Tikka',
  cuisine: 'indian',
  description: 'Grilled paneer with aromatic spices',
  prepTime: 15,
  cookTime: 20,
  servings: 2,
  calories: 450,
  ingredients: [
    { item: 'Paneer', quantity: '250', unit: 'g', notes: 'Cut into cubes' },
    { item: 'Yogurt', quantity: '100', unit: 'g', notes: 'Thick curd' }
  ],
  instructions: [
    { step: 1, text: 'Cut paneer into cubes', time: '5 min' },
    { step: 2, text: 'Marinate with yogurt and spices', time: '30 min' },
    { step: 3, text: 'Grill on high heat', time: '10 min' }
  ],
  tips: [
    'Use fresh paneer for best results',
    'Don\'t over-marinate'
  ]
};

/**
 * Creates mock for the AI service module
 * Use with jest.unstable_mockModule
 */
export function createAIMock() {
  return {
    suggestMeals: jest.fn().mockResolvedValue(mockSuggestions),
    chatSuggestMeals: jest.fn().mockResolvedValue(mockChatResponse),
    generateWeekMealPlan: jest.fn().mockResolvedValue(mockWeekPlan),
    generateRecipe: jest.fn().mockResolvedValue(mockRecipe)
  };
}
