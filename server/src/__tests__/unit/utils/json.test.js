/**
 * Unit tests for JSON utilities
 */
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  safeJsonParse,
  parseIngredients,
  parseInstructions,
  safeJsonStringify
} from '../../../utils/json.js';

describe('JSON Utilities', () => {
  // Suppress console.warn for clean test output
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON string', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse JSON array', () => {
      const json = '["item1", "item2", "item3"]';
      const result = safeJsonParse(json);
      expect(result).toEqual(['item1', 'item2', 'item3']);
    });

    it('should return fallback for invalid JSON', () => {
      const result = safeJsonParse('invalid json', 'fallback');
      expect(result).toBe('fallback');
    });

    it('should return null as default fallback', () => {
      const result = safeJsonParse('invalid json');
      expect(result).toBeNull();
    });

    it('should return fallback for null input', () => {
      const result = safeJsonParse(null, 'default');
      expect(result).toBe('default');
    });

    it('should return fallback for undefined input', () => {
      const result = safeJsonParse(undefined, 'default');
      expect(result).toBe('default');
    });

    it('should return non-string input as-is', () => {
      const obj = { test: true };
      const result = safeJsonParse(obj, 'fallback');
      expect(result).toBe(obj);
    });

    it('should return array input as-is', () => {
      const arr = [1, 2, 3];
      const result = safeJsonParse(arr);
      expect(result).toBe(arr);
    });

    it('should return number input as-is', () => {
      expect(safeJsonParse(123)).toBe(123);
    });

    it('should log warning for invalid JSON', () => {
      safeJsonParse('invalid');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to parse JSON:',
        expect.any(String)
      );
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('', 'default');
      expect(result).toBe('default');
    });

    it('should handle nested JSON', () => {
      const json = '{"outer": {"inner": [1, 2, 3]}}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ outer: { inner: [1, 2, 3] } });
    });
  });

  describe('parseIngredients', () => {
    it('should return empty array for null input', () => {
      expect(parseIngredients(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(parseIngredients(undefined)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseIngredients('')).toEqual([]);
    });

    it('should return array input as-is', () => {
      const ingredients = ['salt', 'pepper', 'onion'];
      const result = parseIngredients(ingredients);
      expect(result).toEqual(ingredients);
    });

    it('should parse JSON string array', () => {
      const json = '["salt", "pepper", "onion"]';
      const result = parseIngredients(json);
      expect(result).toEqual(['salt', 'pepper', 'onion']);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseIngredients('invalid json');
      expect(result).toEqual([]);
    });

    it('should return empty array if parsed value is not array', () => {
      const result = parseIngredients('{"key": "value"}');
      expect(result).toEqual([]);
    });

    it('should handle complex ingredient objects', () => {
      const json = '[{"name": "salt", "quantity": "1 tsp"}, {"name": "pepper", "quantity": "0.5 tsp"}]';
      const result = parseIngredients(json);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'salt');
    });
  });

  describe('parseInstructions', () => {
    it('should return empty array for null input', () => {
      expect(parseInstructions(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(parseInstructions(undefined)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseInstructions('')).toEqual([]);
    });

    it('should return array input as-is', () => {
      const instructions = ['Step 1', 'Step 2', 'Step 3'];
      const result = parseInstructions(instructions);
      expect(result).toEqual(instructions);
    });

    it('should parse JSON string array', () => {
      const json = '["Step 1: Prep", "Step 2: Cook", "Step 3: Serve"]';
      const result = parseInstructions(json);
      expect(result).toEqual(['Step 1: Prep', 'Step 2: Cook', 'Step 3: Serve']);
    });

    it('should return empty array for invalid JSON', () => {
      const result = parseInstructions('invalid json');
      expect(result).toEqual([]);
    });

    it('should return empty array if parsed value is not array', () => {
      const result = parseInstructions('"just a string"');
      expect(result).toEqual([]);
    });

    it('should handle numbered step objects', () => {
      const json = '[{"step": 1, "text": "Prep"}, {"step": 2, "text": "Cook"}]';
      const result = parseInstructions(json);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('step', 1);
    });
  });

  describe('safeJsonStringify', () => {
    it('should stringify object', () => {
      const obj = { name: 'test', value: 123 };
      const result = safeJsonStringify(obj);
      expect(result).toBe('{"name":"test","value":123}');
    });

    it('should stringify array', () => {
      const arr = [1, 2, 3];
      const result = safeJsonStringify(arr);
      expect(result).toBe('[1,2,3]');
    });

    it('should stringify string', () => {
      const result = safeJsonStringify('hello');
      expect(result).toBe('"hello"');
    });

    it('should stringify number', () => {
      const result = safeJsonStringify(42);
      expect(result).toBe('42');
    });

    it('should stringify boolean', () => {
      expect(safeJsonStringify(true)).toBe('true');
      expect(safeJsonStringify(false)).toBe('false');
    });

    it('should stringify null', () => {
      const result = safeJsonStringify(null);
      expect(result).toBe('null');
    });

    it('should return fallback for circular reference', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Circular reference
      const result = safeJsonStringify(obj, 'error');
      expect(result).toBe('error');
    });

    it('should return default fallback {} for errors', () => {
      const obj = { name: 'test' };
      obj.self = obj;
      const result = safeJsonStringify(obj);
      expect(result).toBe('{}');
    });

    it('should handle nested objects', () => {
      const obj = { outer: { inner: { deep: 'value' } } };
      const result = safeJsonStringify(obj);
      expect(JSON.parse(result)).toEqual(obj);
    });

    it('should handle undefined values in objects', () => {
      const obj = { name: 'test', undef: undefined };
      const result = safeJsonStringify(obj);
      // JSON.stringify skips undefined values
      expect(result).toBe('{"name":"test"}');
    });
  });
});
