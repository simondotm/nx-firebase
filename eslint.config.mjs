import nxEslintPlugin from '@nx/eslint-plugin'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports'
import eslintPluginStylistic from '@stylistic/eslint-plugin'
import eslintPluginImport from 'eslint-plugin-import'

export default [
  ...nxEslintPlugin.configs['flat/base'],
  ...nxEslintPlugin.configs['flat/typescript'],
  ...nxEslintPlugin.configs['flat/javascript'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ['**/dist', "**/*.mjs"],
  },
  {
    plugins: {
      prettier: eslintPluginPrettier,
      'unused-imports': eslintPluginUnusedImports,
      '@stylistic': eslintPluginStylistic,
      import: eslintPluginImport,
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-restricted-types': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-prototype-builtins': 'warn',
      'no-useless-escape': 'warn',
      'no-inner-declarations': 'off',
      'no-fallthrough': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-constant-condition': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // '@stylistic/quote-props': ['error', 'as-needed'],
      // '@stylistic/max-len': ['error', { code: 80 }],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/semi': ['error', 'never'],
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
]
