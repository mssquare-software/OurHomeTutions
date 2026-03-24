module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove React Compiler plugin to avoid compiler-runtime issues
      // If you need React Compiler, you'll need to upgrade to React 19
    ],
  };
};
