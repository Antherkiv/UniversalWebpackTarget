if (typeof window !== "undefined") window.global = window.global || window;
(function() {
	//////////////////////////////////////////////////////////////////////////////////////////
	//         _       _           _
	//    __ _| | ___ | |__   __ _| |___
	//   / _` | |/ _ \| '_ \ / _` | / __|
	//  | (_| | | (_) | |_) | (_| | \__ \
	//   \__, |_|\___/|_.__/ \__,_|_|___/
	//   |___/
	//////////////////////////////////////////////////////////////////////////////////////////

	function universalImportNode() {
		if (global.import) {
			if (!global.import.__universalWebpack) {
				throw new Error("An unknown import() is already installed!");
			}
			return;
		}

		i = function(request) {
			return Promise.resolve().then(function() {
				return require(request);
			});
		};
		i.__universalWebpack = true;
		global.import = i;
	}

	// install a global import() and require()
	universalImportNode();

	//////////////////////////////////////////////////////////////////////////////////////////
	//               _                          ___        __   _                      _
	//   _   _ _ __ (_)_   _____ _ __ ___  __ _| \ \      / /__| |__  _ __   __ _  ___| | __
	//  | | | | '_ \| \ \ / / _ \ '__/ __|/ _` | |\ \ /\ / / _ \ '_ \| '_ \ / _` |/ __| |/ /
	//  | |_| | | | | |\ V /  __/ |  \__ \ (_| | | \ V  V /  __/ |_) | |_) | (_| | (__|   <
	//   \__,_|_| |_|_| \_/ \___|_|  |___/\__,_|_|  \_/\_/ \___|_.__/| .__/ \__,_|\___|_|\_\
	//                                                               |_|
	//////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * universalFunction factory
	 *
	 * @param {Object} options Receives options
	 *     options.u  -> __universal__
	 *     options.r  -> __webpack_require__
	 *     options.m  -> modules
	 *     options.s  -> scriptSrc
	 *     options.i  -> installedChunks
	 *     options.el -> deferredModules list
	 *     options.pl -> chunkPreloadMap
	 *     options.pf -> chunkPrefetchMap
	 *     options.dp -> dependencies
	 * @returns {Promise} Promise for signaling load
	 */
	function universalFunctionFactory(options) {
		/**
		 * universalChunkFunction (webpackJsonp callback)
		 *
		 * @param {Object} data Receives options
		 *     data.i  -> chunkIds
		 *     data.m  -> moreModules
		 *     data.e  -> executeModules
		 * @returns {any} result
		 */
		// install a chunks function for chunk loading
		function universalChunkFunction(data) {
			// add "moreModules" to the modules object,
			// then flag all "chunkIds" as loaded and fire callback
			var moduleId,
				chunkId,
				resolves = [];
			for (var i = 0; i < data.i.length; i++) {
				chunkId = data.i[i];
				if (options.i[chunkId]) {
					resolves.push(options.i[chunkId][0]);
				}
				options.i[chunkId] = 0;
			}
			for (moduleId in data.m) {
				if (Object.prototype.hasOwnProperty.call(data.m, moduleId)) {
					options.m[moduleId] = data.m[moduleId];
				}
			}

			if (parentUniversalChunkFunction) parentUniversalChunkFunction(data);
			while (resolves.length) {
				resolves.shift()();
			}

			// add entry modules from loaded chunk to deferred list
			options.el.push.apply(options.el, data.e || []);

			// Deferred modules will be run when loading of the main module is
			// initialized (after all dependencies and deferred chunks are loaded)
			// so no call to checkDeferredModules() here.
		}

		function checkDeferredModulesNode() {
			var result;
			for (var i = 0; i < options.el.length; i++) {
				var deferredModule = options.el[i];
				options.el.splice(i--, 1);
				result = options.r((options.r.s = deferredModule[0]));
			}
			return result;
		}

		function loadDependenciesNode(callback) {
			/**
			 * This function returns a promise which is resolved once
			 * the module with all it's dependencies is loaded.
			 */
			var promises = [];

			// Load deferred modules:
			for (var i = 0; i < options.el.length; i++) {
				var deferredModule = options.el[i];
				for (var j = 1; j < deferredModule.length; j++) {
					var depId = deferredModule[j];
					if (options.i[depId] !== 0) {
						promises.push(options.r.e(depId));
					}
				}
			}

			return callback();
		}

		// script path function
		function scriptSrcNode(chunkId) {
			return options.r.p + "" + options.s(chunkId);
		}

		// This file contains only the entry chunk.
		// The chunk loading function for additional chunks
		function requireEnsureNode(chunkId) {
			// require() chunk loading for javascript

			var installedChunkData = options.i[chunkId];

			// 0 means "already installed".
			// a Promise means "currently loading".
			if (installedChunkData !== 0) {
				var chunk = require(scriptSrcNode(chunkId));
				options.u.chunks = options.u.chunks || [];
				options.u.chunks.push(chunk);
			}

			return Promise.resolve();
		}

		// on error function for async loading
		function onErrorNode(err) {
			process.nextTick(function() {
				throw err; // catch this error by using import().catch()
			});
		}

		var loadDependencies;
		var checkDeferredModules;
		options.r.e = requireEnsureNode;
		options.r.oe = onErrorNode;
		loadDependencies = loadDependenciesNode;
		checkDeferredModules = checkDeferredModulesNode;

		options.u.chunks = options.u.chunks || [];
		var oldUniversalChunkFunction = options.u.chunks.push.bind(
			options.u.chunks
		);
		options.u.chunks.push = universalChunkFunction;
		var chunksArray = options.u.chunks.slice();
		for (var i = 0; i < chunksArray.length; i++) {
			universalChunkFunction(chunksArray[i]);
		}
		var parentUniversalChunkFunction = oldUniversalChunkFunction;

		if (parentUniversalFunction) parentUniversalFunction(options);

		// Wait for dependencies and chunks to load...
		return loadDependencies(function() {
			// run deferred modules when all chunks ready
			return checkDeferredModules();
		});
	}

	// install a callback for universal modules loading
	global.webpackUniversal = global.webpackUniversal || [];
	var oldUniversalFunction = global.webpackUniversal.push.bind(
		global.webpackUniversal
	);
	global.webpackUniversal.push = universalFunctionFactory;
	var universalArray = global.webpackUniversal.slice();
	for (var i = 0; i < universalArray.length; i++) {
		universalFunctionFactory(universalArray[i]);
	}
	var parentUniversalFunction = oldUniversalFunction;

	if (typeof module !== "undefined") module.exports = global.webpackUniversal;
})();
