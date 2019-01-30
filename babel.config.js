const presets = [
  ['@babel/env', {
    targets: {
      edge: '17',
      firefox: '60',
      chrome: '67',
      safari: '11.1',
      node: '7.0',
    },
    useBuiltIns: 'usage',
    modules: false,
  }],
  ['@babel/flow'],
];

const plugins = ['@babel/plugin-syntax-dynamic-import',
  '@babel/plugin-proposal-class-properties',
  ['module-resolver', {
    root: ['./app'],
    alias: {
      test: './test',
    },
  }],
];

const env = {
  test: {
    plugins: ['dynamic-import-node'],
  },
};

module.exports = {
  presets,
  plugins,
  env,
};
