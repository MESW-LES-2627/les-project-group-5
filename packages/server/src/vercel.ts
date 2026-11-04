import { buildApp } from './app';
import { readConfig } from './config/env';
import { PostgresDatabaseStatus } from './features/health/PostgresDatabaseStatus';
import { createDatabasePool } from './shared/database/createDatabasePool';

// Composition root of the server on Vercel (main.ts is the one for development).
// On Vercel the server does not listen on a port: Vercel runs this as a serverless function,
// hands it each /api request (see the rewrite in vercel.json) and we pass it to Fastify's router.
// The app is built once per function instance, not once per request, so warm requests are fast.
// DATABASE_URL comes from the Vercel project's environment variables (there is no .env file there).
const config = readConfig();
const pool = createDatabasePool(config);

const app = buildApp({ logger: true, database: new PostgresDatabaseStatus(pool) });
const ready = app.ready();

type NodeRequest = Parameters<typeof app.routing>[0];
type NodeResponse = Parameters<typeof app.routing>[1];

export default async function handler(request: NodeRequest, response: NodeResponse): Promise<void> {
  await ready;
  app.routing(request, response);
}
