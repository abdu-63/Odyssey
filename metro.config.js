const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support des fichiers .cjs (requis par certains modules comme h3-js)
config.resolver.sourceExts.push('cjs');

module.exports = config;
