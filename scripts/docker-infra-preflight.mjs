import { createConnection } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPostgresSettings } from './docker-infra-urls.mjs';
import { upsertEnvVar } from './env-upsert.mjs';
import { runCommand } from './run-command.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_DOCKER_HOST_PORT = '5433';

function probeTcp(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port: Number(port) });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function postgresDatabaseExists(url) {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    return { ok: false, reason: 'pg module not available' };
  }

  const client = new pg.default.Client({ connectionString: url });
  try {
    await client.connect();
    const settings = readPostgresSettings(projectRoot);
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      settings.database,
    ]);
    return { ok: result.rowCount > 0 };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  } finally {
    await client.end().catch(() => {});
  }
}

function dockerPostgresHasCashoryDb() {
  const settings = readPostgresSettings(projectRoot);
  const result = runCommand(
    'docker',
    [
      'exec',
      'cashory-postgres',
      'psql',
      '-U',
      settings.user,
      '-d',
      settings.database,
      '-tAc',
      'SELECT 1',
    ],
    { cwd: projectRoot, stdio: 'pipe' },
  );
  return result.status === 0 && result.stdout?.toString().trim() === '1';
}

function applyHostPort(root, port) {
  const envPath = join(root, '.env');
  upsertEnvVar(envPath, 'POSTGRES_HOST_PORT', port);
  const next = readPostgresSettings(root);
  upsertEnvVar(envPath, 'DATABASE_URL', next.url);
  return next;
}

/**
 * Ensure host DATABASE_URL reaches the Docker Postgres (cashory DB).
 * When 5432 is taken by another local Postgres, switch to 5433 and recreate the mapping.
 */
export async function ensureDockerPostgresOnHost(root = projectRoot) {
  let settings = readPostgresSettings(root);
  let check = await postgresDatabaseExists(settings.url);

  if (check.ok) {
    return settings;
  }

  const dockerOk = dockerPostgresHasCashoryDb();
  if (!dockerOk) {
    console.error(
      'Postgres preflight failed: could not reach the cashory database at',
      settings.url,
    );
    if (check.reason) {
      console.error(`  ${check.reason}`);
    }
    process.exit(1);
  }

  if (settings.port === '5432') {
    console.log(
      'Host port 5432 is not the Docker Cashory database (often a local PostgreSQL install).',
    );
    console.log(`Switching Docker Postgres to host port ${DEFAULT_DOCKER_HOST_PORT}...`);
    settings = applyHostPort(root, DEFAULT_DOCKER_HOST_PORT);
    const recreate = runCommand(
      'bun',
      ['run', 'docker:compose', '--', 'up', '-d', '--wait', 'postgres'],
      { cwd: root, stdio: 'inherit' },
    );
    if (recreate.status !== 0) {
      process.exit(recreate.status ?? 1);
    }
    check = await postgresDatabaseExists(settings.url);
  }

  if (!check.ok) {
    const reachable = await probeTcp(settings.host, settings.port);
    console.error(
      'Postgres preflight failed: cashory database is not reachable at',
      settings.url,
    );
    if (check.reason) {
      console.error(`  ${check.reason}`);
    }
    if (!reachable) {
      console.error(
        `  Nothing is listening on ${settings.host}:${settings.port}. Check Docker Desktop and POSTGRES_HOST_PORT in .env.`,
      );
    }
    process.exit(1);
  }

  return settings;
}
