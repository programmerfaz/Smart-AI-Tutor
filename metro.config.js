// const { getDefaultConfig } = require('expo/metro-config');
// const { withNativeWind } = require('nativewind/metro');

// const defaultConfig = getDefaultConfig(__dirname);
// defaultConfig.resolver.assetExts.push('cjs');
// const config = getDefaultConfig(__dirname);

// module.exports = withNativeWind(defaultConfig, { input: './global.css' });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
module.exports = withNativeWind(config, { input: './global.css' })