import { describe, expect, it } from 'vitest';
import { ApiClient } from './ApiClient';

/** A fake fetch that always gives the same answer, so no server is needed. */
function answering(status: number, body: unknown): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status });
}

describe('ApiClient.checkHealth', () => {
  it('reports server and database online when both answer', async () => {
    const api = new ApiClient(answering(200, { status: 'ok', database: 'online' }));
    expect(await api.checkHealth()).toEqual({ server: true, database: true });
  });

  it('reports the server online but the database offline', async () => {
    const api = new ApiClient(answering(200, { status: 'ok', database: 'offline' }));
    expect(await api.checkHealth()).toEqual({ server: true, database: false });
  });

  it('reports both offline when the server answers with an error', async () => {
    const api = new ApiClient(answering(502, { status: 'ok', database: 'online' }));
    expect(await api.checkHealth()).toEqual({ server: false, database: false });
  });

  it('reports both offline when the answer is not the expected one', async () => {
    const api = new ApiClient(answering(200, { hello: 'world' }));
    expect(await api.checkHealth()).toEqual({ server: false, database: false });
  });

  it('reports both offline when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).checkHealth()).toEqual({ server: false, database: false });
  });
});
