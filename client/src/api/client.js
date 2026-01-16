const API_BASE = '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const CACHE_TTL = 60000; // 1 minute cache TTL

/**
 * Simple in-memory cache for GET requests
 */
const cache = new Map();

function getCacheKey(endpoint) {
  return endpoint;
}

function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

/**
 * Invalidate cache entries that match a pattern
 */
export function invalidateCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Custom API error class with status code and error code
 */
export class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Make an API request with timeout, error handling, and caching
 */
async function request(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, cache: useCache = true, ...fetchOptions } = options;
  const isGet = !fetchOptions.method || fetchOptions.method === 'GET';

  // Check cache for GET requests
  if (isGet && useCache) {
    const cacheKey = getCacheKey(endpoint);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      signal: controller.signal,
      ...fetchOptions,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.error || error.message || `Request failed with status ${response.status}`,
        response.status,
        error.code || 'API_ERROR'
      );
    }

    if (response.status === 204) return null;
    const data = await response.json();

    // Cache GET responses
    if (isGet && useCache) {
      setCache(getCacheKey(endpoint), data);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new APIError('Request timed out', 408, 'TIMEOUT');
    }
    if (err instanceof APIError) throw err;
    throw new APIError(err.message || 'Network error', 0, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if an error is a specific API error type
 */
export function isAPIError(error, code) {
  return error instanceof APIError && (code ? error.code === code : true);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error) {
  if (error instanceof APIError) {
    if (error.code === 'TIMEOUT') return 'Request timed out. Please try again.';
    if (error.code === 'NETWORK_ERROR') return 'Network error. Please check your connection.';
    if (error.code === 'RATE_LIMIT') return 'Too many requests. Please wait a moment.';
    if (error.status === 401) return 'Please log in to continue.';
    if (error.status === 403) return 'You do not have permission to do this.';
    if (error.status === 404) return 'The requested resource was not found.';
    return error.message;
  }
  return error?.message || 'An unexpected error occurred';
}

// Inventory
export const inventory = {
  getAll: () => request('/inventory'),
  getLowStock: () => request('/inventory/low-stock'),
  add: async (item) => {
    const result = await request('/inventory', { method: 'POST', body: JSON.stringify(item) });
    invalidateCache('/inventory');
    return result;
  },
  update: async (id, data) => {
    const result = await request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    invalidateCache('/inventory');
    return result;
  },
  delete: async (id) => {
    const result = await request(`/inventory/${id}`, { method: 'DELETE' });
    invalidateCache('/inventory');
    return result;
  },
};

// Meals
export const meals = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/meals${params ? `?${params}` : ''}`);
  },
  get: (id) => request(`/meals/${id}`),
  add: async (meal) => {
    const result = await request('/meals', { method: 'POST', body: JSON.stringify(meal) });
    invalidateCache('/meals');
    return result;
  },
  update: async (id, data) => {
    const result = await request(`/meals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    invalidateCache('/meals');
    return result;
  },
  delete: async (id) => {
    const result = await request(`/meals/${id}`, { method: 'DELETE' });
    invalidateCache('/meals');
    return result;
  },
};

// Suggestions
export const suggestions = {
  get: (params) => request('/suggest', { method: 'POST', body: JSON.stringify(params) }),
  chat: (params) => request('/suggest/chat', { method: 'POST', body: JSON.stringify(params) }),
};

// History
export const history = {
  getRecent: (days = 14) => request(`/history?days=${days}`),
  getStats: (days = 14) => request(`/history/stats?days=${days}`),
  getCalendar: (year, month) => request(`/history/calendar?year=${year}&month=${month}`),
  getTodayCalories: () => request('/history/calories/today'),
  log: async (meal) => {
    const result = await request('/history', { method: 'POST', body: JSON.stringify(meal) });
    invalidateCache('/history');
    return result;
  },
  update: async (id, data) => {
    const result = await request(`/history/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    invalidateCache('/history');
    return result;
  },
};

// Preferences
export const preferences = {
  get: (key) => request(`/preferences/${key}`),
  set: (key, value) => request(`/preferences/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  getAll: () => request('/preferences'),
};

// Meal Plan
export const mealPlan = {
  getWeek: (week) => request(`/meal-plan${week ? `?week=${week}` : ''}`),
  getMonth: (year, month) => request(`/meal-plan?year=${year}&month=${month}`),
  add: async (plan) => {
    const result = await request('/meal-plan', { method: 'POST', body: JSON.stringify(plan) });
    invalidateCache('/meal-plan');
    return result;
  },
  update: async (id, data) => {
    const result = await request(`/meal-plan/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    invalidateCache('/meal-plan');
    return result;
  },
  delete: async (id) => {
    const result = await request(`/meal-plan/${id}`, { method: 'DELETE' });
    invalidateCache('/meal-plan');
    return result;
  },
  markComplete: async (id) => {
    const result = await request(`/meal-plan/${id}/complete`, { method: 'POST' });
    invalidateCache('/meal-plan');
    return result;
  },
  markUncomplete: async (id) => {
    const result = await request(`/meal-plan/${id}/uncomplete`, { method: 'POST' });
    invalidateCache('/meal-plan');
    return result;
  },
  generateWeek: async (weekStart) => {
    const result = await request('/meal-plan/generate-week', { method: 'POST', body: JSON.stringify({ weekStart }) });
    invalidateCache('/meal-plan');
    return result;
  },
};

// Shopping
export const shopping = {
  getAll: () => request('/shopping'),
  generate: async (week) => {
    const result = await request('/shopping/generate', { method: 'POST', body: JSON.stringify({ week }) });
    invalidateCache('/shopping');
    return result;
  },
  add: async (item) => {
    const result = await request('/shopping', { method: 'POST', body: JSON.stringify(item) });
    invalidateCache('/shopping');
    return result;
  },
  update: async (id, data) => {
    const result = await request(`/shopping/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    invalidateCache('/shopping');
    return result;
  },
  delete: async (id) => {
    const result = await request(`/shopping/${id}`, { method: 'DELETE' });
    invalidateCache('/shopping');
    return result;
  },
  clearPurchased: async () => {
    const result = await request('/shopping/clear/purchased', { method: 'DELETE' });
    invalidateCache('/shopping');
    return result;
  },
};

// Reviews
export const reviews = {
  getUnratedToday: () => request('/reviews/unrated-today'),
  getDay: (date) => request(`/reviews/day/${date}`),
  saveDay: async (date, data) => {
    const result = await request(`/reviews/day/${date}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('/reviews');
    return result;
  },
  getWeek: (weekStart) => request(`/reviews/week/${weekStart}`),
  saveWeek: async (weekStart, data) => {
    const result = await request(`/reviews/week/${weekStart}`, { method: 'PUT', body: JSON.stringify(data) });
    invalidateCache('/reviews');
    return result;
  },
  getSummary: (days = 30) => request(`/reviews/summary?days=${days}`),
};

// Recipes
export const recipes = {
  getAll: () => request('/recipes'),
  get: (id) => request(`/recipes/${id}`),
  generate: async (meal) => {
    const result = await request('/recipes/generate', { method: 'POST', body: JSON.stringify({ meal }) });
    invalidateCache('/recipes');
    return result;
  },
  delete: async (id) => {
    const result = await request(`/recipes/${id}`, { method: 'DELETE' });
    invalidateCache('/recipes');
    return result;
  },
  search: (query) => request(`/recipes/search/${encodeURIComponent(query)}`),
};
