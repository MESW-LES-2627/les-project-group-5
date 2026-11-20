import cookie from '@fastify/cookie';
import Fastify, { type FastifyInstance } from 'fastify';
import { AccountController } from './features/accounts/AccountController';
import type { AccountService } from './features/accounts/AccountService';
import { SessionController } from './features/accounts/SessionController';
import type { SessionService } from './features/accounts/SessionService';
import { HealthController } from './features/health/HealthController';
import type { DatabaseStatus } from './features/health/DatabaseStatus';

export interface AppDependencies {
  logger: boolean;
  database: DatabaseStatus;
  accounts: AccountService;
  sessions: SessionService;
  /** True when the app runs on https: the session cookie is then only sent encrypted. */
  secureCookies: boolean;
}

/** Builds the server with every feature's routes, without starting it. Tests use it directly, with no network. */
export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify({ logger: dependencies.logger });
  // Reads the Cookie header of each request into request.cookies, and lets routes set cookies.
  app.register(cookie);
  new HealthController(dependencies.database).register(app);
  new AccountController(dependencies.accounts).register(app);
  new SessionController(dependencies.sessions, dependencies.secureCookies).register(app);
  return app;
}
