#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { projectRoot } from './load-mobile-env.mjs';

const defaultAabPath = join(
  projectRoot,
  'android/app/build/outputs/bundle/release/app-release.aab',
);

const defaultApkPath = join(
  projectRoot,
  'android/app/build/outputs/apk/release/app-release.apk',
);

const artifactArg = process.argv[2];
const artifact =
  artifactArg ??
  (existsSync(defaultAabPath) ? defaultAabPath : defaultApkPath);

if (!existsSync(artifact)) {
  console.error(
    'No release artifact found. Build first:\n  bun run build:aab\n  bun run build:apk',
  );
  console.error('\nUsage: node scripts/verify-signature.mjs [path-to-aab-or-apk]');
  process.exit(1);
}

if (artifact.endsWith('.aab')) {
  const result = spawnSync('keytool', ['-printcert', '-jarfile', artifact], {
    stdio: 'inherit',
    cwd: projectRoot,
  });
  process.exit(result.status ?? 1);
}

const result =
  process.platform === 'win32'
    ? spawnSync(
        'cmd.exe',
        ['/d', '/s', '/c', 'apksigner', 'verify', '--verbose', artifact],
        { stdio: 'inherit', cwd: projectRoot },
      )
    : spawnSync('apksigner', ['verify', '--verbose', artifact], {
        stdio: 'inherit',
        cwd: projectRoot,
      });

if (result.error) {
  console.error(
    'Failed to run apksigner. Install Android SDK build-tools and ensure apksigner is on PATH.',
  );
  process.exit(1);
}

process.exit(result.status ?? 0);
