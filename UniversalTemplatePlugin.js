/*
	MIT License http://www.opensource.org/licenses/mit-license.php
    Authors Tobias Koppers @sokra
            Germán Méndez Bravo (Kronuz)
*/
"use strict";

const UniversalMainTemplatePlugin = require("./UniversalMainTemplatePlugin");
const UniversalChunkTemplatePlugin = require("./UniversalChunkTemplatePlugin");
const JsonpHotUpdateChunkTemplatePlugin = require("webpack/lib/web/JsonpHotUpdateChunkTemplatePlugin");


class UniversalTemplatePlugin {
	apply(compiler) {
		compiler.hooks.thisCompilation.tap("UniversalTemplatePlugin", compilation => {
			new UniversalMainTemplatePlugin().apply(compilation.mainTemplate);
			new UniversalChunkTemplatePlugin().apply(compilation.chunkTemplate);
			new JsonpHotUpdateChunkTemplatePlugin().apply(
				compilation.hotUpdateChunkTemplate
			);
		});
	}
}

module.exports = UniversalTemplatePlugin;
