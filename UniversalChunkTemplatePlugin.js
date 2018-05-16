/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpChunkTemplatePlugin.js
	and partially from webpack/lib/node/NodeNodeTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const { ConcatSource } = require("webpack-sources");

class UniversalChunkTemplatePlugin {
	apply(chunkTemplate) {
		chunkTemplate.hooks.render.tap(
			"UniversalChunkTemplatePlugin",
			(modules, chunk) => {
				const jsonpFunction = chunkTemplate.outputOptions.jsonpFunction;
				const source = new ConcatSource();
				source.add("(function(data) {\n");
				source.add(`data.push([${JSON.stringify(chunk.ids)},`);
				source.add(modules);
				const entries = [chunk.entryModule].filter(Boolean).map(m =>
					[m.id].concat(
						Array.from(chunk.groupsIterable)[0]
							.chunks.filter(c => c !== chunk)
							.map(c => c.id)
					)
				);
				if (entries.length > 0) {
					source.add(`,${JSON.stringify(entries)}`);
				}
				source.add("])");
				source.add(';\nif (typeof module !== "undefined") module.exports = data');
				source.add(`;\n})(global[${JSON.stringify(jsonpFunction)}] = global[${JSON.stringify(jsonpFunction)}] || [])`);
				return source;
			}
		);
		chunkTemplate.hooks.hash.tap("UniversalChunkTemplatePlugin", hash => {
			hash.update("UniversalChunkTemplatePlugin");
			hash.update("1");
			hash.update(`${chunkTemplate.outputOptions.jsonpFunction}`);
		});
	}
}
module.exports = UniversalChunkTemplatePlugin;
