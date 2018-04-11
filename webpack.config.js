const path = require('path')
const webpack = require('webpack')
const MinifyPlugin = require('babel-minify-webpack-plugin')

let filename = 'assembly.js'
const plugins = [
  new webpack.DefinePlugin({
    DEBUG: JSON.stringify(process.env.ASSEMBLY_DEBUG)
  })
]

if(process.env.WEBPACK_ENV === 'production') {
  filename = 'assembly.min.js'
  plugins.push(new MinifyPlugin())
}

module.exports = {
  entry: './src/index.js',
  output: {
    filename: filename,
    library: 'assembly',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: ['transform-class-properties'],
              presets: ['@babel/preset-env']
            }
          },
          'eslint-loader'
        ]
      },
      {
        test: /\.obj$/,
        use: 'raw-loader'
      },
      // three/examples/ do not support modules. Using imports-loader, provide
      // `three` as THREE to the example to define its contents, then import
      // from `three`.
      {
        test: /three\/examples\/js\/.*\.js$/,
        use: 'imports-loader?THREE=three'
      }
    ]
  },
  plugins: plugins
}
