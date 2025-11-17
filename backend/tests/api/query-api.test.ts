/**
 * API Tests: Query Endpoints
 *
 * End-to-end API tests using supertest.
 *
 * Tech Stack: Jest + Supertest + TypeScript
 */

import request from 'supertest';
import express from 'express';
import { createRouter } from '../../src/routes/index';

// Create test app
const app = express();
app.use(express.json());
app.use(createRouter());

describe('POST /api/query', () => {
  it('should return 200 for valid query', async () => {
    const response = await request(app)
      .post('/api/query')
      .send({
        query: 'What medications is the patient taking?',
        patient_id: 'test-patient-123',
        options: { detail_level: 3 },
      })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.query_id).toBeDefined();
    expect(response.body.short_answer).toBeDefined();
  });

  it('should return error for missing query', async () => {
    const response = await request(app)
      .post('/api/query')
      .send({
        patient_id: 'test-patient',
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should return error for missing patient_id', async () => {
    const response = await request(app)
      .post('/api/query')
      .send({
        query: 'Test query',
      })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should handle different detail levels', async () => {
    const response = await request(app)
      .post('/api/query')
      .send({
        query: 'Test query',
        patient_id: 'test-patient',
        options: { detail_level: 1 },
      })
      .expect(200);

    expect(response.body.metadata.detail_level).toBe(1);
  });
});

describe('POST /api/query/stream', () => {
  it('should stream query response', async () => {
    const response = await request(app)
      .post('/api/query/stream')
      .send({
        query: 'Test streaming query',
        patient_id: 'test-patient',
      })
      .expect(200);

    expect(response.headers['content-type']).toContain('text/event-stream');
  });
});

describe('GET /api/queries/recent', () => {
  it('should return recent queries', async () => {
    const response = await request(app)
      .get('/api/queries/recent')
      .query({ patient_id: 'test-patient', limit: 10 })
      .expect(200);

    expect(response.body.queries).toBeDefined();
    expect(Array.isArray(response.body.queries)).toBe(true);
  });

  it('should return error for missing patient_id', async () => {
    await request(app)
      .get('/api/queries/recent')
      .expect(400);
  });
});

describe('GET /health', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBeDefined();
  });
});
