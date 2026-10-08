#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  loadMobileEnvLocal,
  projectRoot,
  readCredentialsExample,
  resolveKeystorePath,
} from './load-mobile-env.mjs';

const signingMode = process.argv[2];

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!['test', 'prod'].includes(signingMode)) {
  fail('Usage: bun run android:release:<test|prod>');
}

loadMobileEnvLocal();

process.env.EXPO_NO_METRO_WORKSPACE_ROOT =
  process.env.EXPO_NO_METRO_WORKSPACE_ROOT ?? '1';

if (signingMode === 'prod') {
  const credentialsExample = readCredentialsExample();
  const keystorePath = resolveKeystorePath(credentialsExample);
  const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD?.trim();
  const keyPassword = process.env.ANDROID_KEY_PASSWORD?.trim() || storePassword;

  if (!existsSync(keystorePath)) {
    fail(
      `Release keystore missing at ${credentialsExample.android.keystoreFile}\nPlace the keystore there or run: bun run keystore:create`,
    );
  }

  if (!storePassword) {
    fail('ANDROID_KEYSTORE_PASSWORD is not set in .env.local');
  }

  if (!keyPassword) {
    fail('ANDROID_KEY_PASSWORD is not set in .env.local');
  }

  process.env.ANDROID_KEY_ALIAS =
    process.env.ANDROID_KEY_ALIAS?.trim() ||
    credentialsExample.android.keyAlias;
}

process.env.ANDROID_RELEASE_SIGNING_MODE = signingMode;

function resolveExpoCli() {
  const require = createRequire(join(projectRoot, 'package.json'));
  try {
    return require.resolve('expo/bin/cli');
  } catch {
    fail(
      'Could not resolve expo CLI. Run `bun install` from the repo root.',
    );
  }
}

const expoCli = resolveExpoCli();

function runExpo(args) {
  console.log(`Running expo ${args.join(' ')}...`);
  const result = spawnSync(process.execPath, [expoCli, ...args], {
    stdio: 'inherit',
    cwd: projectRoot,
    env: process.env,
  });

  if (result.error) {
    fail(`Failed to run expo: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runExpo(['prebuild', '--platform', 'android']);
runExpo(['run:android', '--device', '--variant', 'release', '--no-bundler']);
console.log(`✅ Release ${signingMode} version installed on device`);
