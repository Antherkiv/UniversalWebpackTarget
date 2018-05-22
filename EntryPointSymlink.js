/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)
*/
"use strict";
/* eslint node/no-unpublished-require:0 node/no-extraneous-require:0 */
/* eslint prettier/prettier: ["warn", { trailingComma: "none", singleQuote: false, useTabs: true, tabWidth: 2, printWidth: 80 }] */

const fs = require("fs");
const path = require("path");

class EntryPointSymlink {
	apply(compiler) {
		const symlinks = [];

		compiler.hooks.emit.tapAsync(
			"EntryPointSymlink",
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
			"EntryPointSymlink",
			(compiler, callback) => {
				for (const ln of symlinks) {
					if (fs.existsSync(ln.symlink)) {
						fs.unlinkSync(ln.symlink);
					}
					fs.symlinkSync(ln.filename, ln.symlink);
				}
				callback();
			}
		);
	}
}

module.exports = EntryPointSymlink;
