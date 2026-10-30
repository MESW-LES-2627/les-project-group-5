import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Architecture rule enforced automatically (see CLAUDE.md):
// the domain package uses no outside library and no browser API.
// Later steps add rules for the adapters, ApiClient and the server.

const browserGlobals = ['window', 'document', 'navigator', 'fetch', 'localStorage', 'AudioContext', 'OfflineAudioContext'];

const webAudioOnlyInSynth = ['AudioContext', 'OfflineAudioContext'].map((name) => ({
  name,
  message: 'Only WebAudioSynth may use the Web Audio API. Use the Synth interface.',
}));

export default defineConfig(
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'packages/web/public/**', '.vercel/**', 'api/**'],
  },
  tseslint.configs.recommended,
  {
    rules: {
      // Parameters starting with "_" may be unused (useful for interface methods not implemented yet).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@mediapipe/*'], message: 'The domain must not use MediaPipe. Use the HandTracker interface in the web package.' },
            { group: ['fastify', '@fastify/*'], message: 'The domain must not use Fastify. HTTP belongs to the server controllers.' },
            { group: ['better-sqlite3', 'sqlite3'], message: 'The domain must not use the database. Use a repository interface.' },
            { group: ['@instrument/web', '@instrument/server', '**/web/**', '**/server/**'], message: 'The domain must not depend on the web or server packages.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...browserGlobals.map((name) => ({ name, message: 'The domain must not use browser APIs. Put this in an adapter in the web package.' })),
      ],
    },
  },
  // Web Audio only in WebAudioSynth.
  {
    files: ['packages/web/src/**/*.ts'],
    ignores: ['packages/web/src/audio/WebAudioSynth.ts'],
    rules: { 'no-restricted-globals': ['error', ...webAudioOnlyInSynth] },
  },
  {
    files: ['packages/web/src/**/*.ts'],
    ignores: ['packages/web/src/tracking/MediaPipeHandTracker.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@mediapipe/*'], message: 'Only MediaPipeHandTracker may import MediaPipe. Use the HandTracker interface.' }] },
      ],
    },
  },
  {
    files: ['packages/server/src/**/*.ts'],
    ignores: ['packages/server/src/controllers/**', 'packages/server/src/app.ts', 'packages/server/src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['fastify', '@fastify/*'], message: 'Only controllers (and app.ts) may use Fastify. Services and repositories must not know about HTTP.' }] },
      ],
    },
  },
);
