/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/WebpackOptionsApply.js
	from processing "web" target
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const fs = require("fs");
const path = require("path");

const FetchCompileWasmTemplatePlugin = require("webpack/lib/web/FetchCompileWasmTemplatePlugin");
const FunctionModulePlugin = require("webpack/lib/FunctionModulePlugin");
const LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin");
const NodeSourcePlugin = require("webpack/lib/node/NodeSourcePlugin");
const UniversalTemplatePlugin = require("./UniversalTemplatePlugin");
const DllPlugin = require("webpack/lib/DllPlugin");
const DllReferencePlugin = require("webpack/lib/DllReferencePlugin");

function universalTarget(options) {
	function target(compiler) {
		new UniversalTemplatePlugin().apply(compiler);
		new FetchCompileWasmTemplatePlugin().apply(compiler);
		new FunctionModulePlugin().apply(compiler);
		new NodeSourcePlugin(compiler.options.node).apply(compiler);
		new LoaderTargetPlugin(options.target || "node").apply(compiler);

		if (options.dll) {
			new DllPlugin({
				name: `${compiler.options.output.publicPath}${compiler.options.output.filename}`,
				path: path.resolve(compiler.options.output.path, "[name].json"),
			}).apply(compiler);
		}

		if (options.imports) {
			const libsPath = options.libsPath || compiler.options.output.path;
			options.imports.forEach(function(name) {
				const libFile = path.resolve(libsPath, name, `${name}.json`);
				if (!fs.existsSync(libFile)) {
				console.error(
					`Skip imported library ${name}: path not found: ${libFile}`
				);
				process.exit(1);
				}
				const lib = JSON.parse(fs.readFileSync(libFile, "utf8"));
				new DllReferencePlugin({
					manifest: lib,
					sourceType: "commonjs",
				}).apply(compiler);
			});
		}
	}
	return target;
}

module.exports = universalTarget;
