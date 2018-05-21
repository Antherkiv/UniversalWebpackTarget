/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes in parts from webpack/lib/web/JsonpChunkTemplatePlugin.js
	and from webpack/lib/node/NodeNodeTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
if (typeof window !== "undefined") window.global = window.global || window;
(function() {
	function wrapPromise(promise, resolve, reject, context) {
		promise.resolve = resolve;
		promise.reject = reject;
		if (context) promise.context = context;
		promise.then = function() {
			return wrapPromise(
				Promise.prototype.then.apply(promise, arguments),
				resolve,
				reject,
				context
			);
		};
		promise.catch = function() {
			return wrapPromise(
				Promise.prototype.catch.apply(promise, arguments),
				resolve,
				reject,
				context
			);
		};
		return promise;
	}
	function loadScript(src, numTries) {
		var doc = document;
		function loader(resolve, reject, retry) {
			var script = doc.createElement("script");
			script.charset = "utf-8";
			script.timeout = 120;
			if (loadScript.nonce) {
				script.setAttribute("nonce", loadScript.nonce);
			}
			script.async = true;
			script.src = src;
			var timeout = setTimeout(function() {
				onScriptComplete({ type: "timeout", target: script });
			}, 120000);
			script.onerror = script.onload = onScriptComplete;
			function onScriptComplete(event) {
				// avoid mem leaks in IE.
				script.onerror = script.onload = null;
				clearTimeout(timeout);
				switch (event.type) {
					case "error":
					case "timeout":
						if (retry === 0) {
							var errorType =
								event && (event.type === "load" ? "missing" : event.type);
							var realSrc = event && event.target && event.target.src;
							var error = new Error(
								"Loading script '" +
									src +
									"' failed.\n(" +
									errorType +
									": " +
									realSrc +
									")"
							);
							error.type = errorType;
							error.request = realSrc;
							reject(error);
						} else {
							setTimeout(function() {
								loader(resolve, reject, retry ? retry - 1 : numTries || 15);
							}, 200);
						}
						break;
					default:
						resolve();
				}
			}
			doc.head.appendChild(script);
		}
		var rr = {};
		var promise = new Promise(function(resolve, reject) {
			rr.resolve = resolve;
			rr.reject = reject;
			loader(resolve, reject);
		});
		return wrapPromise(promise, rr.resolve, rr.reject, src);
	}

	function isPromise(obj) {
		return typeof obj === "object" && obj.resolve && obj.reject;
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	//         _       _           _
	//    __ _| | ___ | |__   __ _| |___
	//   / _` | |/ _ \| '_ \ / _` | / __|
	//  | (_| | | (_) | |_) | (_| | \__ \
	//   \__, |_|\___/|_.__/ \__,_|_|___/
	//   |___/
	//////////////////////////////////////////////////////////////////////////////////////////

	function universalRequireJsonp() {
		if (global.require) {
			if (!global.require.__universalWebpack) {
				throw new Error("An unknown require() is already installed!");
			}
			return;
		}

		var r = function(request) {
			var requiredModule = r.cache[request];
			if (isPromise(requiredModule)) {
				throw new Error("Module '" + request + "' is still loading");
			}
			if (typeof requiredModule === "undefined") {
				throw new Error("Cannot find module '" + request + "'");
			}
			return requiredModule;
		};
		r.cache = {};
		r.load = function load(request) {
			var requiredModule = r.cache[request];
			// a Promise means "currently loading".
			if (isPromise(requiredModule)) {
				return requiredModule;
			}
			if (typeof requiredModule === "undefined") {
				var rr = {};
				var promise = new Promise(function(resolve, reject) {
					rr.resolve = resolve;
					rr.reject = reject;
				});
				promise = wrapPromise(
					Promise.all([loadScript("/" + request), promise]),
					rr.resolve,
					rr.reject,
					request
				).catch(function(error) {
					delete r.cache[request];
					throw error;
				});
				r.cache[request] = promise;
				return promise;
			}
			return wrapPromise(Promise.resolve(), function() {}, function() {});
		};
		r.__universalWebpack = true;
		global.require = r;
	}

	function universalImportJsonp() {
		if (global.import) {
			if (!global.import.__universalWebpack) {
				throw new Error("An unknown import() is already installed!");
			}
			return;
		}

		i = function(request) {
			return global.require.load(request).then(function() {
				return global.require(request);
			});
		};
		i.__universalWebpack = true;
		global.import = i;
	}

	// install a global import() and require()
	universalRequireJsonp();
	universalImportJsonp();

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
					resolves.push(options.i[chunkId].resolve);
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

		function checkDeferredModulesJsonp() {
			var result;
			for (var i = 0; i < options.el.length; i++) {
				var deferredModule = options.el[i];
				var fulfilled = true;
				for (var j = 1; j < deferredModule.length; j++) {
					var depId = deferredModule[j];
					if (options.i[depId] !== 0) fulfilled = false;
				}
				if (fulfilled) {
					options.el.splice(i--, 1);
					result = options.r((options.r.s = deferredModule[0]));
				}
			}
			return result;
		}

		function loadDependenciesJsonp(callback) {
			/**
			 * This function returns a promise which is resolved once
			 * the module with all it's dependencies is loaded.
			 * It also adds the final module to the require() cache.
			 */
			var installedChunks = Object.keys(options.i);

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

			// Load dependencies:
			for (i = 0; i < options.dp.length; i++) {
				promises.push(global.require.load(options.dp[i]));
			}

			// Wait for those to load and fullfil
			var request = options.r.cp;
			var promise = wrapPromise(
				Promise.all(promises),
				function() {},
				function(error) {
					throw error;
				},
				promises
			);
			var requiredModule = global.require.cache[request];
			if (typeof requiredModule === "undefined") {
				global.require.cache[request] = promise;
			}

			for (i = 0; i < installedChunks.length; i++) {
				var chunkId = installedChunks[i];
				preFetchLoadJsonp(chunkId);
				preFetchLoadJsonp(chunkId, promise);
			}

			promise.then(function() {
				var requiredModule = global.require.cache[request];
				if (isPromise(requiredModule)) {
					try {
						global.require.cache[request] = callback();
						requiredModule.resolve();
					} catch (error) {
						delete global.require.cache[request];
						requiredModule.reject(error);
					}
				} else {
					callback();
				}
			});
			return global.require.cache[request];
		}

		// script path function
		function scriptSrcJsonp(chunkId) {
			return "/" + options.r.p + "" + options.s(chunkId);
		}

		/**
		 * Chunk prefetching/preloading for javascript
		 *
		 * @param {any} chunkId Chunk to preload/prefetch
		 * @param {Promise?} async Receives a promise to wait for before prefetching, otherwise preload
		 * @returns {void}
		 */
		function preFetchLoadJsonp(chunkId, async) {
			function preload(rel) {
				var head = document.getElementsByTagName("head")[0];
				chunkData.forEach(function(chunkId) {
					if (typeof options.i[chunkId] === "undefined") {
						options.i[chunkId] = null;
						var link = document.createElement("link");
						link.charset = "utf-8";
						if (options.r.nc) {
							link.setAttribute("nonce", options.r.nc);
						}
						if (async) {
							link.rel = "prefetch";
						} else {
							link.rel = "preload";
							link.as = "script";
						}
						link.href = scriptSrcJsonp(chunkId);
						head.appendChild(link);
					}
				});
			}
			var chunkData = (async ? options.pf : options.pl)[chunkId];
			if (chunkData) {
				if (async) {
					async.then(preload);
				} else {
					preload();
				}
			}
		}

		// This file contains only the entry chunk.
		// The chunk loading function for additional chunks
		function requireEnsureJsonp(chunkId) {
			// JSONP chunk loading for javascript

			var installedChunkData = options.i[chunkId];
			// 0 means "already installed".
			// a Promise means "currently loading".
			if (installedChunkData !== 0) {
				var promise;
				if (installedChunkData) {
					promise = installedChunkData;
				} else {
					// setup Promise in chunk cache
					promise = loadScript(scriptSrcJsonp(chunkId))
						.then(function() {
							var chunk = options.i[chunkId];
							if (chunk !== 0) {
								var errorType = "missing";
								var realSrc = event && event.target && event.target.src;
								throw new Error(
									"Loading chunk '" +
										chunkId +
										"' failed.\n(" +
										errorType +
										": " +
										realSrc +
										")"
								);
							}
						})
						.catch(function(error) {
							delete options.i[chunkId];
							throw error;
						});
					options.i[chunkId] = promise;
				}
				preFetchLoadJsonp(chunkId);
				preFetchLoadJsonp(chunkId, promise);
				return promise;
			}

			promise = wrapPromise(Promise.resolve(), function() {}, function() {});
			return promise;
		}

		// on error function for async loading
		function onErrorJsonp(err) {
			console.error(err);
			throw err; // catch this error by using import().catch()
		}

		var loadDependencies;
		var checkDeferredModules;
		options.r.e = requireEnsureJsonp;
		options.r.oe = onErrorJsonp;
		loadDependencies = loadDependenciesJsonp;
		checkDeferredModules = checkDeferredModulesJsonp;

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
