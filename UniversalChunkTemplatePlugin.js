/*
	MIT License http://www.opensource.org/licenses/mit-license.php
    Authors Tobias Koppers @sokra
            Germán Méndez Bravo (Kronuz)
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
			hash.update("4");
			hash.update(`${chunkTemplate.outputOptions.jsonpFunction}`);
			hash.update("global");
		});
		chunkTemplate.hooks.renderWithEntry.tap(
			"UniversalChunkTemplatePlugin",
			(source, chunk) => {
				const library = chunk.name
					.replace(/\b\w/g, l => l.toUpperCase())
					.replace(/\//g, '');
				const request = mainTemplate.getAssetPath(
					runtimeTemplate.outputOptions.publicPath + runtimeTemplate.outputOptions.chunkFilename,
					{ chunk }
				);
				const varExpression = mainTemplate.getAssetPath(
					library,
					{ chunk }
				);
				return new ConcatSource(
					source,
					`;\nif (typeof global.imports === "object") global.imports["${request}"] = ${varExpression}`,
					`;\nif (typeof module !== "undefined") module.exports = ${varExpression}`
				);
			}
		);
	}
}
module.exports = UniversalChunkTemplatePlugin;
