/**
 * Date utility functions for the client
 */

/**
 * Format date as YYYY-MM-DD string
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Mon, Jan 15")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateDisplay(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date for long display (e.g., "Monday, January 15, 2024")
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateLong(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get start of week (Monday) for a given date
 * @param {Date|string} [date=new Date()]
 * @returns {string} YYYY-MM-DD format
 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateYMD(d);
}

/**
 * Get array of date strings for a week starting from given date
 * @param {Date|string} startDate
 * @returns {string[]} Array of YYYY-MM-DD strings
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

/**
 * Check if a date is today
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * Check if a date is in the past
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isPast(date) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Get relative date string (e.g., "Today", "Yesterday", "2 days ago")
 * @param {Date|string} date
 * @returns {string}
 */
export function getRelativeDate(date) {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = today - d;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDateDisplay(date);
}

/**
 * Add days to a date
 * @param {Date|string} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Get the day name from a date
 * @param {Date|string} date
 * @returns {string}
 */
export function getDayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Parse a date string safely
 * @param {string} dateStr
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}
