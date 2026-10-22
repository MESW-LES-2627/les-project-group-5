import { buildApp } from './app';

// Composition root of the server: creates the app and starts listening.
// In development, Vite forwards every /api request from the browser to this port (see packages/web/vite.config.ts).
const PORT = 3000;

const app = buildApp({ logger: true });
await app.listen({ port: PORT, host: '127.0.0.1' });
