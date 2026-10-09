import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

const result = spawnSync(process.execPath, [join(scriptsDir, 'run-android-release.mjs'), 'aab'], {
  stdio: 'inherit',
  cwd: join(scriptsDir, '..'),
});

process.exit(result.status ?? 1);
