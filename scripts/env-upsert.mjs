import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Replace KEY=value or append it. Preserves other lines and comments.
 */
export function upsertEnvVar(envPath, key, value, commentLine) {
  const line = `${key}=${value}`;
  if (!existsSync(envPath)) {
    const header = commentLine ? `${commentLine}\n` : '';
    writeFileSync(envPath, `${header}${line}\n`, 'utf8');
    return 'created';
  }

  const content = readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const keyPrefix = `${key}=`;
  let replaced = false;
  const out = lines.map((original) => {
    const trimmed = original.trim();
    if (trimmed.startsWith(keyPrefix)) {
      replaced = true;
      return line;
    }
    return original;
  });

  if (replaced) {
    writeFileSync(envPath, out.join('\n').replace(/\n?$/, '\n'), 'utf8');
    return 'updated';
  }

  const suffix =
    (content.endsWith('\n') ? '' : '\n') +
    (commentLine ? `\n${commentLine}\n` : '\n') +
    `${line}\n`;
  writeFileSync(envPath, content + suffix, 'utf8');
  return 'appended';
}
