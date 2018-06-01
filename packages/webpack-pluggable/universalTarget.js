/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/WebpackOptionsApply.js
	from processing "web" target
	[https://github.com/webpack/webpack/tree/v4.8.3]
*/
"use strict";

const FetchCompileWasmTemplatePlugin = require("webpack/lib/web/FetchCompileWasmTemplatePlugin");
const FunctionModulePlugin = require("webpack/lib/FunctionModulePlugin");
const LoaderTargetPlugin = require("webpack/lib/LoaderTargetPlugin");
const NodeSourcePlugin = require("webpack/lib/node/NodeSourcePlugin");
const NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");

const UniversalTemplatePlugin = require("./UniversalTemplatePlugin");

function universalTarget(options) {
	function target(compiler) {
		new UniversalTemplatePlugin(options).apply(compiler);
		new FetchCompileWasmTemplatePlugin().apply(compiler);
		new FunctionModulePlugin().apply(compiler);
		new NodeSourcePlugin(compiler.options.node).apply(compiler);
		new NodeTargetPlugin().apply(compiler);
		new LoaderTargetPlugin("node").apply(compiler);
	}
	return target;
}

module.exports = universalTarget;
