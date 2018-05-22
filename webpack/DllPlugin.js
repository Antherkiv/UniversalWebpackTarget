/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Authors Tobias Koppers @sokra
	        Germán Méndez Bravo (Kronuz)

	This comes mainly from webpack/lib/DllPlugin.js
	Uses ./LibManifestPlugin.js instead of webpack/lib/LibManifestPlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
"use strict";

const DllEntryPlugin = require("webpack/lib/DllEntryPlugin");
const LibManifestPlugin = require("./LibManifestPlugin");
// const FlagInitialModulesAsUsedPlugin = require("webpack/lib/FlagInitialModulesAsUsedPlugin");

const validateOptions = require("schema-utils");
const schema = require("webpack/schemas/plugins/DllPlugin.json");

class DllPlugin {
	constructor(options) {
		validateOptions(schema, options, "Dll Plugin");
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.entryOption.tap("DllPlugin", (context, entry) => {
			const itemToPlugin = (item, name) => {
				if (Array.isArray(item)) return new DllEntryPlugin(context, item, name);
				else throw new Error("DllPlugin: supply an Array as entry");
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
		// new FlagInitialModulesAsUsedPlugin("DllPlugin").apply(compiler);
	}
}

module.exports = DllPlugin;
