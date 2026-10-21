// Copies the MediaPipe WASM files from node_modules into the web app's public folder,
// so the browser can load them locally. Runs automatically after `npm install`.
// The copied folder is in .gitignore: it is recreated on every install.
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const target = join(root, 'packages', 'web', 'public', 'mediapipe', 'wasm');

if (!existsSync(source)) {
  console.error(`MediaPipe WASM files not found at ${source}. Run "npm install" from the project root.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log(`Copied MediaPipe WASM files to ${target}`);
