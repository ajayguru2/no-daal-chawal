// Global test setup
import { jest } from '@jest/globals';

// Suppress console logs during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
process.env.APP_PIN = 'test1234';
process.env.OPENAI_API_KEY = 'test-api-key-for-testing';

// Increase timeout for integration tests
jest.setTimeout(10000);
