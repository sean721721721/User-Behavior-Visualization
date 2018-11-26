const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    app: './app/index.js',
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      // title: 'Output Management',
      template: `${__dirname}/app/index.html`,
      filename: 'index.html',
      inject: 'body',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
  },
  watchOptions: {
    ignored: ['src', 'node_modules'],
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader',
        include: `${__dirname}/app`,
        exclude: /(node_modules|bundle\.js$|test\.js$)/,
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/react', '@babel/env'],
            // plugins: [require('@babel/plugin-syntax-dynamic-import')] ?
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(csv|tsv)$/,
        use: ['csv-loader'],
      },
      {
        test: /\.xml$/,
        use: ['xml-loader'],
      },
    ],
  },
  resolve: {
    alias: {
      config$: './configs/app-config.js',
      // react: './vendor/react-master',
    },
    modules: ['node_modules', 'bower_components', 'shared', '/shared/vendor/modules'],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};
