const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    sidepanel: './src/sidepanel/index.tsx',
    content: './src/content/content.ts',
    background: './src/background/background.ts',
    offscreen: './src/offscreen/offscreen.ts',
    permissions: './src/permissions/permissions.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new Dotenv({
      systemvars: true,
    }),
    new HtmlWebpackPlugin({
      template: './src/sidepanel/sidepanel.html',
      filename: 'sidepanel.html',
      chunks: ['sidepanel'],
    }),
    new HtmlWebpackPlugin({
      template: './src/offscreen/offscreen.html',
      filename: 'offscreen.html',
      chunks: ['offscreen'],
    }),
    new HtmlWebpackPlugin({
      template: './src/permissions/permissions.html',
      filename: 'permissions.html',
      chunks: ['permissions'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
        { from: 'node_modules/@elevenlabs/client/worklets', to: 'worklets' },
      ],
    }),
  ],
  optimization: {
    splitChunks: false,
  },
};
