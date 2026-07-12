import { spawn } from 'node:child_process';

const shell = process.platform === 'win32';
const children = [];

function run(command, args, env = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell,
    env: { ...process.env, ...env }
  });
  children.push(child);
  child.on('exit', (code) => {
    if (code && code !== 0) shutdown(code);
  });
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 100).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('node', ['--watch', 'server.js'], { PORT: process.env.API_PORT || '8787' });
run('npx', ['vite', '--host', '0.0.0.0']);
