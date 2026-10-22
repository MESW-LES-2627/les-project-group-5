// Starts the server and the web app together for development (`npm run dev`).
// Each line of output is prefixed with [server] or [web]. Ctrl+C stops both.
import { spawn } from 'node:child_process';

const apps = [
  { name: 'server', workspace: '@instrument/server' },
  { name: 'web', workspace: '@instrument/web' },
];

const children = apps.map(({ name, workspace }) => {
  // shell: true lets this work on Windows too, where npm is "npm.cmd".
  const child = spawn(`npm run dev -w ${workspace}`, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
  const prefix = (chunk) =>
    chunk
      .toString()
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => `[${name}] ${line}`)
      .join('\n') + '\n';
  child.stdout.on('data', (chunk) => process.stdout.write(prefix(chunk)));
  child.stderr.on('data', (chunk) => process.stderr.write(prefix(chunk)));
  child.on('exit', (code) => {
    console.log(`[${name}] stopped${code ? ` (exit code ${code})` : ''}`);
    stopAll();
  });
  return child;
});

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
