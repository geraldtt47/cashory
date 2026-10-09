# Mobile release signing (Android)

Expo native project under [`apps/native`](../apps/native/). Release signing is configured in [`app.config.js`](../apps/native/app.config.js) via the [`withAndroidReleaseSigning`](../apps/native/plugins/withAndroidReleaseSigning.js) config plugin.

## Files and secrets

| Path | Purpose |
| --- | --- |
| [`apps/native/.env.local`](../apps/native/.env.example) | `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, optional `ANDROID_KEY_ALIAS` (not committed; see `.gitignore`) |
| [`apps/native/credentials/`](../apps/native/credentials.example.json) | Release keystore at `credentials/release.keystore` (gitignored) |
| [`apps/native/credentials.example.json`](../apps/native/credentials.example.json) | Keystore path and default alias (`upload`) |

Copy signing hints from [`apps/native/.env.example`](../apps/native/.env.example) into `.env.local` when you create a keystore.

## Prerequisites

- **JDK** with `keytool` on PATH (keystore creation and AAB certificate inspection).
- **Android SDK** with `apksigner` on PATH (APK signature verification).
- Physical device or emulator for dev builds; store artifacts are built on the host.

## Regenerate native projects (prebuild)

| Command (repo root) | Command (`apps/native`) | Effect |
| --- | --- | --- |
| `bun run mobile:prebuild:android` | `bun run prebuild:android` | `expo prebuild --platform android` |
| `bun run mobile:prebuild:android:clean` | `bun run prebuild:android:clean` | Stop Gradle daemon, then `expo prebuild --clean --platform android` |

Use **clean** prebuild when config plugins change, `android/` drifts from Expo, or Gradle file locks appear on Windows.

iOS equivalents: `mobile:prebuild:ios` and `mobile:prebuild:ios:clean`.

## Release keystore

From the repo root:

```bash
bun run mobile:keystore:create
```

Or from `apps/native`:

```bash
bun run keystore:create
```

`keytool` prompts for a keystore password interactively. Store that password (and key password, if different) in `apps/native/.env.local`:

```env
ANDROID_KEYSTORE_PASSWORD=your-password
ANDROID_KEY_PASSWORD=your-password
ANDROID_KEY_ALIAS=upload
```

Back up the keystore and passwords off this machine. Losing the upload key complicates Play Store updates.

To overwrite an existing keystore: `bun run keystore:create --force` (requires typing the app slug `Cashory-Demo`).

## Install a release build on a device

Debug-style release signing (test):

```bash
bun run mobile:android:release:test
```

Production keystore signing (requires `.env.local` and keystore file):

```bash
bun run mobile:android:release
```

These run `expo prebuild` for Android, then `expo run:android --device --variant release`.

## Store artifacts (AAB / APK)

Production signing only:

```bash
bun run mobile:build:aab
bun run mobile:build:apk
```

Outputs (under `apps/native`):

- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

## Verify signature

After a release build:

```bash
bun run mobile:verify:signature
```

Optional path argument:

```bash
cd apps/native && bun run verify:signature -- path/to/app-release.apk
```

AABs are checked with `keytool -printcert -jarfile`. APKs use `apksigner verify`.

## Monorepo note

Scripts set `EXPO_NO_METRO_WORKSPACE_ROOT=1` so Gradle release paths stay under `apps/native`. Workspace packages are resolved via [`metro.config.js`](../apps/native/metro.config.js).
