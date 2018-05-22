/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";
/* eslint node/no-unpublished-require:0 node/no-extraneous-require:0 */
/* eslint prettier/prettier: ["warn", { trailingComma: "none", singleQuote: false, useTabs: true, tabWidth: 2, printWidth: 80 }] */

const UniversalMainTemplatePlugin = require("./UniversalMainTemplatePlugin");
const UniversalChunkTemplatePlugin = require("./UniversalChunkTemplatePlugin");
const JsonpHotUpdateChunkTemplatePlugin = require("webpack/lib/web/JsonpHotUpdateChunkTemplatePlugin");
const Template = require("webpack/lib/Template");

class UniversalTemplatePlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		const universal =
			"webpackUniversal" +
			Template.toIdentifier(compiler.options.name)
				.replace(/\b\w/g, l => l.toUpperCase())
				.replace(/\//g, "");
		const withRuntime = !this.options.dll;
		compiler.hooks.thisCompilation.tap(
			"UniversalTemplatePlugin",
			compilation => {
				new UniversalMainTemplatePlugin(universal, withRuntime).apply(
					compilation.mainTemplate
				);
				new UniversalChunkTemplatePlugin(universal).apply(
					compilation.chunkTemplate
				);
				new JsonpHotUpdateChunkTemplatePlugin().apply(
					compilation.hotUpdateChunkTemplate
				);
			}
		);
	}
}

module.exports = UniversalTemplatePlugin;
