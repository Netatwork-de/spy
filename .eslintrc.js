const path = require("path");

module.exports = {
	root: true,
	env: {
		'node': true,
	},
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
		'import',
		'jsdoc'
	],
	parserOptions: {
		project: path.resolve("./tsconfig.json"),
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	rules: {
    'semi': 'off',
    'no-shadow': 'off',
    'quotes': ['warn', 'single'],
    'object-shorthand': 'error',
    'no-warning-comments': 'warn',
    '@typescript-eslint/semi': ['error'],
    '@typescript-eslint/member-delimiter-style': ['error'],
    '@typescript-eslint/explicit-member-accessibility': ['error'],
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_'
    }],
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: "variableLike",
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
      {
        selector: "variable",
        types: ["boolean"],
        format: ["PascalCase"],
        prefix: ["is", "should", "has", "can", "did", "will", "call", "use"],
        filter: { regex: "^(?!(cancelled|canceled)).*$", match: true },
        leadingUnderscore: "allow",
      }
    ],
    '@typescript-eslint/no-shadow': ['error', { builtinGlobals: true, ignoreTypeValueShadow: true, }],
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 3,
      }
    ],
    '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
    '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }]
  }
};