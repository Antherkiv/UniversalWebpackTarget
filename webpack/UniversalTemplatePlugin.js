/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/v4.8.3]
*/
"use strict";

const UniversalMainTemplatePlugin = require("./UniversalMainTemplatePlugin");
const UniversalChunkTemplatePlugin = require("./UniversalChunkTemplatePlugin");
const JsonpHotUpdateChunkTemplatePlugin = require("webpack/lib/web/JsonpHotUpdateChunkTemplatePlugin");
const Template = require("webpack/lib/Template");

class UniversalTemplatePlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		const options = this.options;
		options.universalName =
			options.universalName ||
			"webpackUniversal" +
				Template.toIdentifier(compiler.options.name)
					.replace(/\b\w/g, l => l.toUpperCase())
					.replace(/\//g, "");
		compiler.hooks.thisCompilation.tap(
			"UniversalTemplatePlugin",
			compilation => {
				new UniversalMainTemplatePlugin(options).apply(
					compilation.mainTemplate
				);
				new UniversalChunkTemplatePlugin(options).apply(
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
