/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)
*/
"use strict";

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const DllPlugin = require("./DllPlugin");
const DllReferencePlugin = require("webpack/lib/DllReferencePlugin");

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

class PluggablePlugin {
	constructor(main, libsPath, imports) {
		this.main = main;
		this.libsPath = libsPath;
		this.imports = imports;
	}

	apply(compiler) {
		if (!this.main) {
			new DllPlugin({
				name: `${compiler.options.output.publicPath}${
					compiler.options.output.filename
				}`,
				path: path.resolve(compiler.options.output.path, "[name].json")
			}).apply(compiler);
		}

		const libsPath = this.libsPath || compiler.options.output.path;
		const imports = this.imports || [];

		compiler.hooks.beforeRun.tapAsync(
			"PluggablePlugin",
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
			"PluggablePlugin",
			(compiler, callback) => {
				const promise = reference.to(compiler.options.name);
				promise.resolve();
				callback();
			}
		);
		compiler.hooks.failed.tap("PluggablePlugin", error => {
			const promise = reference.to(compiler.options.name);
			promise.reject(error);
		});
	}
}

module.exports = PluggablePlugin;
