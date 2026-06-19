module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { env: { reanimated: true } }],
      'nativewind/babel',
    ],
  };
};
