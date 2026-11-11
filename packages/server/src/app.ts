import Fastify, { type FastifyInstance } from 'fastify';
import { AccountController } from './features/accounts/AccountController';
import type { AccountService } from './features/accounts/AccountService';
import { HealthController } from './features/health/HealthController';
import type { DatabaseStatus } from './features/health/DatabaseStatus';

export interface AppDependencies {
  logger: boolean;
  database: DatabaseStatus;
  accounts: AccountService;
}

/** Builds the server with every feature's routes, without starting it. Tests use it directly, with no network. */
export function buildApp(dependencies: AppDependencies): FastifyInstance {
  const app = Fastify({ logger: dependencies.logger });
  new HealthController(dependencies.database).register(app);
  new AccountController(dependencies.accounts).register(app);
  return app;
}
