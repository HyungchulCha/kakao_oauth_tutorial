const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const IS_DEV = process.env.NODE_ENV === 'development';

module.exports = {
  entry: {
    app: './src/index.js',
  },
  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devtool: 'eval-cheap-source-map',
  devServer: {
    host: 'localhost',
    port: 3000,
    overlay: true,
    writeToDisk: true,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [{ loader: MiniCssExtractPlugin.loader }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
      },
      {
        test: /\.(jpe?g|png|gif|woff2?)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[path][name].[contenthash].[ext]',
          },
        },
      },
      {
        test: /\.svg$/,
        use: { loader: '@svgr/webpack' },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 1,
        },
        reactBundle: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react.bundle',
          priority: 2,
          minSize: 100,
        },
      },
    },
  },
  mode: IS_DEV ? 'development' : 'production',
};
