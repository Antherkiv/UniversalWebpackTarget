const EntrySymlinkPlugin = require("./EntrySymlinkPlugin");
const MiniCssExtractPlugin = require("./MiniCssExtractPlugin");
const PluggablePlugin = require("./PluggablePlugin");
const UniversalChunkTemplatePlugin = require("./UniversalChunkTemplatePlugin");
const UniversalMainTemplatePlugin = require("./UniversalMainTemplatePlugin");
const runtime = require("./Universal.runtime");
const UniversalTemplatePlugin = require("./UniversalTemplatePlugin");
const target = require("./universalTarget");

module.exports = {
	EntrySymlinkPlugin,
	MiniCssExtractPlugin,
	PluggablePlugin,
	UniversalChunkTemplatePlugin,
	UniversalMainTemplatePlugin,
	runtime,
	UniversalTemplatePlugin,
	target
};
