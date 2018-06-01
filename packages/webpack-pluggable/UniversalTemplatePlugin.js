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

const ContextModule = require("webpack/lib/ContextModule");
const ExternalModule = require("webpack/lib/ExternalModule");
const intersect = require("webpack/lib/util/SetHelpers").intersect;
const Chunk = require("webpack/lib/Chunk");
const MainTemplate = require("webpack/lib/MainTemplate");

// Monkey patch ContextModule so it emits require() and import() add
// 'module.exprContextCritical = false' to your webpack config to prevent:
// "Critical dependency: the request of a dependency is an expression"
ContextModule.prototype.getSourceForEmptyContext = function(id) {
	return `function webpackEmptyContext(req) {
	// If you want to avoid seeing "Critical dependency" warnings,
	// add 'module.exprContextCritical = false' to your webpack config.
	return __require(req);
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = ${JSON.stringify(id)};`;
};

ContextModule.prototype.getSourceForEmptyAsyncContext = function(id) {
	return `function webpackEmptyAsyncContext(req) {
	// If you want to avoid seeing "Critical dependency" warnings,
	// add 'module.exprContextCritical = false' to your webpack config.
	return __import(req);
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = ${JSON.stringify(id)};`;
};

ExternalModule.prototype.getSourceForCommonJsExternal = function(
	moduleAndSpecifiers
) {
	if (!Array.isArray(moduleAndSpecifiers)) {
		return `module.exports = __require(${JSON.stringify(moduleAndSpecifiers)});`;
	}

	const moduleName = moduleAndSpecifiers[0];
	const objectLookup = moduleAndSpecifiers
		.slice(1)
		.map(r => `[${JSON.stringify(r)}]`)
		.join("");
	return `module.exports = __require(${moduleName})${objectLookup};`;
};

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

class UniversalTemplatePlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		const options = this.options;
		options.name = compiler.options.name;
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
