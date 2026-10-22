import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';

const app = buildApp();
afterAll(() => app.close());

describe('GET /api/health', () => {
  it('answers 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('answers 404 for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/nothing-here' });
    expect(response.statusCode).toBe(404);
  });
});
