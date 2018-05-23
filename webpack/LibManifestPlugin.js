/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/LibManifestPlugin.js
	[https://github.com/webpack/webpack/tree/v4.8.3]

	Problem was Dll manifests are of no use for initial chunks
	which have no Main (which are no entry points)

	This only creates manifests for entry points and for those,
	it uses all chunks only in the initial groups.
*/
"use strict";

const path = require("path");
const asyncLib = require("neo-async");

class LibManifestPlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.emit.tapAsync(
			"LibManifestPlugin",
			(compilation, callback) => {
				asyncLib.forEach(
					compilation.chunks,
					(chunk, callback) => {
						if (!chunk.isOnlyInitial() || !chunk.hasEntryModule()) {
							callback();
							return;
						}
						const targetPath = compilation.getPath(this.options.path, {
							hash: compilation.hash,
							chunk
						});
						const name =
							this.options.name &&
							compilation.getPath(this.options.name, {
								hash: compilation.hash,
								chunk
							});
						const manifest = {
							name,
							type: this.options.type,
							content: Array.from(chunk.groupsIterable, g => g.isInitial() && g)
								.filter(Boolean)
								.reduce((obj, group) => {
									return group.chunks.reduce((obj, chunk) => {
										for (const module of chunk.modulesIterable) {
											if (module.libIdent) {
												const ident = module.libIdent({
													context:
														this.options.context || compiler.options.context
												});
												if (ident) {
													obj[ident] = {
														id: module.id,
														buildMeta: module.buildMeta
													};
												}
											}
										}
										return obj;
									}, obj);
								}, Object.create(null))
						};
						const content = Buffer.from(JSON.stringify(manifest), "utf8");
						compiler.outputFileSystem.mkdirp(path.dirname(targetPath), err => {
							if (err) return callback(err);
							compiler.outputFileSystem.writeFile(
								targetPath,
								content,
								callback
							);
						});
					},
					callback
				);
			}
		);
	}
}
module.exports = LibManifestPlugin;
