#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { runExpo } from './expo-cli.mjs';
import { loadMobileEnvLocal, projectRoot } from './load-mobile-env.mjs';

const androidDir = join(projectRoot, 'android');
const isWindows = process.platform === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';

const platform = process.argv[2];
if (platform && platform !== 'android' && platform !== 'ios') {
  console.error('Usage: node scripts/prebuild-clean.mjs [android|ios]');
  process.exit(1);
}

function runGradleStop() {
  const gradlewPath = join(androidDir, gradlew);
  if (!existsSync(gradlewPath)) {
    return;
  }

  console.log('Stopping Gradle daemon...');
  const result = isWindows
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', gradlew, '--stop'], {
        cwd: androidDir,
        stdio: 'inherit',
      })
    : spawnSync(gradlew, ['--stop'], {
        cwd: androidDir,
        stdio: 'inherit',
      });

  if (result.status !== 0) {
    // Best-effort; locked files are the main concern on clean prebuild.
  }
}

loadMobileEnvLocal();

const prebuildArgs = ['prebuild', '--clean'];
if (platform === 'android') {
  prebuildArgs.push('--platform', 'android');
} else if (platform === 'ios') {
  prebuildArgs.push('--platform', 'ios');
}

if (!platform || platform === 'android') {
  runGradleStop();
}

runExpo(prebuildArgs);
