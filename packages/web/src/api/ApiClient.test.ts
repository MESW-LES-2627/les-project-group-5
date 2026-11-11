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

describe('ApiClient.signUp', () => {
  it('sends the email and password as JSON to POST /api/accounts', async () => {
    let request: { url: string; init?: RequestInit } | undefined;
    const recording: typeof fetch = async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ status: 'check-your-email' }), { status: 202 });
    };
    await new ApiClient(recording).signUp('ana@mail.com', 'a long enough password');
    expect(request?.url).toBe('/api/accounts');
    expect(request?.init?.method).toBe('POST');
    expect(JSON.parse(String(request?.init?.body))).toEqual({ email: 'ana@mail.com', password: 'a long enough password' });
  });

  it('reports "sent" when the server accepts the sign-up', async () => {
    const api = new ApiClient(answering(202, { status: 'check-your-email' }));
    expect(await api.signUp('ana@mail.com', 'a long enough password')).toEqual({ kind: 'sent' });
  });

  it('reports the rejected fields', async () => {
    const api = new ApiClient(answering(400, { errors: { email: 'invalid-format', password: 'too-short' } }));
    expect(await api.signUp('nope', 'short')).toEqual({
      kind: 'rejected',
      errors: { email: 'invalid-format', password: 'too-short' },
    });
  });

  it('reports "failed" for a 400 without field errors', async () => {
    const api = new ApiClient(answering(400, { message: 'body must have required property' }));
    expect(await api.signUp('ana@mail.com', 'a long enough password')).toEqual({ kind: 'failed' });
  });

  it('reports "failed" when the server has a problem', async () => {
    const api = new ApiClient(answering(500, {}));
    expect(await api.signUp('ana@mail.com', 'a long enough password')).toEqual({ kind: 'failed' });
  });

  it('reports "failed" when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).signUp('ana@mail.com', 'a long enough password')).toEqual({ kind: 'failed' });
  });
});

describe('ApiClient.confirmEmail', () => {
  it('sends the token as JSON to POST /api/email-confirmations', async () => {
    let request: { url: string; init?: RequestInit } | undefined;
    const recording: typeof fetch = async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ status: 'confirmed' }), { status: 200 });
    };
    await new ApiClient(recording).confirmEmail('the-token');
    expect(request?.url).toBe('/api/email-confirmations');
    expect(request?.init?.method).toBe('POST');
    expect(JSON.parse(String(request?.init?.body))).toEqual({ token: 'the-token' });
  });

  it.each([
    [200, 'confirmed'],
    [410, 'expired'],
    [400, 'invalid'],
    [500, 'failed'],
  ] as const)('maps status %i to "%s"', async (status, answer) => {
    const api = new ApiClient(answering(status, {}));
    expect(await api.confirmEmail('the-token')).toBe(answer);
  });

  it('reports "failed" when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).confirmEmail('the-token')).toBe('failed');
  });
});

describe('ApiClient.logIn', () => {
  it('sends the email and password as JSON to POST /api/sessions', async () => {
    let request: { url: string; init?: RequestInit } | undefined;
    const recording: typeof fetch = async (input, init) => {
      request = { url: String(input), init };
      return new Response(JSON.stringify({ email: 'ana@mail.com' }), { status: 200 });
    };
    expect(await new ApiClient(recording).logIn('ana@mail.com', 'a long enough password')).toEqual({
      kind: 'logged-in',
      email: 'ana@mail.com',
    });
    expect(request?.url).toBe('/api/sessions');
    expect(request?.init?.method).toBe('POST');
  });

  it.each([
    [401, { kind: 'invalid' }],
    [403, { kind: 'not-confirmed' }],
    [500, { kind: 'failed' }],
  ] as const)('maps status %i', async (status, answer) => {
    expect(await new ApiClient(answering(status, {})).logIn('ana@mail.com', 'x')).toEqual(answer);
  });

  it('reports "failed" when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).logIn('ana@mail.com', 'x')).toEqual({ kind: 'failed' });
  });
});

describe('ApiClient.currentUser and logOut', () => {
  it('gives the email of the logged-in user', async () => {
    expect(await new ApiClient(answering(200, { email: 'ana@mail.com' })).currentUser()).toBe('ana@mail.com');
  });

  it('gives null for a guest (401)', async () => {
    expect(await new ApiClient(answering(401, { error: 'not-logged-in' })).currentUser()).toBeNull();
  });

  it('gives null when the server can not be reached', async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await new ApiClient(failing).currentUser()).toBeNull();
  });

  it('logs out with DELETE /api/session', async () => {
    let method: string | undefined;
    const recording: typeof fetch = async (_input, init) => {
      method = init?.method;
      return new Response(null, { status: 204 });
    };
    expect(await new ApiClient(recording).logOut()).toBe(true);
    expect(method).toBe('DELETE');
  });
});
