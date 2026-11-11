import type { FastifyInstance, FastifyReply } from 'fastify';
import type { SessionService } from './SessionService';

/** The cookie that carries the session token. */
export const SESSION_COOKIE = 'session';

interface LogInBody {
  email: string;
  password: string;
}

/**
 * The HTTP routes for logging in and out. It turns the service's session token into a cookie:
 * - HttpOnly: the page's JavaScript can't read it, so a script injected into the page can't steal it;
 * - SameSite=Lax: other sites can't make the browser use it in their requests;
 * - Secure (when the app runs on https): it only travels encrypted;
 * - Path=/api: it is only sent to the server's routes, not with the page's files.
 */
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    private readonly secureCookies: boolean,
  ) {}

  register(app: FastifyInstance): void {
    // POST /api/sessions: log in (US-E1-04).
    app.post<{ Body: LogInBody }>(
      '/api/sessions',
      {
        schema: {
          body: {
            type: 'object',
            properties: {
              email: { type: 'string', maxLength: 1000 },
              password: { type: 'string', maxLength: 1000 },
            },
            required: ['email', 'password'],
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const result = await this.sessions.logIn(request.body.email, request.body.password);
        if (result.outcome === 'invalid') return reply.code(401).send({ error: 'invalid-credentials' });
        if (result.outcome === 'not-confirmed') return reply.code(403).send({ error: 'email-not-confirmed' });
        reply.setCookie(SESSION_COOKIE, result.token, { ...this.cookieOptions(), expires: result.expiresAt });
        return reply.code(200).send({ email: result.email });
      },
    );

    // GET /api/session: who is logged in. 401 without a valid session (US-E1-05).
    app.get('/api/session', async (request, reply) => {
      const user = await this.sessions.currentUser(request.cookies[SESSION_COOKIE]);
      if (!user) return reply.code(401).send({ error: 'not-logged-in' });
      return reply.code(200).send({ email: user.email });
    });

    // DELETE /api/session: log out on this device only (US-E1-05).
    app.delete('/api/session', async (request, reply) => {
      await this.sessions.logOut(request.cookies[SESSION_COOKIE]);
      this.clearCookie(reply);
      return reply.code(204).send();
    });
  }

  private cookieOptions() {
    return { httpOnly: true, sameSite: 'lax', secure: this.secureCookies, path: '/api' } as const;
  }

  private clearCookie(reply: FastifyReply): void {
    reply.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }
}
