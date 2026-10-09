import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPostgresSettings } from './docker-infra-urls.mjs';
import { upsertEnvVar } from './env-upsert.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function syncServerDatabaseUrl(root = projectRoot) {
  const { url } = readPostgresSettings(root);
  const serverEnvPath = join(root, 'apps/server/.env');
  const result = upsertEnvVar(
    serverEnvPath,
    'DATABASE_URL',
    url,
    '# Synced from root .env Postgres settings (docker:infra:up)',
  );
  return { url, result };
}
