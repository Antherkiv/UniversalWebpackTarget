/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/web/JsonpMainTemplatePlugin.js
	and partially from webpack/lib/node/NodeMainTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const Template = require("webpack/lib/Template");
const { ConcatSource } = require("webpack-sources");

const intersect = require("webpack/lib/util/SetHelpers").intersect;
const Chunk = require("webpack/lib/Chunk");
const MainTemplate = require("webpack/lib/MainTemplate");

// from webpack/lib/Chunk.getAllAsyncChunks()
// Monkey-patch so it also includes deferred chunks
function getAllAsyncChunks() {
	const queue = new Set();
	const chunks = new Set();

	const initialChunks = intersect(
		Array.from(this.groupsIterable, g => new Set(g.chunks))
	);

	for (const chunkGroup of this.groupsIterable) {
		for (const child of chunkGroup.childrenIterable) queue.add(child);
	}

	for (const chunkGroup of queue) {
		for (const chunk of chunkGroup.chunks) {
			if (!initialChunks.has(chunk)) chunks.add(chunk);
		}
		for (const child of chunkGroup.childrenIterable) queue.add(child);
	}

	for (const chunk of Array.from(this.groupsIterable)[0].chunks) {
		chunks.add(chunk);
	}

	return chunks;
}
Chunk.prototype.getAllAsyncChunks = getAllAsyncChunks;

// from webpack/lib/web/JsonpMainTemplatePlugin
// Monkey-patch MainTemplate so it has getAssetPathSrc() instead
function getAssetPathSrc(
	path,
	hash,
	chunk,
	chunkIdExpression,
	contentHashType
) {
	const chunkMaps = chunk.getChunkMaps();
	return this.getAssetPath(path, {
		hash: `" + ${this.renderCurrentHashCode(hash)} + "`,
		hashWithLength: length =>
			`" + ${this.renderCurrentHashCode(hash, length)} + "`,
		chunk: {
			id: `" + ${chunkIdExpression} + "`,
			hash: `" + ${JSON.stringify(chunkMaps.hash)}[${chunkIdExpression}] + "`,
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
				[contentHashType]: `" + ${JSON.stringify(
					chunkMaps.contentHash[contentHashType]
				)}[${chunkIdExpression}] + "`
			},
			contentHashWithLength: {
				[contentHashType]: length => {
					const shortContentHashMap = {};
					const contentHash = chunkMaps.contentHash[contentHashType];
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
		contentHashType
	});
}
MainTemplate.prototype.getAssetPathSrc = getAssetPathSrc;

class UniversalMainTemplatePlugin {
	constructor(options) {
		this.universalName = options.universalName;
		this.withRuntime = options.withRuntime;
	}

	apply(mainTemplate) {
		const withRuntime = this.withRuntime;
		mainTemplate.hooks.localVars.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				const dependencies = new Set();
				for (const chunkModule of chunk.modulesIterable) {
					if (chunkModule.issuer && chunkModule.issuer.dependencies) {
						const dep = chunkModule.issuer.dependencies[0];
						if (dep) {
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
				}
				const entries = [chunk.entryModule].filter(Boolean).map(m =>
					[m.id].concat(
						Array.from(chunk.groupsIterable)[0]
							.chunks.filter(c => c !== chunk)
							.map(c => c.id)
					)
				);

				const chunkMaps = chunk.getChildIdsByOrdersMap();
				return Template.asString([
					source,
					"",
					"var webpackUniversalOptions = {};",
					"",
					"// object to store loaded and loading Javascript chunks",
					"// undefined = chunk not loaded, null = chunk preloaded/prefetched",
					"// Promise = chunk loading, 0 = chunk loaded",
					"var installedChunks = {",
					Template.indent(
						chunk.ids.map(id => `${JSON.stringify(id)}: 0`).join(",\n")
					),
					"};",
					"",
					"// script path function",
					"function scriptSrc(chunkId) {",
					Template.indent([
						`return ${mainTemplate.getAssetPathSrc(
							JSON.stringify(mainTemplate.outputOptions.chunkFilename),
							hash,
							chunk,
							"chunkId",
							"javascript"
						)}`
					]),
					"}",
					"",
					"// deferred chunks for splitChunks",
					"var deferredModules = [",
					Template.indent([entries.map(e => JSON.stringify(e)).join(", ")]),
					"];",
					"",
					"// chunk preloading for javascript",
					`var chunkPreloadMap = ${JSON.stringify(
						chunkMaps.preload || {},
						null,
						"\t"
					)}`,
					"",
					"// chunk prefetching for javascript",
					`var chunkPrefetchMap = ${JSON.stringify(
						chunkMaps.prefetch || {},
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
					"];"
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
		mainTemplate.hooks.beforeStartup.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				return Template.asString([
					source,
					"",
					"Object.assign(webpackUniversalOptions, {",
					Template.indent(
						[
							"u: __universal__",
							`r: ${mainTemplate.requireFn}`,
							"m: modules",
							"s: scriptSrc",
							"i: installedChunks",
							"sc: cssSrc",
							"ic: installedCssChunks",
							"cc: cssChunks",
							"el: deferredModules",
							"pl: chunkPreloadMap",
							"pf: chunkPrefetchMap",
							"dp: dependencies"
						].join(",\n")
					),
					"});"
				]);
			}
		);
		mainTemplate.hooks.startup.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk, hash) => {
				return Template.asString([
					"",
					"global.webpackUniversal = global.webpackUniversal || [];",
					"return global.webpackUniversal.push(webpackUniversalOptions);"
				]);
			}
		);
		mainTemplate.hooks.renderWithEntry.tap(
			"UniversalMainTemplatePlugin",
			(source, chunk) => {
				const runtimeSource = withRuntime
					? Template.getFunctionContent(
							require("./UniversalMainTemplate.runtime.js")
					  )
					: "";

				return new ConcatSource(
					'if (typeof window !== "undefined") window.global = window.global || window;\n',
					"(function(__universal__) {\n",
					runtimeSource,
					"var __module__exports =\n",
					source,
					`;\nif (typeof module !== "undefined") module.exports = __module__exports`,
					`;\n})(global.${this.universalName} = global.${this.universalName} || {})`
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
var parentHotUpdateCallback = global[${JSON.stringify(hotUpdateFunction)}];
global[${JSON.stringify(hotUpdateFunction)}] = ${runtimeSource}`;
			}
		);
		mainTemplate.hooks.hash.tap("UniversalMainTemplatePlugin", hash => {
			hash.update("universal");
			hash.update("1");
			hash.update(this.universalName);
			hash.update(`${mainTemplate.outputOptions.chunkFilename}`);
			hash.update(`${mainTemplate.outputOptions.hotUpdateFunction}`);
		});
	}
}
module.exports = UniversalMainTemplatePlugin;
