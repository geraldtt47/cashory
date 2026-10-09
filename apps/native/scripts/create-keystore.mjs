#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import {
  projectRoot,
  readCredentialsExample,
  resolveKeystorePath,
} from './load-mobile-env.mjs';

const PROJECT_SLUG = 'Cashory-Demo';
const forceOverwrite = process.argv.includes('--force');

const credentialsExample = readCredentialsExample();
const keystorePath = resolveKeystorePath(credentialsExample);
const keyAlias = credentialsExample.android.keyAlias;

async function confirmForceOverwrite() {
  const rl = readline.createInterface({ input, output });
  try {
    console.warn(
      '\nWARNING: Overwriting the release keystore breaks Play Store updates for the same app signing key.',
    );
    console.warn(`Type "${PROJECT_SLUG}" to confirm overwrite:\n`);
    const answer = await rl.question('> ');
    if (answer.trim() !== PROJECT_SLUG) {
      console.error('Aborted — confirmation text did not match.');
      process.exit(1);
    }
  } finally {
    rl.close();
  }
}

async function main() {
  if (existsSync(keystorePath) && !forceOverwrite) {
    console.error(`Keystore already exists: ${keystorePath}`);
    console.error('Use --force to overwrite (requires typing the project slug).');
    process.exit(1);
  }

  if (existsSync(keystorePath) && forceOverwrite) {
    await confirmForceOverwrite();
  }

  mkdirSync(dirname(keystorePath), { recursive: true });

  const distinguishedName =
    'CN=Cashory Demo, OU=Mobile, O=Cashory Demo, L=Unknown, ST=Unknown, C=US';

  const result = spawnSync(
    'keytool',
    [
      '-genkeypair',
      '-v',
      '-storetype',
      'PKCS12',
      '-keystore',
      keystorePath,
      '-alias',
      keyAlias,
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-dname',
      distinguishedName,
    ],
    { stdio: 'inherit', cwd: projectRoot },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  console.log('\nKeystore created:');
  console.log(`  ${keystorePath}`);
  console.log(`  alias: ${keyAlias}`);
  console.log('\nIMPORTANT:');
  console.log(
    '  1. Add ANDROID_KEYSTORE_PASSWORD and ANDROID_KEY_PASSWORD to .env.local',
  );
  console.log('  2. Set ANDROID_KEY_ALIAS=upload in .env.local (or rely on default)');
  console.log('  3. Back up the keystore file and passwords off this machine.');
  console.log('  4. Build: bun run build:aab (from apps/native) or bun run mobile:build:aab');
  console.log('\nSee docs/mobile-release-signing.md for the full workflow.');
}

void main();
