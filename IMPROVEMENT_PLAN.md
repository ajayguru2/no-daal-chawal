# Bawarchi Code Improvement Plan

## Executive Summary

This document outlines a comprehensive improvement plan based on a thorough code review. The codebase has good architectural foundations but needs work on **validation, error handling, code deduplication, and type safety**.

**Overall Grade: B-**
- Architecture: A-
- Code Quality: C+
- Error Handling: D+
- Type Safety: D
- Test Coverage: F (none)

---

## Critical Issues Overview

| Category | Count | Severity |
|----------|-------|----------|
| Code Duplication | 12 | High |
| Missing Input Validation | 15 | Critical |
| Error Handling Gaps | 18 | High |
| Security Concerns | 6 | Critical |
| Performance Issues | 8 | Medium |
| Type Safety | 10 | Medium |

---

## Phase 1: Critical Security & Stability (Priority: Immediate)

### 1.1 Add Input Validation to All Routes

**Problem:** All POST/PATCH endpoints accept `req.body` without validation. This is a security risk and causes silent failures.

**Files Affected:**
- `server/src/routes/suggest.js:9` - No validation on mood, timeAvailable, cuisine, mealType
- `server/src/routes/mealPlan.js:49` - No validation on date, mealType, mealId
- `server/src/routes/meals.js:40` - No validation on name, cuisine, mealType
- `server/src/routes/inventory.js:41` - No validation on name, quantity, unit
- `server/src/routes/history.js:55` - No validation on mealName, cuisine
- `server/src/routes/reviews.js:45,62` - No validation on date, scores
- `server/src/routes/recipe.js:9` - No validation on meal object

**Solution:** Install and configure Zod for schema validation.

```bash
cd server && npm install zod
```

**Create:** `server/src/validators/index.js`
```javascript
import { z } from 'zod';

export const MealTypeEnum = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const CuisineEnum = z.enum(['indian', 'chinese', 'italian', 'mexican', 'thai', 'japanese', 'american', 'mediterranean', 'other']);

export const suggestSchema = z.object({
  mood: z.string().optional(),
  timeAvailable: z.string().optional(),
  cuisine: CuisineEnum.optional(),
  mealType: MealTypeEnum.optional(),
  rejectedMeals: z.array(z.object({
    name: z.string(),
    reason: z.string().optional()
  })).optional()
});

export const mealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: MealTypeEnum,
  mealId: z.number().int().positive().optional(),
  notes: z.string().optional()
});

export const mealSchema = z.object({
  name: z.string().min(1).max(200),
  cuisine: CuisineEnum,
  mealType: MealTypeEnum,
  prepTime: z.number().int().positive().optional(),
  ingredients: z.array(z.string()).optional(),
  recipe: z.string().optional(),
  isCustom: z.boolean().optional()
});

export const inventorySchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  lowStockAt: z.number().positive().optional(),
  expiresAt: z.string().datetime().optional()
});

export const historySchema = z.object({
  mealName: z.string().min(1),
  cuisine: CuisineEnum,
  mealType: MealTypeEnum,
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
  calories: z.number().positive().optional()
});

export const dayReviewSchema = z.object({
  varietyScore: z.number().int().min(0).max(10),
  effortScore: z.number().int().min(0).max(10),
  satisfactionScore: z.number().int().min(0).max(10),
  notes: z.string().optional()
});

// Validation middleware factory
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
```

**Effort:** 4-6 hours

---

### 1.2 Add Global Error Handler

**Problem:** No centralized error handling. Errors leak implementation details.

**File:** `server/src/index.js`

**Current (Line 59-61):**
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

**Add before catch-all route:**
```javascript
// Error types
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.code || 'UNKNOWN'}: ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database operation failed',
      code: err.code
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues
    });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Client-side routing (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});
```

**Effort:** 2 hours

---

### 1.3 Add React Error Boundary

**Problem:** Any component error crashes the entire app.

**Create:** `client/src/components/ErrorBoundary.jsx`
```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Update:** `client/src/App.jsx` - Wrap routes with ErrorBoundary

**Effort:** 1 hour

---

### 1.4 Fix Security Issues

**Problem:** Multiple security vulnerabilities.

#### 1.4.1 Configure CORS Properly
**File:** `server/src/index.js:28`

```javascript
// Current (insecure)
app.use(cors());

// Fixed
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : ['http://localhost:5173'],
  credentials: true
}));
```

#### 1.4.2 Add Rate Limiting
```bash
cd server && npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit AI calls more strictly
  message: { error: 'Too many AI requests, please slow down' }
});

app.use('/api/', apiLimiter);
app.use('/api/suggest', aiLimiter);
app.use('/api/recipes/generate', aiLimiter);
app.use('/api/meal-plan/generate-week', aiLimiter);
```

#### 1.4.3 Add Helmet for Security Headers
```bash
cd server && npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

**Effort:** 2 hours

---

## Phase 2: Code Deduplication (Priority: High)

### 2.1 Extract Shared Server Utilities

**Problem:** Same logic duplicated across 4 files:
- Cuisine preference calculation: `suggest.js:51-66`, `mealPlan.js:154-169`, `reviews.js:142-159`
- AI context building: `suggest.js:11-99`, `mealPlan.js:133-189`
- Date calculations: scattered across all routes

**Create:** `server/src/utils/context-builder.js`
```javascript
import { prisma } from '../index.js';

/**
 * Build cuisine preferences from meal history
 * @param {number} days - Number of days to look back
 * @returns {Object} { preferred: string[], avoided: string[] }
 */
export async function buildCuisinePreferences(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const ratedMeals = await prisma.mealHistory.findMany({
    where: {
      eatenAt: { gte: since },
      rating: { not: null }
    },
    select: { cuisine: true, rating: true }
  });

  const cuisineRatings = {};
  for (const meal of ratedMeals) {
    if (!cuisineRatings[meal.cuisine]) {
      cuisineRatings[meal.cuisine] = { total: 0, count: 0 };
    }
    cuisineRatings[meal.cuisine].total += meal.rating;
    cuisineRatings[meal.cuisine].count += 1;
  }

  const preferred = [];
  const avoided = [];

  for (const [cuisine, data] of Object.entries(cuisineRatings)) {
    const avg = data.total / data.count;
    if (avg >= 4) preferred.push(cuisine);
    if (avg <= 2) avoided.push(cuisine);
  }

  return { preferred, avoided };
}

/**
 * Get recent meals to avoid repetition
 * @param {number} days - Number of days to look back
 * @returns {string[]} Array of meal names
 */
export async function getRecentMeals(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const meals = await prisma.mealHistory.findMany({
    where: { eatenAt: { gte: since } },
    select: { mealName: true },
    distinct: ['mealName']
  });

  return meals.map(m => m.mealName);
}

/**
 * Get calorie context for today
 * @returns {Object} { consumed: number, goal: number, remaining: number }
 */
export async function getCalorieContext() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysMeals = await prisma.mealHistory.findMany({
    where: {
      eatenAt: { gte: today },
      calories: { not: null }
    },
    select: { calories: true }
  });

  const consumed = todaysMeals.reduce((sum, m) => sum + (m.calories || 0), 0);

  const goalPref = await prisma.preference?.findUnique({
    where: { key: 'dailyCalorieGoal' }
  }).catch(() => null);

  const goal = goalPref?.value ? parseInt(goalPref.value) : 2000;
  const remaining = Math.max(0, goal - consumed);

  return { consumed, goal, remaining };
}

/**
 * Get review insights from recent reviews
 * @returns {Object} Review context
 */
export async function getReviewContext() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const reviews = await prisma.dayReview.findMany({
    where: { date: { gte: weekAgo } },
    orderBy: { date: 'desc' },
    take: 7
  });

  if (reviews.length === 0) return null;

  const avgVariety = reviews.reduce((s, r) => s + r.varietyScore, 0) / reviews.length;
  const avgEffort = reviews.reduce((s, r) => s + r.effortScore, 0) / reviews.length;
  const avgSatisfaction = reviews.reduce((s, r) => s + r.satisfactionScore, 0) / reviews.length;

  return {
    avgVariety: avgVariety.toFixed(1),
    avgEffort: avgEffort.toFixed(1),
    avgSatisfaction: avgSatisfaction.toFixed(1),
    needsMoreVariety: avgVariety < 5,
    tooMuchEffort: avgEffort > 7
  };
}

/**
 * Build complete AI context for meal suggestions
 */
export async function buildAIContext() {
  const [inventory, recentMeals, cuisinePrefs, calorieContext, reviewContext] = await Promise.all([
    prisma.inventoryItem.findMany({ select: { name: true, quantity: true, unit: true } }),
    getRecentMeals(14),
    buildCuisinePreferences(30),
    getCalorieContext(),
    getReviewContext()
  ]);

  return {
    inventory,
    recentMeals,
    cuisinePrefs,
    calorieContext,
    reviewContext
  };
}
```

**Create:** `server/src/utils/date.js`
```javascript
/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get start of day
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get days ago from today
 */
export function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Get start of week (Monday)
 */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday)
 */
export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Parse date string safely
 */
export function parseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date;
}
```

**Effort:** 4 hours

---

### 2.2 Extract Shared Client Constants

**Problem:** Constants duplicated across multiple files:
- `MEAL_TYPES` in `Home.jsx:18-24` and `MealPlan.jsx:8`
- `API_BASE` in `Home.jsx:7` and `MealChat.jsx:6`
- `CUISINES` in multiple files
- Date formatting logic duplicated

**Create:** `client/src/constants/index.js`
```javascript
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export const CUISINES = [
  'indian',
  'chinese',
  'italian',
  'mexican',
  'thai',
  'japanese',
  'american',
  'mediterranean',
  'other'
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TIME_OPTIONS = [
  { value: '15', label: '15 min (Quick)' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' }
];

export const MOODS = [
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
  { value: 'comfort', emoji: '🛋️', label: 'Comfort' },
  { value: 'healthy', emoji: '🥗', label: 'Healthy' },
  { value: 'adventurous', emoji: '🌶️', label: 'Adventurous' },
  { value: 'lazy', emoji: '😴', label: 'Lazy' }
];

export const INVENTORY_CATEGORIES = [
  'grains',
  'spices',
  'vegetables',
  'dairy',
  'proteins',
  'others'
];
```

**Create:** `client/src/utils/date.js`
```javascript
/**
 * Format date as YYYY-MM-DD
 */
export function formatDateYMD(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get start of week (Monday)
 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateYMD(d);
}

/**
 * Get week dates starting from a date
 */
export function getWeekDates(startDate) {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatDateYMD(d));
  }
  return dates;
}
```

**Effort:** 2 hours

---

### 2.3 Consolidate API Client Usage

**Problem:** `Home.jsx` and `MealChat.jsx` make raw `fetch()` calls instead of using `api/client.js`.

**Files to Update:**
- `client/src/pages/Home.jsx:109-119` - refineWithFeedback uses raw fetch
- `client/src/components/MealChat.jsx:24,63` - uses raw fetch

**Update `client/src/api/client.js`** to add missing methods:
```javascript
// Add to suggestions object
suggestions: {
  get: (data) => request('/suggest', { method: 'POST', body: JSON.stringify(data) }),
  chat: (data) => request('/suggest/chat', { method: 'POST', body: JSON.stringify(data) }),
  refine: (data) => request('/suggest/chat', { method: 'POST', body: JSON.stringify(data) })
}
```

**Effort:** 2 hours

---

## Phase 3: Error Handling & User Feedback (Priority: High)

### 3.1 Add Error States to Components

**Problem:** Components silently fail. Users don't know when operations fail.

**Create:** `client/src/components/Toast.jsx`
```jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Toast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  return createPortal(
    <div className={`fixed bottom-4 right-4 ${colors[type]} text-white px-4 py-2 rounded shadow-lg z-50`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">&times;</button>
      </div>
    </div>,
    document.body
  );
}
```

**Create:** `client/src/hooks/useToast.js`
```jsx
import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'error') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}
```

**Update pages to use toast for error feedback.**

**Effort:** 3 hours

---

### 3.2 Add Safe JSON Parsing

**Problem:** `JSON.parse()` called without try-catch in multiple places:
- `MealCard.jsx:12-14`
- `MealPlan.jsx:352`
- `MealChat.jsx:29,75`
- Multiple server routes

**Create:** `client/src/utils/json.js`
```javascript
/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse(str, fallback = null) {
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    console.warn('Failed to parse JSON:', str);
    return fallback;
  }
}

/**
 * Parse ingredients (could be string or array)
 */
export function parseIngredients(ingredients) {
  if (Array.isArray(ingredients)) return ingredients;
  return safeJsonParse(ingredients, []);
}

/**
 * Parse instructions (could be string or array)
 */
export function parseInstructions(instructions) {
  if (Array.isArray(instructions)) return instructions;
  return safeJsonParse(instructions, []);
}
```

**Effort:** 1 hour

---

### 3.3 Improve API Client Error Handling

**Update:** `client/src/api/client.js`
```javascript
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.message || `Request failed with status ${response.status}`,
        response.status,
        error.code
      );
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new APIError('Request timed out', 408, 'TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
```

**Effort:** 1 hour

---

## Phase 4: Database & Performance (Priority: Medium)

### 4.1 Add Database Indexes

**Problem:** No indexes on frequently queried columns.

**Update:** `server/prisma/schema.prisma`
```prisma
model MealHistory {
  id        Int       @id @default(autoincrement())
  mealName  String
  cuisine   String
  mealType  String
  eatenAt   DateTime  @default(now())
  rating    Int?
  notes     String?
  calories  Int?
  recipeId  Int?
  recipe    Recipe?   @relation(fields: [recipeId], references: [id])

  @@index([eatenAt])
  @@index([rating])
  @@index([cuisine])
}

model MealPlan {
  id          Int       @id @default(autoincrement())
  date        DateTime
  mealType    String
  mealId      Int?
  meal        Meal?     @relation(fields: [mealId], references: [id])
  notes       String?
  completed   Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([date])
  @@index([mealType])
  @@unique([date, mealType])
}

model Recipe {
  id           Int           @id @default(autoincrement())
  mealName     String
  cuisine      String
  prepTime     Int?
  cookTime     Int?
  servings     Int?
  ingredients  String        // JSON array
  instructions String        // JSON array
  tips         String?
  description  String?
  calories     Int?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  mealHistory  MealHistory[]

  @@index([mealName])
  @@index([cuisine])
}
```

**Run migration:**
```bash
cd server && npx prisma migrate dev --name add_indexes
```

**Effort:** 1 hour

---

### 4.2 Add Pagination to List Endpoints

**Problem:** List endpoints return all records, causing performance issues with large datasets.

**Example fix for `server/src/routes/history.js`:**
```javascript
router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [meals, total] = await Promise.all([
      req.prisma.mealHistory.findMany({
        orderBy: { eatenAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      req.prisma.mealHistory.count()
    ]);

    res.json({
      data: meals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});
```

**Apply to:**
- `GET /api/history`
- `GET /api/inventory`
- `GET /api/meals`
- `GET /api/recipes`
- `GET /api/shopping`

**Effort:** 3 hours

---

### 4.3 Fix Low Stock Query Bug

**File:** `server/src/routes/inventory.js:24-25`

**Current (broken):**
```javascript
quantity: { lte: req.prisma.inventoryItem.fields.lowStockAt }
```

**Fixed:**
```javascript
router.get('/low-stock', async (req, res, next) => {
  try {
    // Use raw SQL for field-to-field comparison
    const lowStockItems = await req.prisma.$queryRaw`
      SELECT * FROM "InventoryItem"
      WHERE quantity <= "lowStockAt"
      AND "lowStockAt" IS NOT NULL
    `;
    res.json(lowStockItems);
  } catch (error) {
    next(error);
  }
});
```

**Effort:** 30 minutes

---

## Phase 5: State Management (Priority: Medium)

### 5.1 Refactor Home.jsx State

**Problem:** `Home.jsx` has 12 separate useState hooks making it hard to manage.

**Create:** `client/src/hooks/useSuggestions.js`
```jsx
import { useState, useCallback } from 'react';
import { suggestions } from '../api/client';

export function useSuggestions() {
  const [state, setState] = useState({
    suggestions: [],
    loading: false,
    error: null,
    conversation: []
  });

  const getSuggestions = useCallback(async (filters) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await suggestions.get(filters);
      setState(s => ({
        ...s,
        suggestions: result.suggestions || result,
        loading: false,
        conversation: []
      }));
    } catch (error) {
      setState(s => ({ ...s, error: error.message, loading: false }));
    }
  }, []);

  const refine = useCallback(async (input, mealType, currentConversation) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await suggestions.chat({
        mealType,
        conversation: [...currentConversation, { role: 'user', content: input }]
      });
      setState(s => ({
        ...s,
        suggestions: result.suggestions || [],
        conversation: [
          ...currentConversation,
          { role: 'user', content: input },
          { role: 'assistant', content: result.message }
        ],
        loading: false
      }));
    } catch (error) {
      setState(s => ({ ...s, error: error.message, loading: false }));
    }
  }, []);

  return {
    ...state,
    getSuggestions,
    refine
  };
}
```

**Create:** `client/src/hooks/useCalories.js`
```jsx
import { useState, useEffect, useCallback } from 'react';
import { history, preferences } from '../api/client';

export function useCalories() {
  const [calorieInfo, setCalorieInfo] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(2000);

  const loadCalorieInfo = useCallback(async () => {
    try {
      const [info, goalPref] = await Promise.all([
        history.getCaloriesToday(),
        preferences.get('dailyCalorieGoal').catch(() => null)
      ]);
      setCalorieInfo(info);
      if (goalPref?.value) setDailyGoal(parseInt(goalPref.value));
    } catch (error) {
      console.error('Failed to load calorie info:', error);
    }
  }, []);

  useEffect(() => {
    loadCalorieInfo();
  }, [loadCalorieInfo]);

  return { calorieInfo, dailyGoal, refreshCalories: loadCalorieInfo };
}
```

**Effort:** 4 hours

---

## Phase 6: Type Safety (Priority: Low-Medium)

### 6.1 Add JSDoc Type Annotations

If not migrating to TypeScript, add JSDoc comments for better IDE support.

**Example for `client/src/api/client.js`:**
```javascript
/**
 * @typedef {Object} Meal
 * @property {number} id
 * @property {string} name
 * @property {string} cuisine
 * @property {string} mealType
 * @property {number} [prepTime]
 * @property {string|string[]} [ingredients]
 * @property {number} [estimatedCalories]
 */

/**
 * @typedef {Object} MealSuggestion
 * @property {string} name
 * @property {string} cuisine
 * @property {string} mealType
 * @property {number} prepTime
 * @property {number} estimatedCalories
 * @property {string[]} ingredients
 * @property {string} reason
 * @property {string} [description]
 * @property {boolean} [calorieWarning]
 */

/**
 * Get meal suggestions based on filters
 * @param {Object} filters
 * @param {string} [filters.mood]
 * @param {string} [filters.timeAvailable]
 * @param {string} [filters.cuisine]
 * @param {string} [filters.mealType]
 * @returns {Promise<MealSuggestion[]>}
 */
```

**Effort:** 4-6 hours for full coverage

---

### 6.2 Add PropTypes to Components (Alternative to TypeScript)

```bash
cd client && npm install prop-types
```

**Example for `MealCard.jsx`:**
```jsx
import PropTypes from 'prop-types';

MealCard.propTypes = {
  meal: PropTypes.shape({
    name: PropTypes.string.isRequired,
    cuisine: PropTypes.string.isRequired,
    mealType: PropTypes.string.isRequired,
    prepTime: PropTypes.number,
    estimatedCalories: PropTypes.number,
    ingredients: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    description: PropTypes.string,
    reason: PropTypes.string,
    calorieWarning: PropTypes.bool
  }).isRequired,
  onAteThis: PropTypes.func.isRequired,
  onGetRecipe: PropTypes.func.isRequired
};
```

**Effort:** 3-4 hours for all components

---

## Phase 7: Testing (Priority: Medium)

### 7.1 Add Backend Unit Tests

```bash
cd server && npm install -D vitest @vitest/coverage-v8
```

**Create:** `server/vitest.config.js`
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
```

**Example test:** `server/src/utils/__tests__/context-builder.test.js`
```javascript
import { describe, it, expect, vi } from 'vitest';
import { buildCuisinePreferences } from '../context-builder.js';

describe('buildCuisinePreferences', () => {
  it('identifies preferred cuisines with avg rating >= 4', async () => {
    // Mock prisma...
    const result = await buildCuisinePreferences(30);
    expect(result.preferred).toContain('indian');
  });

  it('identifies avoided cuisines with avg rating <= 2', async () => {
    // Mock prisma...
    const result = await buildCuisinePreferences(30);
    expect(result.avoided).toContain('japanese');
  });
});
```

**Effort:** 8-12 hours for good coverage

---

### 7.2 Add Frontend Component Tests

```bash
cd client && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Create:** `client/vitest.config.js`
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js'
  }
});
```

**Effort:** 8-12 hours for good coverage

---

## Implementation Priority Matrix

| Phase | Priority | Effort | Impact | Dependencies |
|-------|----------|--------|--------|--------------|
| 1.1 Input Validation | Critical | 4-6h | High | None |
| 1.2 Global Error Handler | Critical | 2h | High | None |
| 1.3 React Error Boundary | Critical | 1h | High | None |
| 1.4 Security Fixes | Critical | 2h | High | None |
| 2.1 Server Utils | High | 4h | High | None |
| 2.2 Client Constants | High | 2h | Medium | None |
| 2.3 API Client Consolidation | High | 2h | Medium | 2.2 |
| 3.1 Toast/Error States | High | 3h | High | None |
| 3.2 Safe JSON Parsing | High | 1h | Medium | None |
| 3.3 API Client Errors | High | 1h | Medium | None |
| 4.1 Database Indexes | Medium | 1h | High | None |
| 4.2 Pagination | Medium | 3h | Medium | None |
| 4.3 Low Stock Bug Fix | Medium | 0.5h | Low | None |
| 5.1 State Management | Medium | 4h | Medium | 2.2, 2.3 |
| 6.1 JSDoc Types | Low | 4-6h | Medium | None |
| 6.2 PropTypes | Low | 3-4h | Medium | None |
| 7.1 Backend Tests | Medium | 8-12h | High | 2.1 |
| 7.2 Frontend Tests | Medium | 8-12h | High | 5.1 |

---

## Quick Wins (< 1 hour each)

1. **Fix low stock query bug** - `inventory.js:24-25`
2. **Add Error Boundary** - `client/src/components/ErrorBoundary.jsx`
3. **Add safe JSON parsing utility** - `client/src/utils/json.js`
4. **Configure CORS properly** - `server/src/index.js:28`
5. **Fix date bug in history.js** - Line 9-10 (month is 0-indexed)
6. **Add request timeout to API client** - `client/src/api/client.js`

---

## Files to Create

| Path | Purpose |
|------|---------|
| `server/src/validators/index.js` | Zod validation schemas |
| `server/src/utils/context-builder.js` | Shared AI context building |
| `server/src/utils/date.js` | Date utilities |
| `server/src/middleware/error-handler.js` | Global error handling |
| `client/src/constants/index.js` | Shared constants |
| `client/src/utils/date.js` | Date formatting utilities |
| `client/src/utils/json.js` | Safe JSON parsing |
| `client/src/components/ErrorBoundary.jsx` | React error boundary |
| `client/src/components/Toast.jsx` | Toast notifications |
| `client/src/hooks/useToast.js` | Toast hook |
| `client/src/hooks/useSuggestions.js` | Suggestions state hook |
| `client/src/hooks/useCalories.js` | Calorie tracking hook |

---

## Files to Modify

| Path | Changes |
|------|---------|
| `server/src/index.js` | Add error handler, CORS config, rate limiting |
| `server/src/routes/*.js` | Add validation middleware, use shared utils |
| `server/src/services/ai.js` | Use shared context builder |
| `server/prisma/schema.prisma` | Add indexes, timestamps |
| `client/src/App.jsx` | Add ErrorBoundary wrapper |
| `client/src/api/client.js` | Add timeout, better errors, missing methods |
| `client/src/pages/Home.jsx` | Use hooks, constants, safe parsing |
| `client/src/pages/MealPlan.jsx` | Use constants, date utils, error handling |
| `client/src/components/MealCard.jsx` | Add PropTypes, safe parsing |
| `client/src/components/MealChat.jsx` | Use API client, add error state |

---

## Estimated Total Effort

| Category | Hours |
|----------|-------|
| Phase 1 (Critical) | 9-11 |
| Phase 2 (Deduplication) | 8 |
| Phase 3 (Error Handling) | 5 |
| Phase 4 (Performance) | 4.5 |
| Phase 5 (State Management) | 4 |
| Phase 6 (Type Safety) | 7-10 |
| Phase 7 (Testing) | 16-24 |
| **Total** | **53-66 hours** |

Recommended approach: Complete Phases 1-3 first (22-24 hours) for immediate stability and security improvements.
