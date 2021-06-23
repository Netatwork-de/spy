const path = require('path');

module.exports = {
  extends: [
    '../.eslintrc.js',
    'plugin:mocha/recommended'
  ],
  plugins: [
    'mocha'
  ],
  parserOptions: {
    project: path.join(process.cwd(), 'tests', 'tsconfig.json'),
  },
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    'mocha/no-setup-in-describe': 'off',
  }
};