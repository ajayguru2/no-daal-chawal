/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Format date as YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get start of day (midnight)
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999)
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get date N days ago from today
 * @param {number} days
 * @returns {Date}
 */
export function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get date N days from now
 * @param {number} days
 * @returns {Date}
 */
export function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of week (Monday)
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday)
 * @param {Date} [date=new Date()]
 * @returns {Date}
 */
export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get start of month
 * @param {number} [year]
 * @param {number} [month] - 1-indexed (1 = January)
 * @returns {Date}
 */
export function startOfMonth(year, month) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? (now.getMonth() + 1);
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
}

/**
 * Get end of month
 * @param {number} [year]
 * @param {number} [month] - 1-indexed (1 = January)
 * @returns {Date}
 */
export function endOfMonth(year, month) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? (now.getMonth() + 1);
  return new Date(y, m, 0, 23, 59, 59, 999);
}

/**
 * Parse date string safely
 * @param {string} dateStr
 * @returns {Date}
 * @throws {Error} if date is invalid
 */
export function parseDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return date;
}

/**
 * Check if date string is valid YYYY-MM-DD format
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Get array of dates for a week starting from given date
 * @param {Date|string} startDate
 * @returns {Date[]}
 */
export function getWeekDates(startDate) {
  const start = new Date(startDate);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Get tomorrow's date
 * @returns {Date}
 */
export function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get yesterday's date
 * @returns {Date}
 */
export function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
