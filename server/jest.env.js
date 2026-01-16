// Set environment variables BEFORE any modules are loaded
// This file runs before setupFilesAfterEnv
process.env.NODE_ENV = 'test';
process.env.APP_PIN = 'test1234';
process.env.OPENAI_API_KEY = 'test-api-key-for-testing';
