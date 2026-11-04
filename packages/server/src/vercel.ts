import { buildApp } from './app';

// Composition root of the server on Vercel (main.ts is the one for development).
// On Vercel the server does not listen on a port: Vercel runs this as a serverless function,
// hands it each /api request (see the rewrite in vercel.json) and we pass it to Fastify's router.
// The app is built once per function instance, not once per request, so warm requests are fast.
const app = buildApp();
const ready = app.ready();

type NodeRequest = Parameters<typeof app.routing>[0];
type NodeResponse = Parameters<typeof app.routing>[1];

export default async function handler(request: NodeRequest, response: NodeResponse): Promise<void> {
  await ready;
  app.routing(request, response);
}
