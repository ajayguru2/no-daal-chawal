/**
 * Shared constants used across the application
 * Single source of truth to avoid duplication
 */

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
  'korean',
  'other'
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAYS_FULL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const TIME_OPTIONS = [
  { value: '15', label: '15 min (Quick)' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2+ hours' }
];

export const MOODS = [
  { value: 'energetic', emoji: '⚡', label: 'Energetic' },
  { value: 'comfort', emoji: '🛋️', label: 'Comfort Food' },
  { value: 'healthy', emoji: '🥗', label: 'Healthy' },
  { value: 'adventurous', emoji: '🌶️', label: 'Adventurous' },
  { value: 'lazy', emoji: '😴', label: 'Low Effort' },
  { value: 'indulgent', emoji: '🍰', label: 'Indulgent' }
];

export const INVENTORY_CATEGORIES = [
  { value: 'grains', label: 'Grains & Cereals' },
  { value: 'spices', label: 'Spices & Seasonings' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'proteins', label: 'Proteins' },
  { value: 'others', label: 'Others' }
];

export const UNITS = [
  'kg',
  'g',
  'L',
  'ml',
  'pieces',
  'packets',
  'cans',
  'bottles',
  'boxes',
  'bags'
];

// Default values
export const DEFAULT_CALORIE_GOAL = 2000;
export const DEFAULT_PREP_TIME = 30;

// API configuration
export const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3001';

// Formatting helpers
export const formatCuisine = (cuisine) => {
  if (!cuisine) return '';
  return cuisine
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

export const formatMealType = (mealType) => {
  if (!mealType) return '';
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
};
