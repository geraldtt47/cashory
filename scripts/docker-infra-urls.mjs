import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const postgresDefaults = {
  POSTGRES_USER: 'postgres',
  POSTGRES_PASSWORD: 'postgres',
  POSTGRES_DB: 'cashory',
  POSTGRES_HOST_PORT: '5433',
};

export const mailpitUiUrl = 'http://127.0.0.1:8026';
export const drizzleStudioUrl = 'https://local.drizzle.studio';
export const apiUrl = 'http://127.0.0.1:3000';

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
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
    values[key] = value;
  }
  return values;
}

function pick(env, key) {
  const value = env[key];
  if (value === undefined || value === '') {
    return postgresDefaults[key];
  }
  return value;
}

/** First likely Wi-Fi/LAN IPv4 (skips loopback; prefers 192.168.x / 10.x). */
export function detectLanIPv4() {
  const candidates = [];
  for (const iface of Object.values(networkInterfaces())) {
    if (!iface) {
      continue;
    }
    for (const net of iface) {
      const isIPv4 = net.family === 'IPv4' || net.family === 4;
      if (!isIPv4 || net.internal) {
        continue;
      }
      candidates.push(net.address);
    }
  }
  const preferred = candidates.find(
    (ip) => ip.startsWith('192.168.') || ip.startsWith('10.'),
  );
  return preferred ?? candidates[0] ?? null;
}

export function readPostgresSettings(root = projectRoot) {
  const env = readEnvFile(join(root, '.env'));
  const user = pick(env, 'POSTGRES_USER');
  const password = pick(env, 'POSTGRES_PASSWORD');
  const database = pick(env, 'POSTGRES_DB');
  const port = pick(env, 'POSTGRES_HOST_PORT');
  const host = '127.0.0.1';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
  return { user, password, database, port, host, url };
}

/** OSC 8 hyperlink. The visible text is the URL so it can still be copied. */
export function terminalLink(url) {
  if (!/^https?:\/\//i.test(url)) {
    return url;
  }
  return `\u001B]8;;${url}\u001B\\${url}\u001B]8;;\u001B\\`;
}

function line(label, value) {
  console.log(`  ${label.padEnd(18)}${value}`);
}

function continuation(text) {
  console.log(`${' '.repeat(20)}${text}`);
}

function field(label, value) {
  continuation(`${label.padEnd(11)}${value}`);
}

export function printDevAccessSummary(root = projectRoot) {
  const postgres = readPostgresSettings(root);

  console.log('\nLocal development\n');
  line('Mailpit inbox', terminalLink(mailpitUiUrl));
  continuation('Login: none — open the link\n');
  console.log('  Postgres');
  field('Host:', postgres.host);
  field('Port:', postgres.port);
  field('Database:', postgres.database);
  field('User:', postgres.user);
  field('Password:', postgres.password);
  field('URL:', postgres.url);
  console.log('');
  line('Database UI', 'bun run db:studio');
  continuation(terminalLink(drizzleStudioUrl));
  continuation('Login: none — uses the Postgres URL above\n');
  line('API (this PC)', terminalLink(apiUrl));
  continuation('Available after: bun run dev\n');
  const lanIp = detectLanIPv4();
  if (lanIp) {
    const deviceApiUrl = `http://${lanIp}:3000`;
    line('API (phone)', terminalLink(deviceApiUrl));
    continuation(
      `Set apps/native/.env EXPO_PUBLIC_SERVER_URL=${deviceApiUrl}`,
    );
    continuation('Test on device browser: /api/auth/get-session\n');
  }
  console.log('Next: bun run dev');
}
