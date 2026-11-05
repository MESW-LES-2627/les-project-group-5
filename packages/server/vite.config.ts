import { defineConfig } from 'vite';

// Bundles the server into one file for Vercel: `npm run build:api` writes api/index.js at the repository root,
// where Vercel looks for serverless functions. Bundling is needed because our code (and the domain package)
// imports files without extensions, which Vite understands but plain Node.js on Vercel does not.
// Outside libraries (Fastify) stay in node_modules: Vercel finds and uploads them itself.
export default defineConfig({
  build: {
    ssr: 'src/vercel.ts',
    outDir: '../../api',
    emptyOutDir: true,
    rollupOptions: {
      output: { entryFileNames: 'index.js' },
    },
  },
});
