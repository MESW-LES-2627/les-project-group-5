import { describe, expect, it } from 'vitest';
import { ApiClient } from './ApiClient';

/** A fake fetch that always gives the same answer, so no server is needed. */
function answering(status: number, body: unknown): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe('ApiClient.isServerOnline', () => {
  it('is true when the health check answers ok', async () => {
    expect(await new ApiClient(answering(200, { status: 'ok' })).isServerOnline()).toBe(true);
  });

  it('is false when the server answers with an error', async () => {
    expect(await new ApiClient(answering(502, { status: 'ok' })).isServerOnline()).toBe(false);
  });

  it('is false when the answer is not the expected one', async () => {
    expect(await new ApiClient(answering(200, { hello: 'world' })).isServerOnline()).toBe(false);
  });

  it('is false when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).isServerOnline()).toBe(false);
  });
});
