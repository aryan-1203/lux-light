import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'playwright-report',
      'test-results',
      'public/mockServiceWorker.js',
      'src/api/schema.d.ts',
      'src/api/schema.live.d.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{6}\\b/]',
          message:
            'No hex colour literals outside tokens.ts / tailwind.config.ts — use a token (PLAN §6.1).',
        },
      ],
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  {
    // Token sources, illustrations' gradient stops come from tokens; tests may use literals.
    files: [
      'src/design-system/tokens.ts',
      'tailwind.config.ts',
      '**/*.test.{ts,tsx}',
      'src/mocks/**',
      'e2e/**',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['*.config.{ts,js}', 'e2e/**/*.ts', 'src/mocks/**/*.ts', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
