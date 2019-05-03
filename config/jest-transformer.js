const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [require.resolve('babel-plugin-jsx-dom-expressions')],
  babelrc: false,
  configFile: false,
});