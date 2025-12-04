import { defineConfig, globalIgnores } from 'eslint/config';
import typescript from 'typescript-eslint';

export default defineConfig({
  files: [
    './src/**/*.ts',
    './tests/**/*.ts'
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  extends: [
    globalIgnores(['**/*.js']),
    typescript.configs.eslintRecommended,
    typescript.configs.strictTypeChecked,
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],
    'eqeqeq': 'error',
    'quotes': ['error', 'single'],
    'object-shorthand': 'error',
    'no-console': 'error',
    'no-warning-comments': 'warn',
    'no-useless-escape': 'error',
    'no-multiple-empty-lines': 'error',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'variableLike',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'variable',
        modifiers: ['destructured'],
        format: null,
      },
    ],
    '@typescript-eslint/unbound-method': [
      'error',
      {
        ignoreStatic: true
      }
    ],
  }
});
