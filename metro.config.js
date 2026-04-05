const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const exclusionList = require(path.join(
  __dirname,
  'node_modules',
  'metro-config',
  'src',
  'defaults',
  'exclusionList.js'
));
const createFileMapModulePath = path.join(
  __dirname,
  'node_modules',
  'metro',
  'src',
  'node-haste',
  'DependencyGraph',
  'createFileMap.js'
);
const createFileMapModule = require(createFileMapModulePath);

function escapePathForRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

function topLevelFolderPattern(folderName) {
  return new RegExp(`^${escapePathForRegex(path.join(repoRoot, folderName))}(?:\\\\|\\/).*`);
}

if (!createFileMapModule.__zamschoolWatchPatch) {
  const originalCreateFileMap = createFileMapModule.default;
  createFileMapModule.default = function patchedCreateFileMap(inputConfig, options) {
    // Metro watch mode times out in this Windows workspace. One-shot builds still bundle correctly.
    return originalCreateFileMap(inputConfig, {
      ...(options || {}),
      watch: false,
    });
  };
  createFileMapModule.__zamschoolWatchPatch = true;
}

const config = getDefaultConfig(__dirname);
config.resetCache = true;

config.resolver.blockList = exclusionList.default([
  topLevelFolderPattern('webapp'),
  topLevelFolderPattern('docs'),
  topLevelFolderPattern('dist'),
  topLevelFolderPattern('tools'),
  topLevelFolderPattern('.orchids'),
  topLevelFolderPattern('.worktrees'),
  topLevelFolderPattern('.qoder'),
  topLevelFolderPattern('.cursor'),
  new RegExp(`^${escapePathForRegex(repoRoot)}(?:\\\\|\\/).+\\.log$`),
  new RegExp(`^${escapePathForRegex(__dirname)}(?:\\\\|\\/).+\\.log$`),
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    return {
      filePath: path.resolve(__dirname, 'shims/ws.js'),
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
