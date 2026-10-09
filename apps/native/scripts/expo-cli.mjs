import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { projectRoot } from './load-mobile-env.mjs';

export function applyMonorepoExpoEnv(env = process.env) {
  if (env.EXPO_NO_METRO_WORKSPACE_ROOT === undefined) {
    env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
  }
  return env;
}

export function resolveExpoCli() {
  const require = createRequire(join(projectRoot, 'package.json'));
  return require.resolve('expo/bin/cli');
}

/**
 * @param {string[]} args
 * @param {{ env?: NodeJS.ProcessEnv, log?: boolean }} [options]
 */
export function runExpo(args, options = {}) {
  const { env = process.env, log = true } = options;
  applyMonorepoExpoEnv(env);

  let expoCli;
  try {
    expoCli = resolveExpoCli();
  } catch {
    console.error('Could not resolve expo CLI. Run `bun install` from the repo root.');
    process.exit(1);
  }

  if (log) {
    console.log(`Running expo ${args.join(' ')}...`);
  }

  const result = spawnSync(process.execPath, [expoCli, ...args], {
    stdio: 'inherit',
    cwd: projectRoot,
    env,
  });

  if (result.error) {
    console.error(`Failed to run expo: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
