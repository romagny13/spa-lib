var path = require('path');

module.exports = {
    debug: true,
    noInfo: false,
    target: 'web',
    entry: './test/unit/index.js',
    output: {
        path: path.resolve(__dirname, 'test'),
        publicPath: '/',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ["", ".ts", ".js"]
    },
    module: {
        loaders: [
            { test: /\.ts$/, exclude: /node_modules/, loader: "awesome-typescript-loader" }
        ]
    }
}

