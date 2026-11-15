import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { fakeAccountDependencies } from './features/accounts/testDoubles';

// App-wide behaviour only. Each feature tests its own routes next to its controller.
const app = buildApp({ logger: false, database: { isOnline: async () => true }, ...fakeAccountDependencies() });
afterAll(() => app.close());

describe('buildApp', () => {
  it('answers 404 for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/nothing-here' });
    expect(response.statusCode).toBe(404);
  });
});
