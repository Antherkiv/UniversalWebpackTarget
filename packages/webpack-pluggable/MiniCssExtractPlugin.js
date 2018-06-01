/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Germán Méndez Bravo (Kronuz)

		This comes mainly from mini-css-extract-plugin/src/index.js
		[https://github.com/webpack-contrib/mini-css-extract-plugin/tree/v0.4.0]

		This adds cssSrc() function and an empty installedCssChunks
*/
"use strict";

const fs = require("fs");
const path = require("path");

const Template = require("webpack/lib/Template");
const VanillaMiniCssExtractPlugin = require("mini-css-extract-plugin");

const NS = path.dirname(fs.realpathSync(VanillaMiniCssExtractPlugin.loader));

class MiniCssExtractPlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		const mce = new VanillaMiniCssExtractPlugin(this.options);
		mce.apply(compiler);

		compiler.hooks.thisCompilation.tap("MiniCssExtractPlugin", compilation => {
			const mainTemplate = compilation.mainTemplate;

			// "Untap" localVars and requireEnsure taps added by mini-css-extract-plugin
			mainTemplate.hooks.localVars.taps = mainTemplate.hooks.localVars.taps.filter(
				tap => tap.name !== "mini-css-extract-plugin"
			);
			mainTemplate.hooks.requireEnsure.taps = mainTemplate.hooks.requireEnsure.taps.filter(
				tap => tap.name !== "mini-css-extract-plugin"
			);

			mainTemplate.hooks.localVars.tap(
				"MiniCssExtractPlugin",
				(source, chunk, hash) => {
					const cssChunks = {};
					for (const c of chunk.getAllAsyncChunks()) {
						for (const module of c.modulesIterable) {
							if (module.type === NS) {
								cssChunks[c.id] = 1;
								break;
							}
						}
					}

					return Template.asString([
						source,
						"",
						"// object to store loaded CSS chunks",
						"var installedCssChunks = {};",
						"",
						"// object with valid css chunks",
						`var cssChunks = ${JSON.stringify(cssChunks)};`,
						"",
						"// css path function",
						"function cssSrc(chunkId) {",
						Template.indent([
							`return ${mainTemplate.getAssetPathSrc(
								JSON.stringify(mce.options.chunkFilename),
								hash,
								chunk,
								"chunkId",
								NS
							)}`
						]),
						"}"
					]);
				}
			);
			mainTemplate.hooks.beforeStartup.tap(
				"MiniCssExtractPlugin",
				(source, chunk, hash) => {
					return Template.asString([
						source,
						"",
						"webpackUniversalOptions.sc = cssSrc;",
						"webpackUniversalOptions.ic = installedCssChunks;",
						"webpackUniversalOptions.cc = cssChunks;"
					]);
				}
			);
		});
	}
}
MiniCssExtractPlugin.loader = VanillaMiniCssExtractPlugin.loader;

module.exports = MiniCssExtractPlugin;
