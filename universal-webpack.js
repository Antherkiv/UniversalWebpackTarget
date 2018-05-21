/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/WebpackOptionsApply.js
	from processing "web" target
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";
/* eslint node/no-unpublished-require:0 node/no-extraneous-require:0 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const DllPlugin = require("./DllPlugin");
const DllReferencePlugin = require("webpack/lib/DllReferencePlugin");
const FetchCompileWasmTemplatePlugin = require("webpack/lib/web/FetchCompileWasmTemplatePlugin");
const FunctionModulePlugin = require("webpack/lib/FunctionModulePlugin");
const LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin");
const NodeSourcePlugin = require("webpack/lib/node/NodeSourcePlugin");
const NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
const UniversalTemplatePlugin = require("./UniversalTemplatePlugin");

const ContextModule = require("webpack/lib/ContextModule");

// Monkey patch ContextModule so it emits require() and import() add
// 'module.exprContextCritical = false' to your webpack config to prevent:
// "Critical dependency: the request of a dependency is an expression"
ContextModule.prototype.getSourceForEmptyContext = function(id) {
	return `function webpackEmptyContext(req) {
	// If you want to avoid seeing "Critical dependency" warnings,
	// add 'module.exprContextCritical = false' to your webpack config.
	return global.require(req);
}`;
};
ContextModule.prototype.getSourceForEmptyAsyncContext = function(id) {
	return `function webpackEmptyAsyncContext(req) {
	// If you want to avoid seeing "Critical dependency" warnings,
	// add 'module.exprContextCritical = false' to your webpack config.
	return global.import(req);
}`;
};

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

const reference = {};
reference.to = function(name) {
	const rr = {};
	const promise = new Promise(function(resolve, reject) {
		rr.resolve = resolve;
		rr.reject = reject;
	});
	promise.resolve = rr.resolve;
	promise.reject = rr.reject;
	reference[name] = reference[name] || promise;
	return reference[name];
};

class DllReferenceResolverPlugin {
	constructor(libsPath, imports) {
		this.libsPath = libsPath;
		this.imports = imports;
	}

	apply(compiler) {
		const libsPath = this.libsPath || compiler.options.output.path;
		const imports = this.imports || [];

		compiler.hooks.beforeRun.tapAsync(
			"DllReferenceResolverPlugin",
			(compiler, callback) => {
				const promises = [];
				imports.forEach(name => {
					promises.push(reference.to(name));
				});
				Promise.all(promises).then(() => {
					imports.forEach(function(name) {
						const plugins = [];
						for (const file of glob.sync(
							path.resolve(libsPath, name, "*.json")
						)) {
							if (path.basename(file) !== "manifest.json") {
								const lib = JSON.parse(fs.readFileSync(file, "utf8"));
								plugins.push(
									new DllReferencePlugin({
										manifest: lib,
										sourceType: "commonjs"
									}).apply(compiler)
								);
							}
						}
						if (!plugins.length) {
							throw new Error(
								`Invalid imported library ${name}: not manifests found!`
							);
						}
					});
					callback();
				});
			}
		);
		compiler.hooks.afterEmit.tapAsync(
			"DllReferenceResolverPlugin",
			(compiler, callback) => {
				const promise = reference.to(compiler.options.name);
				promise.resolve();
				callback();
			}
		);
		compiler.hooks.failed.tap("DllReferenceResolverPlugin", error => {
			const promise = reference.to(compiler.options.name);
			promise.reject(error);
		});
	}
}

function universalTarget(options) {
	function target(compiler) {
		new UniversalTemplatePlugin().apply(compiler);
		new FetchCompileWasmTemplatePlugin().apply(compiler);
		new FunctionModulePlugin().apply(compiler);
		if (options.target === "node") {
			new NodeTargetPlugin().apply(compiler);
		} else {
			new NodeSourcePlugin(compiler.options.node).apply(compiler);
		}
		new LoaderTargetPlugin(
			!options.target || options.target === "universal"
				? "node"
				: options.target
		).apply(compiler);

		// Add plugin to create symbolic link to entry points:
		new EntryPointSymlink().apply(compiler);

		// Add plugin for dll generation
		if (options.dll) {
			new DllPlugin({
				name: `${compiler.options.output.publicPath}${
					compiler.options.output.filename
				}`,
				path: path.resolve(compiler.options.output.path, "[name].json")
			}).apply(compiler);
		}

		// Add plugins for dll reference:
		if (options.imports && options.imports.length) {
			new DllReferenceResolverPlugin(options.libsPath, options.imports).apply(
				compiler
			);
		}
	}
	return target;
}

module.exports = universalTarget;
