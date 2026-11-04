import { buildApp } from './app';
import { readConfig } from './config/env';
import { PostgresDatabaseStatus } from './features/health/PostgresDatabaseStatus';
import { createDatabasePool } from './shared/database/createDatabasePool';

// Composition root of the server: reads the configuration, creates the objects and starts listening.
// New features are wired here too: repositories → services → controllers (passed into buildApp).
// In development, Vite forwards every /api request from the browser to this port (see packages/web/vite.config.ts).
const PORT = 3000;

const config = readConfig();
const pool = createDatabasePool(config);

const app = buildApp({ logger: true, database: new PostgresDatabaseStatus(pool) });
// Close the database connections when the server stops, so Ctrl+C ends cleanly.
app.addHook('onClose', () => pool.end());
await app.listen({ port: PORT, host: '127.0.0.1' });
