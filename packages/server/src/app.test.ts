import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import type { DatabaseStatus } from './database/DatabaseStatus';

/** A database status that answers whatever the test chooses, so tests need no real database. */
function fakeDatabase(online: boolean): DatabaseStatus {
  return { isOnline: async () => online };
}

const onlineApp = buildApp({ logger: false, database: fakeDatabase(true) });
const offlineApp = buildApp({ logger: false, database: fakeDatabase(false) });
afterAll(async () => {
  await onlineApp.close();
  await offlineApp.close();
});

describe('GET /api/health', () => {
  it('answers 200 with status ok and database online', async () => {
    const response = await onlineApp.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'online' });
  });

  it('still answers status ok when the database is offline', async () => {
    const response = await offlineApp.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', database: 'offline' });
  });

  it('answers 404 for an unknown route', async () => {
    const response = await onlineApp.inject({ method: 'GET', url: '/api/nothing-here' });
    expect(response.statusCode).toBe(404);
  });
});
