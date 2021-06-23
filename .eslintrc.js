const path = require("path");

module.exports = {
	root: true,
	env: {
		'node': true,
		'browser': true
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
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
		'quotes': ['warn', 'single'],
		'no-shadow': 'off',
		'@typescript-eslint/no-shadow': ['error', { builtinGlobals: true, ignoreTypeValueShadow: true, }],
	}
};