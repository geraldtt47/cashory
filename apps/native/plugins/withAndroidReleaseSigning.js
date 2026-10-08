const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

const RELEASE_SIGNING_MARKER = '// @generated mobile-release-signing';
const RELEASE_SIGNING_MODES = new Set(['test', 'prod']);

/** Injects the selected Android release signing mode during prebuild. */
function withAndroidReleaseSigning(config, options = {}) {
  const signingMode = options.signingMode ?? 'prod';
  if (!RELEASE_SIGNING_MODES.has(signingMode)) {
    throw new Error(`Invalid Android release signing mode: ${signingMode}`);
  }

  const keystoreRelativePath =
    options.keystoreRelativePath ?? '../credentials/release.keystore';
  const keyAlias = options.keyAlias ?? 'upload';
  const storePassword = options.storePassword ?? '';
  const keyPassword = options.keyPassword ?? storePassword;

  if (signingMode === 'prod' && !storePassword) {
    console.warn(
      '[withAndroidReleaseSigning] ANDROID_KEYSTORE_PASSWORD is unset — release builds will fail until .env.local is configured.',
    );
  }

  config = withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = gradleConfig.modResults.filter(
      (item) =>
        item.type !== 'property' || !item.key.startsWith('MYAPP_UPLOAD_'),
    );

    if (signingMode === 'test') {
      return gradleConfig;
    }

    const properties = [
      ['MYAPP_UPLOAD_STORE_FILE', keystoreRelativePath],
      ['MYAPP_UPLOAD_KEY_ALIAS', keyAlias],
      ['MYAPP_UPLOAD_STORE_PASSWORD', storePassword],
      ['MYAPP_UPLOAD_KEY_PASSWORD', keyPassword],
    ];

    for (const [key, value] of properties) {
      gradleConfig.modResults.push({ type: 'property', key, value });
    }

    return gradleConfig;
  });

  config = withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      return gradleConfig;
    }

    let contents = gradleConfig.modResults.contents;
    contents = contents.replace(
      /\n\/\/ @generated mobile-release-signing[\s\S]*?\/\/ @end mobile-release-signing\n/g,
      '\n',
    );

    const signingBlock = signingMode === 'prod' ? `
${RELEASE_SIGNING_MARKER}
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
        // @end mobile-release-signing` : '';

      if (signingMode === 'prod' && contents.includes('signingConfigs {')) {
      contents = contents.replace(
        /signingConfigs\s*\{/,
        `signingConfigs {${signingBlock}`,
      );
    }

    const releaseSigningConfig =
      signingMode === 'test' ? 'debug' : 'release';
    const releaseSigningPattern =
      /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.\w+/;

    if (releaseSigningPattern.test(contents)) {
      contents = contents.replace(
        releaseSigningPattern,
        `$1signingConfig signingConfigs.${releaseSigningConfig}`,
      );
    } else if (/buildTypes\s*\{[\s\S]*?\brelease\s*\{/.test(contents)) {
      contents = contents.replace(
        /(buildTypes\s*\{[\s\S]*?\brelease\s*\{)/,
        `$1\n            signingConfig signingConfigs.${releaseSigningConfig}`,
      );
    } else {
      throw new Error('Could not find the Android release build type to sign.');
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });

  return config;
}

module.exports = withAndroidReleaseSigning;
