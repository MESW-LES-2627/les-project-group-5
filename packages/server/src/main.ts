import { buildApp } from './app';
import { readConfig } from './config/env';
import { createDependencies } from './createDependencies';

// Composition root of the server in development: reads the configuration, creates the objects and starts listening.
// In development, Vite forwards every /api request from the browser to this port (see packages/web/vite.config.ts).
const PORT = 3000;
// The Vite dev server, where the web app runs locally: email links point there unless APP_BASE_URL says otherwise.
const LOCAL_APP_URL = 'http://localhost:5173';

const config = readConfig(LOCAL_APP_URL);
const { dependencies, closeDatabase } = createDependencies(config);

const app = buildApp({ logger: true, ...dependencies });
// Close the database connections when the server stops, so Ctrl+C ends cleanly.
app.addHook('onClose', closeDatabase);
await app.listen({ port: PORT, host: '127.0.0.1' });
