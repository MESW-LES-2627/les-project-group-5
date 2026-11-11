import { buildApp } from './app';
import { readConfig } from './config/env';
import { createDependencies } from './createDependencies';

// Composition root of the server on Vercel (main.ts is the one for development).
// On Vercel the server does not listen on a port: Vercel runs this as a serverless function,
// hands it each /api request (see the rewrite in vercel.json) and we pass it to Fastify's router.
// The app is built once per function instance, not once per request, so warm requests are fast.
// DATABASE_URL and APP_BASE_URL come from the Vercel project's environment variables (there is no .env file there).
// Without APP_BASE_URL (preview deploys), email links use VERCEL_URL, the address Vercel gives each deploy.
const vercelUrl = process.env.VERCEL_URL;
const config = readConfig(vercelUrl ? `https://${vercelUrl}` : undefined);
const { dependencies } = createDependencies(config);

const app = buildApp({ logger: true, ...dependencies });
const ready = app.ready();

type NodeRequest = Parameters<typeof app.routing>[0];
type NodeResponse = Parameters<typeof app.routing>[1];

export default async function handler(request: NodeRequest, response: NodeResponse): Promise<void> {
  await ready;
  app.routing(request, response);
}
