module.exports = {
  presets: ['module:@react-native/babel-preset'],
  env: {
    // No bundle de release (NODE_ENV/BABEL_ENV=production) os console.* são
    // removidos, para não expor dados de comandas e erros no logcat.
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
