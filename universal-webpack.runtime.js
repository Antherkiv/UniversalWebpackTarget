if (typeof window !== "undefined") window.global = window.global || window;
(function() {
	var __emptyPromise = [function() {}, function() {}];

	////////////////////////////////////////////////////////////////////
	// Global universal require()

	function requireFactory() {
		function require(request) {
			var requiredModule = require.cache[request];
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
		}
		require.cache = {};
		require.load = function load(request) {
			var requiredModule = require.cache[request];
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
				require.cache[request] = promise;

				// start request loading
				var head = document.getElementsByTagName("head")[0];
				var script = document.createElement("script");
				script.charset = "utf-8";
				script.timeout = 120;
				if (require.nonce) {
					script.setAttribute("nonce", require.nonce);
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
					var requiredModule = require.cache[request];
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
						require.cache[request] = undefined;
					}
				}
				head.appendChild(script);
				return promise;
			}
			promise = Promise.resolve();
			promise.__webpackPromise = __emptyPromise;
			return promise;
		};
		return require;
	}

	function webpackUniversalFactory(
		__webpackUniversal__,
		__webpack_require__,
		modules,
		scriptSrc,
		installedChunks,
		deferredModules,
		chunkPreloadMap,
		chunkPrefetchMap,
		dependencies
	) {
		// install a JSONP callback for chunk loading
		function webpackJsonpCallback(data) {
			var chunkIds = data[0];
			var moreModules = data[1];
			var executeModules = data[2];
			// add "moreModules" to the modules object,
			// then flag all "chunkIds" as loaded and fire callback
			var moduleId,
				chunkId,
				resolves = [];
			for (var i = 0; i < chunkIds.length; i++) {
				chunkId = chunkIds[i];
				if (installedChunks[chunkId]) {
					resolves.push(installedChunks[chunkId][0]);
				}
				installedChunks[chunkId] = 0;
			}
			for (moduleId in moreModules) {
				if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
					modules[moduleId] = moreModules[moduleId];
				}
			}
			if (parentJsonpFunction) parentJsonpFunction(data);
			while (resolves.length) {
				resolves.shift()();
			}

			// add entry modules from loaded chunk to deferred list
			deferredModules.push.apply(deferredModules, executeModules || []);

			// run deferred modules when all chunks ready
			return checkDeferredModules();
		}

		function checkDeferredModules() {
			var result;
			for (var i = 0; i < deferredModules.length; i++) {
				var deferredModule = deferredModules[i];
				var fulfilled = true;
				for (var j = 1; j < deferredModule.length; j++) {
					var depId = deferredModule[j];
					if (installedChunks[depId] !== 0) fulfilled = false;
				}
				if (fulfilled) {
					deferredModules.splice(i--, 1);
					result = __webpack_require__(
						(__webpack_require__.s = deferredModule[0])
					);
				}
			}
			return result;
		}

		// script path function
		function requireScriptSrc(chunkId) {
			return "./" + __webpack_require__.p + "" + scriptSrc(chunkId);
		}

		function jsonpScriptSrc(chunkId) {
			return "/" + __webpack_require__.p + "" + scriptSrc(chunkId);
		}

		// This file contains only the entry chunk.
		// The chunk loading function for additional chunks
		__webpack_require__.e = function requireEnsure(chunkId) {
			var promises = [];

			var installedChunkData = installedChunks[chunkId];
			// 0 means "already installed".
			// a Promise means "currently loading".

			// require() chunk loading for javascript
			if (typeof window === "undefined") {
				if (installedChunkData !== 0) {
					var chunk = require(requireScriptSrc(chunkId));
					__webpackUniversal__.jsonp = __webpackUniversal__.jsonp || [];
					__webpackUniversal__.jsonp.push(chunk);
				}
				return Promise.all(promises);
			}

			// JSONP chunk loading for javascript
			if (installedChunkData !== 0) {
				if (installedChunkData) {
					promises.push(installedChunkData[2]);
				} else {
					// setup Promise in chunk cache
					var promise = new Promise(function(resolve, reject) {
						installedChunkData = installedChunks[chunkId] = [resolve, reject];
					});
					promises.push((installedChunkData[2] = promise));

					// start chunk loading
					var head = document.getElementsByTagName("head")[0];
					var script = document.createElement("script");

					script.charset = "utf-8";
					script.timeout = 120;

					if (__webpack_require__.nc) {
						script.setAttribute("nonce", __webpack_require__.nc);
					}
					script.src = jsonpScriptSrc(chunkId);
					var timeout = setTimeout(function() {
						onScriptComplete({ type: "timeout", target: script });
					}, 120000);
					script.onerror = script.onload = onScriptComplete;
					// eslint-disable-next-line no-inner-declarations
					function onScriptComplete(event) {
						// avoid mem leaks in IE.
						script.onerror = script.onload = null;
						clearTimeout(timeout);
						var chunk = installedChunks[chunkId];
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
							installedChunks[chunkId] = undefined;
						}
					}
					head.appendChild(script);
				}

				// chunk preloading for javascript
				var chunkPreloadData = chunkPreloadMap[chunkId];
				if (chunkPreloadData) {
					head = document.getElementsByTagName("head")[0];
					chunkPreloadData.forEach(function(chunkId) {
						if (installedChunks[chunkId] === undefined) {
							installedChunks[chunkId] = null;
							var link = document.createElement("link");

							link.charset = "utf-8";

							if (__webpack_require__.nc) {
								link.setAttribute("nonce", __webpack_require__.nc);
							}
							link.rel = "preload";
							link.as = "script";
							link.href = jsonpScriptSrc(chunkId);
							head.appendChild(link);
						}
					});
				}

				// chunk prefetching for javascript

				var chunkPrefetchData = chunkPrefetchMap[chunkId];
				if (chunkPrefetchData) {
					Promise.all(promises).then(function() {
						var head = document.getElementsByTagName("head")[0];
						chunkPrefetchData.forEach(function(chunkId) {
							if (installedChunks[chunkId] === undefined) {
								installedChunks[chunkId] = null;
								var link = document.createElement("link");
								link.rel = "prefetch";
								link.href = jsonpScriptSrc(chunkId);
								head.appendChild(link);
							}
						});
					});
				}
			}

			return Promise.all(promises);
		};

		// on error function for async loading
		__webpack_require__.oe = function onError(err) {
			if (process && process.nextTick) {
				process.nextTick(function() {
					throw err; // catch this error by using import().catch()
				});
			} else {
				console.error(err);
				throw err; // catch this error by using import().catch()
			}
		};

		__webpackUniversal__.jsonp = __webpackUniversal__.jsonp || [];
		var oldJsonpFunction = __webpackUniversal__.jsonp.push.bind(
			__webpackUniversal__.jsonp
		);
		__webpackUniversal__.jsonp.push = webpackJsonpCallback;
		var jsonpArray = __webpackUniversal__.jsonp.slice();
		for (var i = 0; i < jsonpArray.length; i++) {
			webpackJsonpCallback(jsonpArray[i]);
		}
		var parentJsonpFunction = oldJsonpFunction;

		var promises = [];
		for (i = 0; i < dependencies.length; i++) {
			promises.push(global.require.load(dependencies[i]));
		}

		var request = __webpack_require__.cp;
		var promise = Promise.all(promises);
		var requiredModule = global.require.cache[request];
		if (typeof requiredModule === "object" && requiredModule.__webpackPromise) {
			promise.__webpackPromise = requiredModule.__webpackPromise;
		} else {
			promise.__webpackPromise = __emptyPromise;
		}
		global.require.cache[request] = promise;
		promise.then(function() {
			var requiredModule = global.require.cache[request];
			try {
				global.require.cache[request] = checkDeferredModules();
				if (
					typeof requiredModule === "object" &&
					requiredModule.__webpackPromise
				) {
					requiredModule.__webpackPromise[0]();
				}
			} catch (error) {
				global.require.cache[request] = undefined;
				if (
					typeof requiredModule === "object" &&
					requiredModule.__webpackPromise
				) {
					requiredModule.__webpackPromise[1](error);
				}
			}
		});
		return global.require.cache[request];
	}

	global.require = global.require || requireFactory();
	global.require.load = global.require.load || function() {};
	global.require.cache = global.require.cache || {};

	global.webpackUniversalFactory = webpackUniversalFactory;
	if (typeof module !== "undefined") module.exports = webpackUniversalFactory;
})();
