/**
 * Test Setup Configuration
 *
 * Global setup file for Jest tests. This file runs once before all test suites.
 * Configure global test behavior, mocks, and environment setup here.
 *
 * Tech Stack: Jest + TypeScript
 */

/**
 * Increase test timeout for integration tests
 */
jest.setTimeout(10000);

/**
 * Mock console methods to reduce noise during tests
 * Uncomment if you want to suppress console output during tests
 */
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

/**
 * Setup environment variables for testing
 */
process.env.NODE_ENV = 'test';
process.env.API_URL = 'https://test-api.example.com';

/**
 * Global test utilities
 */
global.testUtils = {
  /**
   * Get current timestamp for test data
   */
  getTestTimestamp(): string {
    return new Date().toISOString();
  },

  /**
   * Generate random test ID
   */
  generateTestId(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

/**
 * Custom Jest matchers
 */
expect.extend({
  /**
   * Matcher to check if a value is a valid ISO date string
   */
  toBeValidISODate(received: any) {
    const pass = typeof received === 'string' && !isNaN(Date.parse(received));

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      };
    }
  },

  /**
   * Matcher to check if a value is within a range
   */
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;

    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  /**
   * Matcher to check if object has required query response fields
   */
  toBeValidQueryResponse(received: any) {
    const requiredFields = [
      'query_id',
      'short_answer',
      'detailed_summary',
      'provenance',
      'confidence',
      'metadata',
    ];

    const missingFields = requiredFields.filter((field) => !(field in received));

    if (missingFields.length === 0) {
      return {
        message: () => `expected object not to be a valid query response`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected object to be a valid query response, missing fields: ${missingFields.join(', ')}`,
        pass: false,
      };
    }
  },
});

/**
 * TypeScript declarations for custom matchers
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidISODate(): R;
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeValidQueryResponse(): R;
    }
  }

  var testUtils: {
    getTestTimestamp(): string;
    generateTestId(prefix?: string): string;
  };
}

/**
 * Cleanup after all tests
 */
afterAll(() => {
  // Add any global cleanup here
});
