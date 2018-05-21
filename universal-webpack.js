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

		if (options.dll) {
			new DllPlugin({
				name: `${compiler.options.output.publicPath}${
					compiler.options.output.filename
				}`,
				path: path.resolve(compiler.options.output.path, "[name].json")
			}).apply(compiler);
		}

		if (options.imports) {
			const libsPath = options.libsPath || compiler.options.output.path;
			options.imports.forEach(function(name) {
				const plugins = [];
				for (const file of glob.sync(path.resolve(libsPath, name, "*.json"))) {
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
					console.warn(
						`Invalid imported library ${name}: not manifests found!`
					);
					process.exit(1);
				}
			});
		}
	}
	return target;
}

module.exports = universalTarget;
