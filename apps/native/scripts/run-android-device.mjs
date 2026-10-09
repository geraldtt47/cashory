#!/usr/bin/env node

import { existsSync } from 'node:fs';

import { runExpo } from './expo-cli.mjs';
import {
  loadMobileEnvLocal,
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

runExpo(['prebuild', '--platform', 'android']);
runExpo(['run:android', '--device', '--variant', 'release', '--no-bundler']);
console.log(`✅ Release ${signingMode} version installed on device`);
