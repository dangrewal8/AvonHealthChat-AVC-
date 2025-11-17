/**
 * Integration Tests: Query Controller
 *
 * Tests for end-to-end query processing.
 *
 * Tech Stack: Jest + TypeScript
 */

import { queryController } from '../../src/controllers/query.controller';

describe('Query Controller Integration Tests', () => {
  describe('search', () => {
    it('should process a query and return valid response', async () => {
      const mockReq = {
        body: {
          query: 'What medications is the patient taking?',
          patient_id: 'test-patient-123',
          options: { detail_level: 3, max_results: 5 },
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      await queryController.search(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];

      expect(response.query_id).toBeDefined();
      expect(response.short_answer).toBeDefined();
      expect(response.detailed_summary).toBeDefined();
      expect(response.provenance).toBeDefined();
      expect(Array.isArray(response.provenance)).toBe(true);
      expect(response.confidence).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should handle different detail levels', async () => {
      const levels = [1, 2, 3];

      for (const level of levels) {
        const mockReq = {
          body: {
            query: 'Test query',
            patient_id: 'test-patient',
            options: { detail_level: level },
          },
        } as any;

        const mockRes = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        } as any;

        await queryController.search(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response.metadata.detail_level).toBe(level);
      }
    });

    it('should handle errors gracefully', async () => {
      const mockReq = {
        body: null, // This will cause an error
      } as any;

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      await queryController.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('getRecent', () => {
    it('should return recent queries', () => {
      const mockReq = {
        query: {
          patient_id: 'test-patient',
          limit: '10',
        },
      } as any;

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any;

      queryController.getRecent(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalled();
      const response = mockRes.json.mock.calls[0][0];

      expect(response.queries).toBeDefined();
      expect(Array.isArray(response.queries)).toBe(true);
      expect(response.total_count).toBeDefined();
    });
  });
});
