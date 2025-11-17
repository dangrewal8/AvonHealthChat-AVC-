/**
 * Test Helpers and Utilities
 *
 * Shared utilities for testing across unit, integration, and API tests.
 *
 * Tech Stack: Jest + TypeScript
 */

import { Request, Response } from 'express';
import { Artifact } from '../../src/types/artifact.types';

/**
 * Mock Request Factory
 *
 * Creates a mock Express Request object for testing.
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides,
  };
}

/**
 * Mock Response Factory
 *
 * Creates a mock Express Response object for testing.
 */
export function createMockResponse(): Partial<Response> & {
  json: jest.Mock;
  status: jest.Mock;
  send: jest.Mock;
  setHeader: jest.Mock;
} {
  const res: any = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Test Artifact Factory
 *
 * Creates test artifacts with sensible defaults.
 */
export function createTestArtifact(overrides: Partial<Artifact> = {}): Artifact {
  const defaults: Artifact = {
    id: `test-artifact-${Date.now()}`,
    type: 'note',
    patient_id: 'test-patient-123',
    text: 'Test artifact content for testing purposes.',
    occurred_at: new Date().toISOString(),
    source: 'https://test-api.example.com/artifacts/test',
    title: 'Test Artifact',
    author: 'Dr. Test',
    meta: {
      note_type: 'progress',
      condition: 'General checkup',
    },
  };

  return { ...defaults, ...overrides };
}

/**
 * Test Artifact List Factory
 *
 * Creates a list of test artifacts with variety.
 */
export function createTestArtifactList(count: number, patientId: string): Artifact[] {
  const types: Array<'note' | 'medication' | 'care_plan'> = [
    'note',
    'medication',
    'care_plan',
  ];

  return Array.from({ length: count }, (_, index) => {
    const type = types[index % types.length];
    const baseDate = new Date('2024-01-01');
    const artifactDate = new Date(
      baseDate.getTime() + index * 24 * 60 * 60 * 1000
    );

    return createTestArtifact({
      id: `test-artifact-${patientId}-${index + 1}`,
      type,
      patient_id: patientId,
      occurred_at: artifactDate.toISOString(),
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${index + 1}`,
      text: `Test ${type} content for artifact ${index + 1}`,
    });
  });
}

/**
 * Test Query Request Factory
 *
 * Creates a mock query request body with sensible defaults.
 */
export function createTestQueryRequest(
  overrides: {
    query?: string;
    patient_id?: string;
    options?: {
      detail_level?: number;
      max_results?: number;
    };
  } = {}
) {
  return {
    query: overrides.query || 'What medications is the patient taking?',
    patient_id: overrides.patient_id || 'test-patient-123',
    options: {
      detail_level: 3,
      max_results: 5,
      ...overrides.options,
    },
  };
}

/**
 * Test Query Response Factory
 *
 * Creates a mock query response with sensible defaults.
 */
export function createTestQueryResponse(overrides: any = {}) {
  return {
    query_id: `query-${Date.now()}`,
    short_answer: 'The patient is taking Metformin 500mg twice daily.',
    detailed_summary:
      'Patient is currently on Metformin 500mg BID for diabetes management.',
    provenance: [
      {
        artifact_id: 'artifact-001',
        snippet: 'Metformin 500mg twice daily',
        score: 0.95,
      },
    ],
    confidence: 0.92,
    metadata: {
      detail_level: 3,
      processing_time_ms: 150,
      total_artifacts_searched: 50,
      timestamp: new Date().toISOString(),
    },
    ...overrides,
  };
}

/**
 * Assertion Helpers
 */
export const testHelpers = {
  /**
   * Assert that a response has required query fields
   */
  assertValidQueryResponse(response: any) {
    expect(response.query_id).toBeDefined();
    expect(typeof response.query_id).toBe('string');
    expect(response.short_answer).toBeDefined();
    expect(typeof response.short_answer).toBe('string');
    expect(response.detailed_summary).toBeDefined();
    expect(response.provenance).toBeDefined();
    expect(Array.isArray(response.provenance)).toBe(true);
    expect(response.confidence).toBeDefined();
    expect(typeof response.confidence).toBe('number');
    expect(response.metadata).toBeDefined();
  },

  /**
   * Assert that a provenance entry is valid
   */
  assertValidProvenance(provenance: any) {
    expect(provenance.artifact_id).toBeDefined();
    expect(typeof provenance.artifact_id).toBe('string');
    expect(provenance.snippet).toBeDefined();
    expect(typeof provenance.snippet).toBe('string');
    expect(provenance.score).toBeDefined();
    expect(typeof provenance.score).toBe('number');
    expect(provenance.score).toBeGreaterThanOrEqual(0);
    expect(provenance.score).toBeLessThanOrEqual(1);
  },

  /**
   * Assert that an artifact is valid
   */
  assertValidArtifact(artifact: any) {
    expect(artifact.id).toBeDefined();
    expect(typeof artifact.id).toBe('string');
    expect(artifact.type).toBeDefined();
    expect(['note', 'medication', 'care_plan']).toContain(artifact.type);
    expect(artifact.patient_id).toBeDefined();
    expect(typeof artifact.patient_id).toBe('string');
    expect(artifact.text).toBeDefined();
    expect(typeof artifact.text).toBe('string');
    expect(artifact.occurred_at).toBeDefined();
    expect(artifact.source).toBeDefined();
  },

  /**
   * Assert that a date string is valid ISO format
   */
  assertValidISODate(dateString: string) {
    expect(typeof dateString).toBe('string');
    const date = new Date(dateString);
    expect(date.toString()).not.toBe('Invalid Date');
    expect(date.toISOString()).toBe(dateString);
  },

  /**
   * Assert that a value is within a range
   */
  assertInRange(value: number, min: number, max: number) {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  },

  /**
   * Assert that an error response is properly formatted
   */
  assertValidErrorResponse(response: any, expectedStatus: number) {
    expect(response.error).toBeDefined();
    expect(typeof response.error).toBe('string');
    expect(response.status).toBe(expectedStatus);
  },
};

/**
 * Test Data Constants
 */
export const TEST_CONSTANTS = {
  PATIENT_IDS: {
    VALID: 'test-patient-123',
    VALID_2: 'test-patient-456',
    INVALID: 'invalid-patient-xyz',
  },
  QUERIES: {
    MEDICATIONS: 'What medications is the patient taking?',
    ALLERGIES: 'Does the patient have any allergies?',
    RECENT_VISITS: 'When was the patient last seen?',
    DIAGNOSIS: 'What is the patient diagnosis?',
  },
  DETAIL_LEVELS: [1, 2, 3],
  DEFAULT_TIMEOUT: 10000,
  API_BASE_URL: 'https://test-api.example.com',
};

/**
 * Async Test Helpers
 */
export const asyncHelpers = {
  /**
   * Wait for a condition to be true
   */
  async waitFor(
    condition: () => boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (!condition()) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('waitFor timeout exceeded');
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  },

  /**
   * Delay execution
   */
  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

/**
 * Test Setup Helpers
 */
export const setupHelpers = {
  /**
   * Create a test environment with common mocks
   */
  createTestEnvironment() {
    return {
      mockRequest: createMockRequest(),
      mockResponse: createMockResponse(),
      testArtifacts: createTestArtifactList(10, TEST_CONSTANTS.PATIENT_IDS.VALID),
    };
  },

  /**
   * Reset all mocks between tests
   */
  resetMocks() {
    jest.clearAllMocks();
    jest.resetAllMocks();
  },
};
