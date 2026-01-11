const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  if (response.status === 204) return null;
  return response.json();
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
  add: (plan) => request('/meal-plan', { method: 'POST', body: JSON.stringify(plan) }),
  update: (id, data) => request(`/meal-plan/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/meal-plan/${id}`, { method: 'DELETE' }),
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
