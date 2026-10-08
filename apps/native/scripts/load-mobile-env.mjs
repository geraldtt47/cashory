import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Load `.env.local` into `process.env` (does not override existing vars). */
export function loadMobileEnvLocal() {
  const envPath = join(projectRoot, '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function readCredentialsExample() {
  const examplePath = join(projectRoot, 'credentials.example.json');
  const raw = readFileSync(examplePath, 'utf8');
  return JSON.parse(raw);
}

export function resolveKeystorePath(credentialsExample = readCredentialsExample()) {
  return join(projectRoot, credentialsExample.android.keystoreFile);
}

export { projectRoot };
