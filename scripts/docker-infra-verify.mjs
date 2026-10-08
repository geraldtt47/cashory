import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCommand } from './run-command.mjs';
import {
  mailpitUiUrl,
  printDevAccessSummary,
  readPostgresSettings,
} from './docker-infra-urls.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function runCompose(args, stdio = 'inherit') {
  return runCommand('bun', ['run', 'docker:compose', '--', ...args], {
    cwd: projectRoot,
    stdio,
  });
}

async function checkMailpit() {
  try {
    const response = await fetch(mailpitUiUrl, { redirect: 'follow' });
    if (response.status >= 200 && response.status < 400) {
      console.log(`OK   Mailpit UI (${response.status}) ${mailpitUiUrl}`);
      return true;
    }
    console.error(`FAIL Mailpit UI HTTP ${response.status} ${mailpitUiUrl}`);
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL Mailpit UI ${mailpitUiUrl} — ${message}`);
    return false;
  }
}

function checkPostgres() {
  const { user, database } = readPostgresSettings();
  const result = runCompose(['exec', '-T', 'postgres', 'pg_isready', '-U', user, '-d', database]);
  if (result.status === 0) {
    console.log(`OK   Postgres (${user}@127.0.0.1 database ${database})`);
    return true;
  }
  console.error('FAIL Postgres pg_isready');
  return false;
}

async function main() {
  console.log('Container status:\n');
  const ps = runCompose(['ps']);
  if (ps.status !== 0) {
    process.exit(ps.status ?? 1);
  }

  console.log('\nChecks:\n');
  const mailpitOk = await checkMailpit();
  const postgresOk = checkPostgres();
  if (!mailpitOk || !postgresOk) {
    console.error('\nOne or more services are not reachable.');
    console.error(`Mailpit inbox must be ${mailpitUiUrl}. See docs/local-infrastructure.md`);
    process.exit(1);
  }

  console.log('\nAll infra endpoints responded.');
  printDevAccessSummary();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
