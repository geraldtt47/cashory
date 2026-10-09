#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { runExpo } from './expo-cli.mjs';
import {
  loadMobileEnvLocal,
  projectRoot,
  readCredentialsExample,
  resolveKeystorePath,
} from './load-mobile-env.mjs';

const gradleTasks = {
  aab: 'bundleRelease',
  apk: 'assembleRelease',
};

const taskKey = process.argv[2];

if (!taskKey || !gradleTasks[taskKey]) {
  console.error('Usage: node scripts/run-android-release.mjs <aab|apk>');
  process.exit(1);
}

loadMobileEnvLocal();
process.env.ANDROID_RELEASE_SIGNING_MODE = 'prod';

const credentialsExample = readCredentialsExample();
const keystorePath = resolveKeystorePath(credentialsExample);
const keyAlias = process.env.ANDROID_KEY_ALIAS ?? credentialsExample.android.keyAlias;
const storePassword = process.env.ANDROID_KEYSTORE_PASSWORD?.trim();
const keyPassword = process.env.ANDROID_KEY_PASSWORD?.trim() ?? storePassword;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(keystorePath)) {
  fail(
    `Release keystore missing at ${credentialsExample.android.keystoreFile}\nRun: bun run keystore:create`,
  );
}

if (!storePassword) {
  fail('ANDROID_KEYSTORE_PASSWORD is not set in .env.local');
}

if (!keyPassword) {
  fail('ANDROID_KEY_PASSWORD is not set in .env.local');
}

const signingEnv = {
  ...process.env,
  ANDROID_KEY_ALIAS: keyAlias,
  ANDROID_KEYSTORE_PASSWORD: storePassword,
  ANDROID_KEY_PASSWORD: keyPassword,
};

runExpo(['prebuild', '--platform', 'android'], { env: signingEnv });

const androidDir = join(projectRoot, 'android');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleTask = gradleTasks[taskKey];

console.log(`Running ${gradleCommand} ${gradleTask}...`);
const gradle =
  process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', gradleCommand, gradleTask], {
        stdio: 'inherit',
        cwd: androidDir,
      })
    : spawnSync(gradleCommand, [gradleTask], {
        stdio: 'inherit',
        cwd: androidDir,
      });

if (gradle.status !== 0) {
  process.exit(gradle.status ?? 1);
}

if (taskKey === 'aab') {
  console.log(
    '\nAAB: android/app/build/outputs/bundle/release/app-release.aab',
  );
} else {
  console.log('\nAPK: android/app/build/outputs/apk/release/app-release.apk');
}
