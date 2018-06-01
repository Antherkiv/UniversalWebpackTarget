/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/DllPlugin.js
	Uses ./LibManifestPlugin.js instead of webpack/lib/LibManifestPlugin.js
	Monkey-patches Dll main export to run entry point when called without parameters
	or be __webpack_require__ otherwise
	[https://github.com/webpack/webpack/tree/v4.10.2]
*/
"use strict";

const DllEntryPlugin = require("webpack/lib/DllEntryPlugin");
const LibManifestPlugin = require("./LibManifestPlugin");
const FlagInitialModulesAsUsedPlugin = require("webpack/lib/FlagInitialModulesAsUsedPlugin");
const { RawSource } = require("webpack-sources");

const validateOptions = require("schema-utils");
const schema = require("webpack/schemas/plugins/DllPlugin.json");
const Template = require("webpack/lib/Template");
const DllModule = require("webpack/lib/DllModule");

// This monkey-patch is almost a copy of MultiModule.source()
// and it adds the return of __webpack_require__() as regular DllModule
// when returned
function source(dependencyTemplates, runtimeTemplate) {
	const str = [];
	str.push("module.exports = function() {\n");
	str.push("\tif (arguments.length) {\n");
	str.push("\t\treturn __webpack_require__.apply(this, arguments);\n");
	str.push("\t} else {\n");
	let idx = 0;
	for (const dep of this.dependencies) {
		str.push("\t\t");
		if (dep.module) {
			if (idx === this.dependencies.length - 1) str.push("return ");
			str.push("__webpack_require__(");
			if (runtimeTemplate.outputOptions.pathinfo)
				str.push(Template.toComment(dep.request));
			str.push(`${JSON.stringify(dep.module.id)}`);
			str.push(")");
		} else {
			const content = require("webpack/lib/dependencies/WebpackMissingModule").module(
				dep.request
			);
			str.push(content);
		}
		str.push(";\n");
		idx++;
	}
	str.push("\t}\n");
	str.push("}\n");
	return new RawSource(str.join(""));
}
DllModule.prototype.source = source;

class DllPlugin {
	constructor(options) {
		validateOptions(schema, options, "Dll Plugin");
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.entryOption.tap("DllPlugin", (context, entry) => {
			const itemToPlugin = (item, name) => {
				if (Array.isArray(item)) {
					return new DllEntryPlugin(context, item, name);
				}
				throw new Error("DllPlugin: supply an Array as entry");
			};
			if (typeof entry === "object" && !Array.isArray(entry)) {
				Object.keys(entry).forEach(name => {
					itemToPlugin(entry[name], name).apply(compiler);
				});
			} else {
				itemToPlugin(entry, "main").apply(compiler);
			}
			return true;
		});
		new LibManifestPlugin(this.options).apply(compiler);
		if (!this.options.entryOnly) {
			new FlagInitialModulesAsUsedPlugin("DllPlugin").apply(compiler);
		}
	}
}

module.exports = DllPlugin;
