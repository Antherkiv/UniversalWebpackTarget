if (typeof window !== "undefined") window.global = window.global || window;
(function() {
	var __emptyPromise = [function() {}, function() {}];

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
			if (!global.require.__webpackUniversal) {
				throw new Error("An unknown require() is already installed!");
			}
			return;
		}

		var r = function(request) {
			var requiredModule = r.cache[request];
			if (
				typeof requiredModule === "object" &&
				requiredModule.__webpackPromise
			) {
				throw new Error("Module is still loading");
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
			if (
				typeof requiredModule === "object" &&
				requiredModule.__webpackPromise
			) {
				return requiredModule;
			}
			if (typeof requiredModule === "undefined") {
				// setup Promise in requests cache
				var __webpackPromise = [];
				var promise = new Promise(function(resolve, reject) {
					__webpackPromise.push(resolve);
					__webpackPromise.push(reject);
				});
				__webpackPromise.push(promise);
				promise.__webpackPromise = __webpackPromise;
				r.cache[request] = promise;

				// start request loading
				var head = document.getElementsByTagName("head")[0];
				var script = document.createElement("script");
				script.charset = "utf-8";
				script.timeout = 120;
				if (r.nonce) {
					script.setAttribute("nonce", r.nonce);
				}
				script.src = "/" + request;
				var timeout = setTimeout(function() {
					onScriptError({ type: "timeout", target: script });
				}, 120000);
				script.onload = onScriptLoad;
				script.onerror = onScriptError;
				// eslint-disable-next-line no-inner-declarations
				function onScriptLoad(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeout);
				}
				// eslint-disable-next-line no-inner-declarations
				function onScriptError(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeout);
					var requiredModule = r.cache[request];
					if (
						typeof requiredModule === "object" &&
						requiredModule.__webpackPromise
					) {
						var errorType =
							event && (event.type === "load" ? "missing" : event.type);
						var realSrc = event && event.target && event.target.src;
						var error = new Error(
							"Loading module '" +
								request +
								"' failed.\n(" +
								errorType +
								": " +
								realSrc +
								")"
						);
						error.type = errorType;
						error.request = realSrc;
						requiredModule.__webpackPromise[1](error);
						r.cache[request] = undefined;
					}
				}
				head.appendChild(script);
				return promise;
			}
			promise = Promise.resolve();
			promise.__webpackPromise = __emptyPromise;
			return promise;
		};
		r.__webpackUniversal = true;
		global.require = r;
	}

	function universalImportJsonp() {
		if (global.import) {
			if (!global.import.__webpackUniversal) {
				throw new Error("An unknown import() is already installed!");
			}
			return;
		}

		i = function(request) {
			return global.require.load(request).then(function() {
				return global.require(request);
			});
		};
		i.__webpackUniversal = true;
		global.import = i;
	}

	function universalImportNode() {
		if (global.import) {
			if (!global.import.__webpackUniversal) {
				throw new Error("An unknown import() is already installed!");
			}
			return;
		}

		i = function(request) {
			return Promise.resolve().then(function() {
				return require(request);
			});
		};
		i.__webpackUniversal = true;
		global.import = i;
	}

	// install a global import() and require()
	if (typeof window === "undefined") {
		universalImportNode();
	} else {
		universalRequireJsonp();
		universalImportJsonp();
	}

	//////////////////////////////////////////////////////////////////////////////////////////
	//                _                      _    _   _       _                          _
	//  __      _____| |__  _ __   __ _  ___| | _| | | |_ __ (_)_   _____ _ __ ___  __ _| |
	//  \ \ /\ / / _ \ '_ \| '_ \ / _` |/ __| |/ / | | | '_ \| \ \ / / _ \ '__/ __|/ _` | |
	//   \ V  V /  __/ |_) | |_) | (_| | (__|   <| |_| | | | | |\ V /  __/ |  \__ \ (_| | |
	//    \_/\_/ \___|_.__/| .__/ \__,_|\___|_|\_\\___/|_| |_|_| \_/ \___|_|  |___/\__,_|_|
	//                     |_|
	//////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * webpackUniversal factory
	 *
	 * @param {Object} options Receives options
	 *     options.u  -> __webpackUniversal__
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
	function webpackUniversalFactory(options) {
		/**
		 * webpackJsonp callback
		 *
		 * @param {Object} data Receives options
		 *     data.i  -> chunkIds
		 *     data.m  -> moreModules
		 *     data.e  -> executeModules
		 * @returns {any} result
		 */
		// install a JSONP callback for chunk loading
		function webpackJsonpCallback(data) {
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

			if (parentJsonpFunction) parentJsonpFunction(data);
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

		function checkDeferredModulesNode() {
			var result;
			for (var i = 0; i < options.el.length; i++) {
				var deferredModule = options.el[i];
				options.el.splice(i--, 1);
				result = options.r((options.r.s = deferredModule[0]));
			}
			return result;
		}

		function loadDependenciesJsonp(callback) {
			/**
			 * This function returns a promise which is resolved once
			 * the module with all it's dependencies is loaded.
			 * It also adds the final module to the require() cache.
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

			// Load dependencies:
			for (i = 0; i < options.dp.length; i++) {
				promises.push(global.require.load(options.dp[i]));
			}

			// Wait for those to load and fullfil
			var request = options.r.cp;
			var promise = Promise.all(promises);
			promise.__webpackPromise = __emptyPromise;
			var requiredModule = global.require.cache[request];
			if (typeof requiredModule === "undefined") {
				global.require.cache[request] = promise;
			}
			promise.then(function() {
				var requiredModule = global.require.cache[request];
				if (
					typeof requiredModule === "object" &&
					requiredModule.__webpackPromise
				) {
					try {
						global.require.cache[request] = callback();
						requiredModule.__webpackPromise[0]();
					} catch (error) {
						global.require.cache[request] = undefined;
						requiredModule.__webpackPromise[1](error);
					}
				} else {
					callback();
				}
			});
			return global.require.cache[request];
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
		function scriptSrcJsonp(chunkId) {
			return "/" + options.r.p + "" + options.s(chunkId);
		}

		function scriptSrcNode(chunkId) {
			return "./" + options.r.p + "" + options.s(chunkId);
		}

		// This file contains only the entry chunk.
		// The chunk loading function for additional chunks
		function requireEnsureJsonp(chunkId) {
			// JSONP chunk loading for javascript

			var promises = [];

			var installedChunkData = options.i[chunkId];
			// 0 means "already installed".
			// a Promise means "currently loading".

			if (installedChunkData !== 0) {
				if (installedChunkData) {
					promises.push(installedChunkData[2]);
				} else {
					// setup Promise in chunk cache
					var promise = new Promise(function(resolve, reject) {
						installedChunkData = options.i[chunkId] = [resolve, reject];
					});
					promises.push((installedChunkData[2] = promise));

					// start chunk loading
					var head = document.getElementsByTagName("head")[0];
					var script = document.createElement("script");

					script.charset = "utf-8";
					script.timeout = 120;

					if (options.r.nc) {
						script.setAttribute("nonce", options.r.nc);
					}
					script.src = scriptSrcJsonp(chunkId);
					var timeout = setTimeout(function() {
						onScriptComplete({ type: "timeout", target: script });
					}, 120000);
					script.onerror = script.onload = onScriptComplete;
					// eslint-disable-next-line no-inner-declarations
					function onScriptComplete(event) {
						// avoid mem leaks in IE.
						script.onerror = script.onload = null;
						clearTimeout(timeout);
						var chunk = options.i[chunkId];
						if (chunk !== 0) {
							if (chunk) {
								var errorType =
									event && (event.type === "load" ? "missing" : event.type);
								var realSrc = event && event.target && event.target.src;
								var error = new Error(
									"Loading chunk " +
										chunkId +
										" failed.\n(" +
										errorType +
										": " +
										realSrc +
										")"
								);
								error.type = errorType;
								error.request = realSrc;
								chunk[1](error);
							}
							options.i[chunkId] = undefined;
						}
					}
					head.appendChild(script);
				}

				// chunk preloading for javascript
				var chunkPreloadData = options.pl[chunkId];
				if (chunkPreloadData) {
					head = document.getElementsByTagName("head")[0];
					chunkPreloadData.forEach(function(chunkId) {
						if (options.i[chunkId] === undefined) {
							options.i[chunkId] = null;
							var link = document.createElement("link");

							link.charset = "utf-8";

							if (options.r.nc) {
								link.setAttribute("nonce", options.r.nc);
							}
							link.rel = "preload";
							link.as = "script";
							link.href = scriptSrcJsonp(chunkId);
							head.appendChild(link);
						}
					});
				}

				// chunk prefetching for javascript
				var chunkPrefetchData = options.pf[chunkId];
				if (chunkPrefetchData) {
					Promise.all(promises).then(function() {
						var head = document.getElementsByTagName("head")[0];
						chunkPrefetchData.forEach(function(chunkId) {
							if (options.i[chunkId] === undefined) {
								options.i[chunkId] = null;
								var link = document.createElement("link");
								link.rel = "prefetch";
								link.href = scriptSrcJsonp(chunkId);
								head.appendChild(link);
							}
						});
					});
				}
			}

			return Promise.all(promises);
		}

		function requireEnsureNode(chunkId) {
			// require() chunk loading for javascript

			var installedChunkData = options.i[chunkId];

			// 0 means "already installed".
			// a Promise means "currently loading".
			if (installedChunkData !== 0) {
				var chunk = require(scriptSrcNode(chunkId));
				options.u.jsonp = options.u.jsonp || [];
				options.u.jsonp.push(chunk);
			}

			return Promise.resolve();
		}

		// on error function for async loading
		function onErrorJsonp(err) {
			console.error(err);
			throw err; // catch this error by using import().catch()
		}

		function onErrorNode(err) {
			process.nextTick(function() {
				throw err; // catch this error by using import().catch()
			});
		}

		var loadDependencies;
		var checkDeferredModules;
		if (typeof window === "undefined") {
			options.r.e = requireEnsureNode;
			options.r.oe = onErrorNode;
			loadDependencies = loadDependenciesNode;
			checkDeferredModules = checkDeferredModulesNode;
		} else {
			options.r.e = requireEnsureJsonp;
			options.r.oe = onErrorJsonp;
			loadDependencies = loadDependenciesJsonp;
			checkDeferredModules = checkDeferredModulesJsonp;
		}

		options.u.jsonp = options.u.jsonp || [];
		var oldJsonpFunction = options.u.jsonp.push.bind(options.u.jsonp);
		options.u.jsonp.push = webpackJsonpCallback;
		var jsonpArray = options.u.jsonp.slice();
		for (var i = 0; i < jsonpArray.length; i++) {
			webpackJsonpCallback(jsonpArray[i]);
		}
		var parentJsonpFunction = oldJsonpFunction;

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
	global.webpackUniversal.push = webpackUniversalFactory;
	var universalArray = global.webpackUniversal.slice();
	for (var i = 0; i < universalArray.length; i++) {
		webpackUniversalFactory(universalArray[i]);
	}
	var parentUniversalFunction = oldUniversalFunction;

	if (typeof module !== "undefined") module.exports = global.webpackUniversal;
})();
