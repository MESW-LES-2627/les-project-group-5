import { defineConfig } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

// Architecture rule enforced automatically (see CLAUDE.md):
// the domain package uses no outside library and no browser API.
// Later steps add rules for the adapters, ApiClient and the server.

const browserGlobals = ['window', 'document', 'navigator', 'fetch', 'localStorage', 'AudioContext', 'OfflineAudioContext'];

const webAudioOnlyInSynth = ['AudioContext', 'OfflineAudioContext'].map((name) => ({
  name,
  message: 'Only WebAudioSynth may use the Web Audio API. Use the Synth interface.',
}));

const serverHttpFiles = ['packages/server/src/**/*Controller.ts', 'packages/server/src/app.ts'];
const serverDatabaseFiles = ['packages/server/src/**/Postgres*.ts', 'packages/server/src/shared/database/**/*.ts'];
const serverEmailFiles = ['packages/server/src/shared/email/SmtpEmailSender.ts'];
const noFastify = {
  group: ['fastify', '@fastify/*'],
  message: 'Only controllers (and app.ts) may use Fastify. Services and repositories must not know about HTTP.',
};
const noDatabase = {
  group: ['pg', '@supabase/*'],
  message: 'Only Postgres adapters (Postgres*.ts) and shared/database may use the database driver. Depend on an interface instead.',
};
const noEmailLibrary = {
  group: ['nodemailer'],
  message: 'Only SmtpEmailSender may use nodemailer. Depend on the EmailSender interface instead.',
};

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'packages/web/public/**',
      'docs/code-doc/**',
      '.vercel/**',
      'api/**',
    ],
  },
  tseslint.configs.recommended,
  // Code style: one consistent look for everyone. Almost all of these fix themselves with "npx eslint . --fix".
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    commaDangle: 'always-multiline',
    braceStyle: '1tbs',
    arrowParens: true, // Always "(x) => ...", so adding a second parameter or a type needs no extra edit.
  }),
  {
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }], // "It's" may use double quotes instead of escaping.
      '@stylistic/max-len': ['warn', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
      // A wrapped line starts with "&&", "+", "?"... so it is easy to scan. "=" stays at the end of the line.
      '@stylistic/operator-linebreak': ['error', 'before', { overrides: { '=': 'after', '+=': 'after', '-=': 'after' } }],
      '@stylistic/quote-props': ['error', 'as-needed'], // Quote object keys only when needed ('C#': ..., but C: ...).
      // Arrays are skipped so short lists like note names may share lines: ['C', 'C#', 'D', ...].
      '@stylistic/list-style': ['error', { overrides: { '[]': 'off' } }],
    },
  },
  {
    rules: {
      // Parameters starting with "_" may be unused (useful for interface methods not implemented yet).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Bug catchers.
      eqeqeq: ['error', 'always'], // "==" silently converts types ("0" == 0).
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Leftover debug logs; real errors may still be logged.
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error', // "${x}" inside normal quotes is almost always a mistake.
      'no-unreachable-loop': 'error',

      // Readability (the team keeps code small and simple, see CLAUDE.md).
      curly: ['error', 'multi-line'], // Braces required when the body spans more than one line.
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'no-else-return': 'error',
      complexity: ['warn', 10], // Too many branches: split the function.
      'max-depth': ['warn', 3], // Deep nesting is hard to follow: return early or extract a function.
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }], // Keep files (and classes) small.

      // TypeScript.
      '@typescript-eslint/consistent-type-imports': 'error', // "import type" makes it clear nothing runs at import time.
      '@typescript-eslint/no-non-null-assertion': 'warn', // "x!" hides possible null bugs.
    },
  },
  // Tests may be long, log freely and use "x!" on values they just set up.
  {
    files: ['**/*.test.ts'],
    rules: { 'max-lines': 'off', 'no-console': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  // These files print to the terminal on purpose.
  {
    files: ['scripts/**', 'packages/server/src/shared/email/ConsoleEmailSender.ts'],
    rules: { 'no-console': 'off' },
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
            { group: ['pg', '@supabase/*'], message: 'The domain must not use the database. Use a repository interface.' },
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
  // Server: only controllers (and app.ts) use Fastify, only Postgres adapters use the database driver,
  // only SmtpEmailSender uses nodemailer.
  // The four blocks below cover separate files on purpose: in ESLint, a later block with the same rule
  // replaces the earlier one instead of adding to it.
  {
    files: ['packages/server/src/**/*.ts'],
    ignores: [...serverHttpFiles, ...serverDatabaseFiles, ...serverEmailFiles, 'packages/server/src/**/*.test.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noFastify, noDatabase, noEmailLibrary] }] },
  },
  {
    files: serverHttpFiles,
    rules: { 'no-restricted-imports': ['error', { patterns: [noDatabase, noEmailLibrary] }] },
  },
  {
    files: serverDatabaseFiles,
    rules: { 'no-restricted-imports': ['error', { patterns: [noFastify, noEmailLibrary] }] },
  },
  {
    files: serverEmailFiles,
    rules: { 'no-restricted-imports': ['error', { patterns: [noFastify, noDatabase] }] },
  },
);
