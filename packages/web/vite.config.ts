import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Forward API calls to the server, so the browser sees one address for both (simpler cookies, no CORS).
    // API_URL is set by compose.yaml, where the server runs in another container.
    proxy: {
      '/api': process.env.API_URL ?? 'http://127.0.0.1:3000',
    },
     // Lets the ngrok host names through, to test on a phone over HTTPS (see "Testing on a phone" in the README).
     allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'],
  }
});
