/* config-overrides.js */
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = function override(config, env) {
  //do stuff with the webpack config...
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false
  }
  config.plugins = (config.plugins || []).concat(new NodePolyfillPlugin({
    excludeAliases: ['console']
  }));
  return config;
}