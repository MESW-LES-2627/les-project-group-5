import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Forward API calls to the server, so the browser sees one address for both (simpler cookies, no CORS).
    // API_URL is set by compose.yaml, where the server runs in another container.
    proxy: {
      '/api': process.env.API_URL ?? 'http://127.0.0.1:3000',
    }
  }
});
