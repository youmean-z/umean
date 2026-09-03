const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Resolve umean source + tentap/editor-web/build from the monorepo root.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Pin app copies so Metro does not pick up the library workspace React.
// Do NOT set disableHierarchicalLookup — Expo nests packages like
// @expo/log-box under expo/node_modules and needs hierarchical lookup.
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  '@10play/tentap-editor': path.resolve(
    projectRoot,
    'node_modules/@10play/tentap-editor',
  ),
};

module.exports = config;
