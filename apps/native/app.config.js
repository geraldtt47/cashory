const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const withAndroidReleaseSigning = require('./plugins/withAndroidReleaseSigning');

const projectRoot = __dirname;

function loadEnvLocal() {
  const envPath = join(projectRoot, '.env.local');
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const credentialsExample = JSON.parse(
  readFileSync(join(projectRoot, 'credentials.example.json'), 'utf8'),
);

const androidReleaseSigningMode =
  process.env.ANDROID_RELEASE_SIGNING_MODE ?? 'prod';
const keystoreRelativePath = '../credentials/release.keystore';
const keystoreAbsolutePath = join(
  projectRoot,
  credentialsExample.android.keystoreFile,
);

if (
  androidReleaseSigningMode === 'prod' &&
  !existsSync(keystoreAbsolutePath)
) {
  console.warn(
    `[app.config.js] Release keystore not found at ${credentialsExample.android.keystoreFile}. Place the keystore there or use: bun run android:release:test`,
  );
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    scheme: 'cashory-demo',
    userInterfaceStyle: 'automatic',
    orientation: 'default',
    web: {
      bundler: 'metro',
    },
    name: 'Cashory Demo',
    slug: 'Cashory-Demo',
    plugins: [
      'expo-font',
      'expo-image',
      'expo-router',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      'expo-sharing',
      [
        withAndroidReleaseSigning,
        {
          signingMode: androidReleaseSigningMode,
          keystoreRelativePath,
          keyAlias:
            process.env.ANDROID_KEY_ALIAS ?? credentialsExample.android.keyAlias,
          storePassword: process.env.ANDROID_KEYSTORE_PASSWORD ?? '',
          keyPassword:
            process.env.ANDROID_KEY_PASSWORD ??
            process.env.ANDROID_KEYSTORE_PASSWORD ??
            '',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    android: {
      package: 'com.anonymous.CashoryDemo',
    },
  },
};
