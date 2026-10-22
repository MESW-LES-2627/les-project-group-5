import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Forward API calls to the server, so the browser sees one address for both (simpler cookies, no CORS).
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    }
  }
});
