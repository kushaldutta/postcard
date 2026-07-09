const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Redirect whatwg-fetch to a native-fetch shim so Supabase auth doesn't use
// the XHR-based browser polyfill in React Native.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'whatwg-fetch': require.resolve('./shims/whatwg-fetch.js'),
};

module.exports = config;
