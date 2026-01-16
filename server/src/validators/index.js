import { z } from 'zod';

// Enums
export const MealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const CuisineEnum = z.enum([
  // Indian regional
  'indian', 'south_indian', 'north_indian', 'gujarati', 'punjabi', 'bengali',
  'maharashtrian', 'kerala', 'hyderabadi', 'rajasthani', 'goan',
  // Asian
  'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'indonesian',
  'malaysian', 'singaporean', 'filipino', 'burmese', 'cambodian', 'taiwanese',
  // European
  'italian', 'french', 'spanish', 'greek', 'german', 'british', 'irish',
  'portuguese', 'swiss', 'belgian', 'dutch', 'scandinavian', 'polish',
  'russian', 'hungarian', 'austrian', 'continental', 'european',
  // Middle Eastern & African
  'middle_eastern', 'turkish', 'lebanese', 'persian', 'israeli', 'moroccan',
  'egyptian', 'ethiopian', 'african', 'arab',
  // Americas
  'american', 'mexican', 'brazilian', 'peruvian', 'argentinian', 'cuban',
  'caribbean', 'cajun', 'tex_mex', 'latin_american', 'colombian',
  // Other
  'mediterranean', 'fusion', 'healthy', 'vegan', 'vegetarian', 'street_food',
  'fast_food', 'comfort_food', 'seafood', 'bbq', 'other'
]);
export const InventoryCategoryEnum = z.enum([
  'grains', 'spices', 'vegetables', 'dairy', 'proteins', 'fruits', 'others'
]);

// Suggestion schemas
export const suggestSchema = z.object({
  mood: z.string().max(50).optional(),
  timeAvailable: z.string().max(10).optional(),
  cuisine: CuisineEnum.optional(),
  mealType: MealTypeEnum.optional(),
  rejectedMeals: z.array(z.object({
    name: z.string().max(200),
    reason: z.string().max(500).optional()
  })).max(20).optional()
});

export const chatSuggestSchema = z.object({
  mealType: MealTypeEnum.optional(),
  conversation: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000)
  })).max(50)
});

// Meal schemas
export const mealSchema = z.object({
  name: z.string().min(1).max(200),
  cuisine: CuisineEnum,
  mealType: MealTypeEnum,
  prepTime: z.number().int().positive().max(480).optional(),
  ingredients: z.array(z.string().max(100)).max(50).optional(),
  recipe: z.string().max(10000).optional(),
  isCustom: z.boolean().optional()
});

export const mealUpdateSchema = mealSchema.partial();

// Meal Plan schemas
export const mealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  mealType: MealTypeEnum,
  mealId: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional()
});

export const mealPlanQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional()
});

export const generateWeekSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
});

// Inventory schemas
export const inventorySchema = z.object({
  name: z.string().min(1).max(100),
  category: InventoryCategoryEnum.optional(),
  quantity: z.number().positive().max(10000),
  unit: z.string().max(20).optional(),
  lowStockAt: z.number().positive().max(10000).optional(),
  expiresAt: z.string().datetime().optional().nullable()
});

export const inventoryUpdateSchema = inventorySchema.partial();

// History schemas
export const historySchema = z.object({
  mealName: z.string().min(1).max(200),
  cuisine: CuisineEnum,
  mealType: MealTypeEnum,
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  calories: z.number().int().positive().max(5000).optional(),
  recipeId: z.number().int().positive().optional()
});

export const historyUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional()
});

export const calendarQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional()
});

// Review schemas
export const dayReviewSchema = z.object({
  varietyScore: z.number().int().min(0).max(10),
  effortScore: z.number().int().min(0).max(10),
  satisfactionScore: z.number().int().min(0).max(10),
  notes: z.string().max(1000).optional()
});

export const weekReviewSchema = z.object({
  varietyBalance: z.number().int().min(0).max(10).optional(),
  effortVsSatisfaction: z.number().int().min(0).max(10).optional(),
  highlights: z.string().max(1000).optional(),
  improvements: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional()
});

// Shopping schemas
export const shoppingItemSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.number().positive().max(1000).optional(),
  unit: z.string().max(20).optional(),
  category: z.string().max(50).optional()
});

export const shoppingUpdateSchema = z.object({
  isPurchased: z.boolean().optional(),
  quantity: z.number().positive().max(1000).optional()
});

// Recipe schemas
export const generateRecipeSchema = z.object({
  meal: z.object({
    name: z.string().min(1).max(200),
    cuisine: CuisineEnum.optional(),
    prepTime: z.number().int().positive().max(480).optional(),
    estimatedCalories: z.number().int().positive().max(5000).optional(),
    description: z.string().max(1000).optional()
  })
});

// Preferences schemas
export const preferenceSchema = z.object({
  value: z.string().max(1000)
});

// Auth schemas
export const authSchema = z.object({
  pin: z.string().min(4).max(10)
});

// Date parameter schema
export const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');

// ID parameter schema
export const idParamSchema = z.coerce.number().int().positive();

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Request property to validate
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    req.validated = req.validated || {};
    req.validated[source] = result.data;
    next();
  };
}

/**
 * Validate multiple sources
 */
export function validateAll(schemas) {
  const middlewares = Object.entries(schemas).map(([source, schema]) =>
    validate(schema, source)
  );
  return (req, res, next) => {
    let idx = 0;
    const runNext = () => {
      if (idx >= middlewares.length) return next();
      middlewares[idx++](req, res, runNext);
    };
    runNext();
  };
}
