const path = require('path')

module.exports = {
  target: 'node',
  entry: {
    mailmain: './src/mailer/index.js',
    main: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }]
      }
    ]
  },
  mode: 'development',
  devtool: 'source-map'
}
