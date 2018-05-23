/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Germán Méndez Bravo (Kronuz)

		This comes mainly from webpack/lib/web/JsonpTemplatePlugin.js
		[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";
const fs = require("fs");
const path = require("path");

const Template = require("webpack/lib/Template");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const NS = path.dirname(fs.realpathSync(MiniCssExtractPlugin.loader));

class UniversalCssExtractPlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		const mce = new MiniCssExtractPlugin(this.options);
		mce.apply(compiler);

		compiler.hooks.thisCompilation.tap(
			"UniversalCssExtractPlugin",
			compilation => {
				const mainTemplate = compilation.mainTemplate;

				// "Untap" localVars and requireEnsure taps added by mini-css-extract-plugin
				mainTemplate.hooks.localVars.taps = mainTemplate.hooks.localVars.taps.filter(
					tap => tap.name !== "mini-css-extract-plugin"
				);
				mainTemplate.hooks.requireEnsure.taps = mainTemplate.hooks.requireEnsure.taps.filter(
					tap => tap.name !== "mini-css-extract-plugin"
				);

				mainTemplate.hooks.localVars.tap(
					"UniversalCssExtractPlugin",
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
					"UniversalCssExtractPlugin",
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
			}
		);
	}
}
UniversalCssExtractPlugin.loader = MiniCssExtractPlugin.loader;

module.exports = UniversalCssExtractPlugin;
