module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  globals: {
    ShadyCSS: true
  },
  plugins: ['import', 'promise', 'compat', 'node'],
  extends: [
    'plugin:promise/recommended',
    'standard'
  ],
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 9,
    ecmaFeatures: {
      sourceType: 'module',
      jsx: true
    },
    allowImportExportEverywhere: true
  },
  rules: {
    'promise/always-return': 0,
    'promise/avoid-new': 0,
    'promise/param-names': 0,
    'promise/catch-or-return': 0,
    'compat/compat': 0,
    'node/no-deprecated-api': 2,
    'node/no-extraneous-require': 2,
    'node/no-missing-require': 2,
    'import/no-unresolved': [2, { commonjs: true, amd: true }],
    'import/named': 2,
    'import/namespace': 2,
    'import/default': 2,
    'import/export': 2,
    'no-console': 1,
    'no-return-assign': 0,
    'no-cond-assign': 0,
    'curly': 0
  }
}
