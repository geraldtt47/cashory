import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './run-command.mjs';
import { printDevAccessSummary } from './docker-infra-urls.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  const result = runCommand(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('node', ['scripts/setup-local-env.mjs']);
run('node', ['scripts/setup-app-env.mjs']);
run('bun', ['run', 'docker:compose', '--', 'up', '-d', '--wait', 'postgres', 'mailpit']);
run('bun', ['run', 'db:push']);

console.log('Local infra is up.');
printDevAccessSummary();
