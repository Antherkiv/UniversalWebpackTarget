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
	options = Object.assign(
		{
			main: false,
			server: false
		},
		options
	);
	function target(compiler) {
		new UniversalTemplatePlugin(options).apply(compiler);
		new FetchCompileWasmTemplatePlugin().apply(compiler);
		new FunctionModulePlugin().apply(compiler);
		if (options.server) {
			new NodeTargetPlugin().apply(compiler);
		} else {
			new NodeSourcePlugin(compiler.options.node).apply(compiler);
		}
		new LoaderTargetPlugin("node").apply(compiler);
	}
	return target;
}

module.exports = universalTarget;
