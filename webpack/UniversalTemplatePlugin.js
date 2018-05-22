/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const UniversalMainTemplatePlugin = require("./UniversalMainTemplatePlugin");
const UniversalChunkTemplatePlugin = require("./UniversalChunkTemplatePlugin");
const JsonpHotUpdateChunkTemplatePlugin = require("webpack/lib/web/JsonpHotUpdateChunkTemplatePlugin");
const Template = require("webpack/lib/Template");

class UniversalTemplatePlugin {
	constructor(universalName, withRuntime) {
		this.universalName = universalName;
		this.withRuntime = withRuntime;
	}

	apply(compiler) {
		const universalName =
			this.universalName ||
			"webpackUniversal" +
				Template.toIdentifier(compiler.options.name)
					.replace(/\b\w/g, l => l.toUpperCase())
					.replace(/\//g, "");
		const withRuntime = this.withRuntime;
		compiler.hooks.thisCompilation.tap(
			"UniversalTemplatePlugin",
			compilation => {
				new UniversalMainTemplatePlugin(universalName, withRuntime).apply(
					compilation.mainTemplate
				);
				new UniversalChunkTemplatePlugin(universalName).apply(
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