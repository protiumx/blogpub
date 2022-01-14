module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: false,
    },
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'jest', 'ordered-imports'],
  extends: [
    'plugin:eslint-comments/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'plugin:jest/recommended',
    'plugin:node/recommended',
  ],
  ignorePatterns: ['.yarn', 'dist', 'coverage', 'jest.config.js', 'webpack.config.js'],
  rules: {
    'eslint-comments/disable-enable-pair': 'off',
    'object-curly-spacing': [2, 'always'],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'class-methods-use-this': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off',
    'ordered-imports/ordered-imports': [
      'error',
      {
        'declaration-ordering': [
          'type',
          {
            ordering: ['side-effect', 'default', 'namespace', 'destructured'],
            secondaryOrdering: ['source', 'case-insensitive'],
          },
        ],
        'specifier-ordering': 'lowercase-last',
        'group-ordering': [
          { name: 'internal libraries', match: '^[$|#].*/', order: 20 },
          { name: 'parent directories', match: '^\\.\\.?', order: 30 },
          { name: 'third-party', match: '.*', order: 10 },
        ],
      },
    ],
    'one-var': 'off',
    semi: ['error', 'always'],
  },
  overrides: [
    {
      files: ['test/*'],
      rules: {
        '@typescript-eslint/no-unsafe-member-access': 'off',
      },
    },
  ],
};
