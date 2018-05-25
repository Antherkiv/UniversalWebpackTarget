/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)
*/
"use strict";

const fs = require("fs");
const path = require("path");
const MemoryFileSystem = require("memory-fs");

class EntrySymlinkPlugin {
	apply(compiler) {
		const symlinks = [];

		compiler.hooks.emit.tapAsync(
			"EntrySymlinkPlugin",
			(compilation, callback) => {
				compilation.chunks.forEach(function(chunk) {
					if (chunk.hasEntryModule()) {
						chunk.files
							.filter(f => f.endsWith(".js"))
							.forEach(function(filename) {
								let symlink = `${chunk.name}.js`;
								if (symlink !== filename) {
									symlink = path.resolve(
										compilation.outputOptions.path,
										symlink
									);
									symlinks.push({
										filename,
										symlink
									});
								}
							});
					}
				});
				callback();
			}
		);

		compiler.hooks.afterEmit.tapAsync(
			"EntrySymlinkPlugin",
			(compiler, callback) => {
				const FS =
					compiler.outputFileSystem instanceof MemoryFileSystem
						? compiler.outputFileSystem
						: fs;
				for (const ln of symlinks) {
					if (FS.existsSync(ln.symlink)) {
						FS.unlinkSync(ln.symlink);
					}
					FS.symlinkSync(ln.filename, ln.symlink);
				}
				callback();
			}
		);
	}
}

module.exports = EntrySymlinkPlugin;
