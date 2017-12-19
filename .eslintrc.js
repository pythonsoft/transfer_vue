// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  extends: 'airbnb-base',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // check if imports actually resolve
  settings: {
    'import/resolver': {
      webpack: {
        config: 'build/webpack.base.conf.js'
      }
    }
  },
  // add your custom rules here
  rules: {
    // don't require .vue extension when importing
    'import/extensions': ['error', 'always', {
      js: 'never',
      vue: 'never'
    }],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': ['error', {
      props: true,
      ignorePropertyModificationsFor: [
        'state', // for vuex state
        'acc', // for reduce accumulators
        'e' // for e.returnvalue
      ]
    }],
    // allow optionalDependencies
    'import/no-extraneous-dependencies': ['error', {
      optionalDependencies: ['test/unit/index.js']
    }],
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    "no-unused-vars": 0,
    "global-require": 0,
    "comma-dangle": ["error", "never"],
    "object-property-newline": "warn",
    "object-shorthand": ["error", "methods"],
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "prefer-const": "warn",
    "no-unused-expressions": 0,
    "no-lonely-if": 0,
    "no-underscore-dangle": 0,
    "func-names": 0,
    "max-len": ["error", 200, { "ignoreComments": true, "ignoreUrls": true, "ignoreStrings": true }],
    "camelcase": 'off',
    "no-continue": "off",
    "no-mixed-operators": "off",
    "no-bitwise": "off",
  }
}
