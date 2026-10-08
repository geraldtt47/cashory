const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const {
  resolveAllWorkspacePackageJsonPaths,
} = require("@expo/metro-config/build/getWatchFolders");
const { withUniwindConfig } = require("uniwind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// EXPO_NO_METRO_WORKSPACE_ROOT keeps Gradle release entry paths valid; restore monorepo resolution.
const workspacePackages = resolveAllWorkspacePackageJsonPaths(monorepoRoot);
config.watchFolders = [
  path.join(monorepoRoot, "node_modules"),
  ...workspacePackages.map((pkgJson) => path.dirname(pkgJson)),
];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(monorepoRoot, "node_modules"),
];
config.resolver.unstable_enablePackageExports = true;

const uniwindConfig = withUniwindConfig(wrapWithReanimatedMetroConfig(config), {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});

module.exports = uniwindConfig;
