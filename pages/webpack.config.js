// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';


const stylesHandler = MiniCssExtractPlugin.loader;



const config = {
	entry: './src/index.tsx',
	output: {
		publicPath: '/',
		path: path.resolve(__dirname, 'dist'),
		libraryTarget: 'umd',
		library: 'my-react'
	},
	devServer: {
    port: 9000,
		open: true,
		host: 'localhost',
		headers: {
			"Access-Control-Allow-Origin": '*'
		},
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true, // 是否需要跨域
			}
		}
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html',
		}),

		new MiniCssExtractPlugin(),

		// Add your plugins here
		// Learn more about plugins from https://webpack.js.org/configuration/plugins/
	],
	module: {
		rules: [{
				test: /\.(ts|tsx)$/i,
				use: [{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-react']
						}
					},
					'ts-loader',
				],
				exclude: ['/node_modules/'],
			},
			{
				test: /\.less$/i,
				use: [stylesHandler, 'css-loader', 'postcss-loader', {
					loader: 'less-loader',
					options: {
						lessOptions: {
							javascriptEnabled: true
						}
					}
				}],
			},
			{
				test: /\.css$/i,
				use: [stylesHandler, 'css-loader', 'postcss-loader'],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
				type: 'asset',
			},

			// Add your rules for custom modules here
			// Learn more about loaders from https://webpack.js.org/loaders/
		],
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
};

module.exports = () => {
	if (isProduction) {
		config.mode = 'production';


		config.plugins.push(new WorkboxWebpackPlugin.GenerateSW());

	} else {
		config.mode = 'development';
	}
	return config;
};