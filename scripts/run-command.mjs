import { spawnSync } from 'node:child_process';

function quoteForShell(argument) {
  if (!/[\s"]/u.test(argument)) {
    return argument;
  }
  return `"${argument.replace(/"/g, '\\"')}"`;
}

/** Cross-platform spawn: Unix uses argv; Windows uses one shell line (bun is a .cmd shim). */
export function runCommand(command, args, options = {}) {
  if (process.platform === 'win32') {
    const line = [command, ...args].map(quoteForShell).join(' ');
    return spawnSync(line, { shell: true, ...options });
  }

  return spawnSync(command, args, { shell: false, ...options });
}
