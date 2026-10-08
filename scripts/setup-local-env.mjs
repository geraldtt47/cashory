import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(projectRoot, '.env');
const examplePath = join(projectRoot, '.env.example');

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const mergeMissing = args.has('--merge-missing');

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

async function main() {
  if (!existsSync(examplePath)) {
    console.error('.env.example is missing.');
    process.exit(1);
  }

  const exampleContent = readFileSync(examplePath, 'utf8');

  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example');
    return;
  }

  if (force) {
    const confirmed = await promptYesNo('Overwrite entire .env from .env.example? (y/N) ');
    if (!confirmed) {
      console.log('Skipped .env overwrite.');
      return;
    }
    writeFileSync(envPath, exampleContent, 'utf8');
    console.log('Replaced .env from .env.example');
    return;
  }

  if (mergeMissing) {
    const existingContent = readFileSync(envPath, 'utf8');
    const existingKeys = parseEnvKeys(existingContent);
    const toAppend = parseEnvLines(exampleContent).filter(({ key }) => !existingKeys.has(key));
    if (toAppend.length === 0) {
      console.log('.env already contains all keys from .env.example');
      return;
    }
    const suffix =
      (existingContent.endsWith('\n') ? '' : '\n') +
      '\n# Added by setup:local-env --merge-missing\n' +
      toAppend.map(({ line }) => line).join('\n') +
      '\n';
    writeFileSync(envPath, existingContent + suffix, 'utf8');
    console.log(`Appended ${toAppend.length} missing key(s) to .env`);
    return;
  }

  console.log('.env exists — skipped. Use --merge-missing or --force to change.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
