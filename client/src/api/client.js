const API_BASE = '/api';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

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
 * Make an API request with timeout and error handling
 */
async function request(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

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
    return response.json();
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
  add: (item) => request('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  update: (id, data) => request(`/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/inventory/${id}`, { method: 'DELETE' }),
};

// Meals
export const meals = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/meals${params ? `?${params}` : ''}`);
  },
  get: (id) => request(`/meals/${id}`),
  add: (meal) => request('/meals', { method: 'POST', body: JSON.stringify(meal) }),
  update: (id, data) => request(`/meals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
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
  log: (meal) => request('/history', { method: 'POST', body: JSON.stringify(meal) }),
  update: (id, data) => request(`/history/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
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
  add: (plan) => request('/meal-plan', { method: 'POST', body: JSON.stringify(plan) }),
  update: (id, data) => request(`/meal-plan/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/meal-plan/${id}`, { method: 'DELETE' }),
  markComplete: (id) => request(`/meal-plan/${id}/complete`, { method: 'POST' }),
  markUncomplete: (id) => request(`/meal-plan/${id}/uncomplete`, { method: 'POST' }),
  generateWeek: (weekStart) => request('/meal-plan/generate-week', { method: 'POST', body: JSON.stringify({ weekStart }) }),
};

// Shopping
export const shopping = {
  getAll: () => request('/shopping'),
  generate: (week) => request('/shopping/generate', { method: 'POST', body: JSON.stringify({ week }) }),
  add: (item) => request('/shopping', { method: 'POST', body: JSON.stringify(item) }),
  update: (id, data) => request(`/shopping/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/shopping/${id}`, { method: 'DELETE' }),
  clearPurchased: () => request('/shopping/clear/purchased', { method: 'DELETE' }),
};

// Reviews
export const reviews = {
  getUnratedToday: () => request('/reviews/unrated-today'),
  getDay: (date) => request(`/reviews/day/${date}`),
  saveDay: (date, data) => request(`/reviews/day/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
  getWeek: (weekStart) => request(`/reviews/week/${weekStart}`),
  saveWeek: (weekStart, data) => request(`/reviews/week/${weekStart}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSummary: (days = 30) => request(`/reviews/summary?days=${days}`),
};

// Recipes
export const recipes = {
  getAll: () => request('/recipes'),
  get: (id) => request(`/recipes/${id}`),
  generate: (meal) => request('/recipes/generate', { method: 'POST', body: JSON.stringify({ meal }) }),
  delete: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),
  search: (query) => request(`/recipes/search/${encodeURIComponent(query)}`),
};
