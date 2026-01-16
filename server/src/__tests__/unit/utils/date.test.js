/**
 * Unit tests for date utilities
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  formatDate,
  startOfDay,
  endOfDay,
  daysAgo,
  daysFromNow,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  parseDate,
  isValidDateString,
  getWeekDates,
  tomorrow,
  yesterday
} from '../../../utils/date.js';

describe('Date Utilities', () => {
  // Use a fixed date for consistent tests
  const fixedDate = new Date('2024-06-15T12:00:00.000Z');
  let realDate;

  beforeEach(() => {
    realDate = global.Date;
    // Mock Date to return fixed date for new Date()
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.Date = realDate;
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-06-15T12:00:00.000Z');
      expect(formatDate(date)).toBe('2024-06-15');
    });

    it('should handle date strings', () => {
      expect(formatDate('2024-01-01')).toBe('2024-01-01');
    });

    it('should handle dates at start of day', () => {
      const date = new Date('2024-06-15T00:00:00.000Z');
      expect(formatDate(date)).toBe('2024-06-15');
    });

    it('should handle dates at end of day', () => {
      const date = new Date('2024-06-15T23:59:59.999Z');
      expect(formatDate(date)).toBe('2024-06-15');
    });
  });

  describe('startOfDay', () => {
    it('should return midnight of given date', () => {
      const date = new Date('2024-06-15T14:30:45.123Z');
      const result = startOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should default to current date', () => {
      const result = startOfDay();
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should not mutate original date', () => {
      const original = new Date('2024-06-15T14:30:00.000Z');
      const originalHours = original.getHours();
      startOfDay(original);
      expect(original.getHours()).toBe(originalHours);
    });
  });

  describe('endOfDay', () => {
    it('should return 23:59:59.999 of given date', () => {
      const date = new Date('2024-06-15T10:00:00.000Z');
      const result = endOfDay(date);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should default to current date', () => {
      const result = endOfDay();
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('daysAgo', () => {
    it('should return date N days ago', () => {
      const result = daysAgo(7);
      const expected = new Date(fixedDate);
      expected.setDate(expected.getDate() - 7);
      expected.setHours(0, 0, 0, 0);
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should return start of day', () => {
      const result = daysAgo(5);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should handle 0 days ago', () => {
      const result = daysAgo(0);
      expect(result.getDate()).toBe(fixedDate.getDate());
    });

    it('should handle large numbers', () => {
      const result = daysAgo(365);
      const expected = new Date(fixedDate);
      expected.setDate(expected.getDate() - 365);
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });
  });

  describe('daysFromNow', () => {
    it('should return date N days from now', () => {
      const result = daysFromNow(7);
      const expected = new Date(fixedDate);
      expected.setDate(expected.getDate() + 7);
      expected.setHours(0, 0, 0, 0);
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should return start of day', () => {
      const result = daysFromNow(5);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('startOfWeek', () => {
    it('should return Monday for a mid-week date', () => {
      // June 15, 2024 is a Saturday
      const result = startOfWeek(new Date('2024-06-15'));
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(10); // June 10
    });

    it('should return same day if already Monday', () => {
      // June 10, 2024 is a Monday
      const result = startOfWeek(new Date('2024-06-10'));
      expect(result.getDay()).toBe(1);
      expect(result.getDate()).toBe(10);
    });

    it('should handle Sunday correctly', () => {
      // June 16, 2024 is a Sunday
      const result = startOfWeek(new Date('2024-06-16'));
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(10); // Previous Monday
    });

    it('should return start of day', () => {
      const result = startOfWeek(new Date('2024-06-15T15:30:00'));
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('endOfWeek', () => {
    it('should return Sunday for a mid-week date', () => {
      // June 15, 2024 is a Saturday
      const result = endOfWeek(new Date('2024-06-15'));
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getDate()).toBe(16); // June 16
    });

    it('should return end of day', () => {
      const result = endOfWeek(new Date('2024-06-15'));
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });

  describe('startOfMonth', () => {
    it('should return first day of specified month', () => {
      const result = startOfMonth(2024, 6);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getFullYear()).toBe(2024);
    });

    it('should return start of day', () => {
      const result = startOfMonth(2024, 6);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should default to current month if not specified', () => {
      const result = startOfMonth();
      expect(result.getDate()).toBe(1);
    });

    it('should handle January (month 1)', () => {
      const result = startOfMonth(2024, 1);
      expect(result.getMonth()).toBe(0); // January
    });

    it('should handle December (month 12)', () => {
      const result = startOfMonth(2024, 12);
      expect(result.getMonth()).toBe(11); // December
    });
  });

  describe('endOfMonth', () => {
    it('should return last day of month', () => {
      const result = endOfMonth(2024, 6);
      expect(result.getDate()).toBe(30); // June has 30 days
      expect(result.getMonth()).toBe(5); // June
    });

    it('should handle months with 31 days', () => {
      const result = endOfMonth(2024, 7);
      expect(result.getDate()).toBe(31); // July has 31 days
    });

    it('should handle February in leap year', () => {
      const result = endOfMonth(2024, 2);
      expect(result.getDate()).toBe(29); // 2024 is a leap year
    });

    it('should handle February in non-leap year', () => {
      const result = endOfMonth(2023, 2);
      expect(result.getDate()).toBe(28);
    });

    it('should return end of day', () => {
      const result = endOfMonth(2024, 6);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date string', () => {
      const result = parseDate('2024-06-15');
      expect(result instanceof Date).toBe(true);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should parse ISO date string', () => {
      const result = parseDate('2024-06-15T12:00:00.000Z');
      expect(result instanceof Date).toBe(true);
    });

    it('should throw for invalid date', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date');
    });

    it('should throw for empty string', () => {
      expect(() => parseDate('')).toThrow('Invalid date');
    });
  });

  describe('isValidDateString', () => {
    it('should return true for valid YYYY-MM-DD format', () => {
      expect(isValidDateString('2024-06-15')).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(isValidDateString('06/15/2024')).toBe(false);
      expect(isValidDateString('2024/06/15')).toBe(false);
      expect(isValidDateString('15-06-2024')).toBe(false);
    });

    it('should return false for partial dates', () => {
      expect(isValidDateString('2024-06')).toBe(false);
      expect(isValidDateString('2024')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDateString('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDateString('2024-00-01')).toBe(false); // Invalid month
    });

    it('should return false for non-string input', () => {
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });
  });

  describe('getWeekDates', () => {
    it('should return array of 7 dates', () => {
      const result = getWeekDates('2024-06-10');
      expect(result).toHaveLength(7);
    });

    it('should start from given date', () => {
      const result = getWeekDates('2024-06-10');
      expect(result[0].getDate()).toBe(10);
    });

    it('should have consecutive dates', () => {
      const result = getWeekDates('2024-06-10');
      for (let i = 0; i < 6; i++) {
        const diff = result[i + 1].getDate() - result[i].getDate();
        // Handle month boundary
        expect(diff === 1 || diff < 0).toBe(true);
      }
    });

    it('should handle Date object input', () => {
      const result = getWeekDates(new Date('2024-06-10'));
      expect(result).toHaveLength(7);
    });
  });

  describe('tomorrow', () => {
    it('should return date 1 day from now', () => {
      const result = tomorrow();
      const expected = new Date(fixedDate);
      expected.setDate(expected.getDate() + 1);
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should return start of day', () => {
      const result = tomorrow();
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('yesterday', () => {
    it('should return date 1 day ago', () => {
      const result = yesterday();
      const expected = new Date(fixedDate);
      expected.setDate(expected.getDate() - 1);
      expect(result.getDate()).toBe(expected.getDate());
    });

    it('should return start of day', () => {
      const result = yesterday();
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });
});
