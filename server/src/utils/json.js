/**
 * Safe JSON utilities for server-side use
 */

/**
 * Safely parse JSON with a fallback value
 * @param {string|any} str - String to parse (or already parsed value)
 * @param {any} fallback - Value to return if parsing fails
 * @returns {any}
 */
export function safeJsonParse(str, fallback = null) {
  if (str === null || str === undefined) return fallback;
  if (typeof str !== 'string') return str;

  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return fallback;
  }
}

/**
 * Parse ingredients that could be string or array
 * @param {string|string[]} ingredients
 * @returns {string[]}
 */
export function parseIngredients(ingredients) {
  if (!ingredients) return [];
  if (Array.isArray(ingredients)) return ingredients;

  const parsed = safeJsonParse(ingredients, []);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Parse instructions that could be string or array
 * @param {string|string[]} instructions
 * @returns {string[]}
 */
export function parseInstructions(instructions) {
  if (!instructions) return [];
  if (Array.isArray(instructions)) return instructions;

  const parsed = safeJsonParse(instructions, []);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Safely stringify JSON
 * @param {any} value
 * @param {string} fallback
 * @returns {string}
 */
export function safeJsonStringify(value, fallback = '{}') {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error.message);
    return fallback;
  }
}
