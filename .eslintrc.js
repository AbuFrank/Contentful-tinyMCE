module.exports = {
  extends: [
    'wesbos',
    'prettier',
    'plugin:@next/next/recommended',
    'plugin:storybook/recommended',
    'plugin:react/recommended',
  ],
  rules: {
    // 'no-console': 2,
    'no-console': 'warn',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: ['**/*.stories.*', '**/.storybook/**/*.*'],
        peerDependencies: true,
      },
    ],
    // Nextjs handles this
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@/components', './components'],
          ['@/lib', './lib'],
          ['@/constants', './constants'],
          ['@/utils', './utils'],
          ['@/styles', './styles'],
        ],
        extensions: ['.js', '.json'],
      },
      node: {
        paths: ['./'],
      },
    },
  },
  overrides: [
    {
      files: [
        'public/OneSignalSDKWorker.js',
        'public/OneSignalSDKUpdaterWorker.js',
      ],
      env: {
        serviceworker: true, // Enables service worker globals
      },
      rules: {
        'no-restricted-globals': 'off',
        'no-undef': 'off',
      },
    },
  ],
}
