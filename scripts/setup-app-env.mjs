import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const mergeMissing = args.has('--merge-missing');

const targets = [
  {
    label: 'apps/server/.env',
    examplePath: join(projectRoot, 'apps/server/.env.example'),
    envPath: join(projectRoot, 'apps/server/.env'),
    prepare: withDevAuthSecret,
  },
  {
    label: 'apps/native/.env',
    examplePath: join(projectRoot, 'apps/native/.env.example'),
    envPath: join(projectRoot, 'apps/native/.env'),
    prepare: (content) => content,
  },
];

function withDevAuthSecret(content) {
  if (!/^BETTER_AUTH_SECRET=/m.test(content)) {
    return content;
  }
  const secret = randomBytes(32).toString('base64url');
  return content.replace(/^BETTER_AUTH_SECRET=.*$/m, `BETTER_AUTH_SECRET=${secret}`);
}

function parseEnvKeys(content) {
  const keys = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    keys.add(trimmed.slice(0, separatorIndex).trim());
  }
  return keys;
}

function parseEnvLines(content) {
  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    entries.push({ key: trimmed.slice(0, separatorIndex).trim(), line });
  }
  return entries;
}

async function promptYesNo(question) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) => {
    readline.question(question, (value) => {
      readline.close();
      resolve(value.trim().toLowerCase());
    });
  });
  return answer === 'y' || answer === 'yes';
}

async function writeFresh(target) {
  const exampleContent = readFileSync(target.examplePath, 'utf8');
  writeFileSync(target.envPath, target.prepare(exampleContent), 'utf8');
}

async function main() {
  for (const target of targets) {
    if (!existsSync(target.examplePath)) {
      console.error(`${target.label}.example is missing.`);
      process.exit(1);
    }

    if (!existsSync(target.envPath)) {
      await writeFresh(target);
      console.log(`Created ${target.label} from .env.example`);
      continue;
    }

    if (force) {
      const confirmed = await promptYesNo(`Overwrite entire ${target.label} from .env.example? (y/N) `);
      if (!confirmed) {
        console.log(`Skipped ${target.label} overwrite.`);
        continue;
      }
      await writeFresh(target);
      console.log(`Replaced ${target.label} from .env.example`);
      continue;
    }

    if (mergeMissing) {
      const exampleContent = readFileSync(target.examplePath, 'utf8');
      const existingContent = readFileSync(target.envPath, 'utf8');
      const existingKeys = parseEnvKeys(existingContent);
      const toAppend = parseEnvLines(exampleContent).filter(({ key }) => !existingKeys.has(key));
      if (toAppend.length === 0) {
        console.log(`${target.label} already contains all keys from .env.example`);
        continue;
      }
      const prepared = target.prepare(
        toAppend.map(({ line }) => line).join('\n') + '\n',
      );
      const suffix =
        (existingContent.endsWith('\n') ? '' : '\n') +
        '\n# Added by setup:app-env --merge-missing\n' +
        prepared;
      writeFileSync(target.envPath, existingContent + suffix, 'utf8');
      console.log(`Appended ${toAppend.length} missing key(s) to ${target.label}`);
      continue;
    }

    console.log(`${target.label} exists — skipped. Use --merge-missing or --force to change.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
