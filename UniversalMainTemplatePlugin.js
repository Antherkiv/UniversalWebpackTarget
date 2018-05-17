/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpMainTemplatePlugin.js
	and partially from webpack/lib/node/NodeMainTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const { SyncWaterfallHook } = require("tapable");
const Template = require("webpack/lib/Template");
const { ConcatSource } = require("webpack-sources");

class UniversalMainTemplatePlugin {
	constructor(universal) {
		this.universal = universal;
	}

	apply(mainTemplate) {
		const getScriptSrc = (hash, chunk, chunkIdExpression) => {
			const chunkFilename = mainTemplate.outputOptions.chunkFilename;
			const chunkMaps = chunk.getChunkMaps();
			return mainTemplate.getAssetPath(JSON.stringify(chunkFilename), {
				hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
				hashWithLength: length =>
					`" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
				chunk: {
					id: `" + ${chunkIdExpression} + "`,
					hash: `" + ${JSON.stringify(
						chunkMaps.hash
					)}[${chunkIdExpression}] + "`,
					hashWithLength(length) {
						const shortChunkHashMap = Object.create(null);
						for (const chunkId of Object.keys(chunkMaps.hash)) {
							if (typeof chunkMaps.hash[chunkId] === "string")
								shortChunkHashMap[chunkId] = chunkMaps.hash[chunkId].substr(
									0,
									length
								);
						}
						return `" + ${JSON.stringify(
							shortChunkHashMap
						)}[${chunkIdExpression}] + "`;
					},
					name: `" + (${JSON.stringify(
						chunkMaps.name
					)}[${chunkIdExpression}]||${chunkIdExpression}) + "`,
					contentHash: {
						javascript: `" + ${JSON.stringify(
							chunkMaps.contentHash.javascript
						)}[${chunkIdExpression}] + "`
					},
					contentHashWithLength: {
						javascript: length => {
							const shortContentHashMap = {};
							const contentHash = chunkMaps.contentHash.javascript;
							for (const chunkId of Object.keys(contentHash)) {
								if (typeof contentHash[chunkId] === "string") {
									shortContentHashMap[chunkId] = contentHash[chunkId].substr(
										0,
										length
									);
								}
							}
							return `" + ${JSON.stringify(
								shortContentHashMap
							)}[${chunkIdExpression}] + "`;
						}
					}
				},
				contentHashType: "javascript"
			});
		};
		mainTemplate.hooks.localVars.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				const dependencies = new Set();
				for (const chunkModule of chunk.modulesIterable) {
					if (chunkModule.issuer && chunkModule.issuer.dependencies) {
						const dep = chunkModule.issuer.dependencies[0];
						const sourceModule = dep.module;
						if (
							sourceModule &&
							sourceModule.external &&
							sourceModule.externalType
						) {
							dependencies.add(sourceModule.request);
						}
					}
				}
				let entries = [];
				if (chunk.hasEntryModule()) {
					entries = [chunk.entryModule].filter(Boolean).map(m =>
						[m.id].concat(
							Array.from(chunk.groupsIterable)[0]
								.chunks.filter(c => c !== chunk)
								.map(c => c.id)
						)
					);
				}
				return Template.asString([
					source,
					"",
					"// script path function",
					"function scriptSrc(chunkId) {",
					Template.indent([`return ${getScriptSrc(hash, chunk, "chunkId")}`]),
					"}",
					"",
					"// object to store loaded and loading chunks",
					"// undefined = chunk not loaded, null = chunk preloaded/prefetched",
					"// Promise = chunk loading, 0 = chunk loaded",
					"var installedChunks = {",
					Template.indent(
						chunk.ids.map(id => `${JSON.stringify(id)}: 0`).join(",\n")
					),
					"};",
					"",
					"var deferredModules = [",
					Template.indent([entries.map(e => JSON.stringify(e)).join(", ")]),
					"];",
					"",
					"// chunk preloadng for javascript",
					"",
					`var chunkPreloadMap = ${JSON.stringify(
						chunk.getChildIdsByOrdersMap().preload || {},
						null,
						"\t"
					)}`,
					"",
					"// chunk prefetching for javascript",
					"",
					`var chunkPrefetchMap = ${JSON.stringify(
						chunk.getChildIdsByOrdersMap().prefetch || {},
						null,
						"\t"
					)}`,
					"",
					"// object to store dependencies",
					"var dependencies = [",
					Template.indent(
						Array.from(dependencies)
							.map(request => JSON.stringify(request))
							.join(",\n")
					),
					"];",
				]);
			}
		);
		mainTemplate.hooks.requireExtensions.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				return Template.asString([
					source,
					"",
					"// chunk path",
					`${mainTemplate.requireFn}.cp = ${JSON.stringify(
						mainTemplate.getAssetPath(
							mainTemplate.outputOptions.publicPath +
								mainTemplate.outputOptions.chunkFilename,
							{ chunk }
						)
					)}`
				]);
			}
		);
		mainTemplate.hooks.startup.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				return Template.asString([
					"",
					"global.webpackUniversal = global.webpackUniversal || [];",
					"return global.webpackUniversal.push([",
					Template.indent(
						[
							"__webpackUniversal__",
							mainTemplate.requireFn,
							"modules",
							"scriptSrc",
							"installedChunks",
							"deferredModules",
							"chunkPreloadMap",
							"chunkPrefetchMap",
							"dependencies",
						].join(",\n")
					),
					"]);",
				]);
			}
		);
		mainTemplate.hooks.renderWithEntry.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk) => {
				return new ConcatSource(
					'if (typeof window !== "undefined") window.global = window.global || window;\n',
					"(function(__webpackUniversal__) {\n",
					"var __module__exports =\n",
					source,
					`;\nif (typeof module !== "undefined") module.exports = __module__exports`,
					`;\n})(global.${this.universal} = global.${this.universal} || {})`,
				);
			}
		);
		mainTemplate.hooks.hotBootstrap.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				const hotUpdateChunkFilename =
					mainTemplate.outputOptions.hotUpdateChunkFilename;
				const hotUpdateMainFilename =
					mainTemplate.outputOptions.hotUpdateMainFilename;
				const crossOriginLoading =
					mainTemplate.outputOptions.crossOriginLoading;
				const hotUpdateFunction = mainTemplate.outputOptions.hotUpdateFunction;
				const currentHotUpdateChunkFilename = mainTemplate.getAssetPath(
					JSON.stringify(hotUpdateChunkFilename),
					{
						hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
						hashWithLength: length =>
							`" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`,
						chunk: {
							id: '" + chunkId + "'
						}
					}
				);
				const currentHotUpdateMainFilename = mainTemplate.getAssetPath(
					JSON.stringify(hotUpdateMainFilename),
					{
						hash: `" + ${mainTemplate.renderCurrentHashCode(hash)} + "`,
						hashWithLength: length =>
							`" + ${mainTemplate.renderCurrentHashCode(hash, length)} + "`
					}
				);
				const runtimeSource = Template.getFunctionContent(
					require("webpack/lib/web/JsonpMainTemplate.runtime.js")
				)
					.replace(/\/\/\$semicolon/g, ";")
					.replace(/\$require\$/g, mainTemplate.requireFn)
					.replace(
						/\$crossOriginLoading\$/g,
						crossOriginLoading
							? `script.crossOrigin = ${JSON.stringify(crossOriginLoading)}`
							: ""
					)
					.replace(/\$hotMainFilename\$/g, currentHotUpdateMainFilename)
					.replace(/\$hotChunkFilename\$/g, currentHotUpdateChunkFilename)
					.replace(/\$hash\$/g, JSON.stringify(hash));
				return `${source}
function hotDisposeChunk(chunkId) {
	delete installedChunks[chunkId];
}
var parentHotUpdateCallback = global[${JSON.stringify(
					hotUpdateFunction
				)}];
global[${JSON.stringify(hotUpdateFunction)}] = ${runtimeSource}`;
			}
		);
		mainTemplate.hooks.hash.tap("UniversalMainTemplatePlugin", hash => {
			hash.update("universal");
			hash.update("1");
			hash.update(this.universal);
			hash.update(`${mainTemplate.outputOptions.chunkFilename}`);
			hash.update(`${mainTemplate.outputOptions.hotUpdateFunction}`);
		});
	}
}
module.exports = UniversalMainTemplatePlugin;
