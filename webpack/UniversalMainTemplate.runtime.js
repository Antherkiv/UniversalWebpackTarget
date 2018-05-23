/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes in parts from webpack/lib/web/JsonpChunkTemplatePlugin.js
	and from webpack/lib/node/NodeNodeTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/8d36df13aa35e2f2cb83f1afe5f626d4fb83d107]
*/
(function() {
	var runtimeInstall = function() {
		//
		//   _   _       _                          _   ____              _   _
		//  | | | |_ __ (_)_   _____ _ __ ___  __ _| | |  _ \ _   _ _ __ | |_(_)_ __ ___   ___
		//  | | | | '_ \| \ \ / / _ \ '__/ __|/ _` | | | |_) | | | | '_ \| __| | '_ ` _ \ / _ \
		//  | |_| | | | | |\ V /  __/ |  \__ \ (_| | | |  _ <| |_| | | | | |_| | | | | | |  __/
		//   \___/|_| |_|_| \_/ \___|_|  |___/\__,_|_| |_| \_\\__,_|_| |_|\__|_|_| |_| |_|\___|
		//
		var handleError =
			global.showFailureMessage ||
			function(error) {
				throw error;
			};
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

		/*
		* Returns the next wait interval, in milliseconds,
		* using an exponential backoff algorithm.
		*/
		function getWaitTimeExp(retryCount) {
			var waitTime = Math.pow(2, retryCount) * 100;
			return waitTime;
		}
		function loadScript(src, timeout, maxRetries) {
			timeout = timeout || 120;
			maxRetries = maxRetries || 10;
			var doc = document;
			function loader(resolve, reject, retryCount) {
				var script = doc.createElement("script");
				script.charset = "utf-8";
				script.timeout = timeout;
				if (loadScript.nonce) {
					script.setAttribute("nonce", loadScript.nonce);
				}
				script.async = true;
				var timeoutTimer = setTimeout(function() {
					onScriptComplete({ type: "timeout", target: script });
				}, timeout * 1000);
				script.onerror = script.onload = onScriptComplete;
				function onScriptComplete(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeoutTimer);
					switch (event.type) {
						case "error":
						case "timeout":
							if (++retryCount >= maxRetries) {
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
									loader(resolve, reject, retryCount);
								}, getWaitTimeExp(retryCount));
							}
							break;
						default:
							resolve();
					}
				}
				script.src = src;
				doc.head.appendChild(script);
			}
			var rr = {};
			var promise = new Promise(function(resolve, reject) {
				rr.resolve = resolve;
				rr.reject = reject;
				loader(resolve, reject, 0);
			});
			return wrapPromise(promise, rr.resolve, rr.reject, src);
		}

		function loadCss(href, timeout, maxRetries) {
			timeout = timeout || 120;
			maxRetries = maxRetries || 10;
			var doc = document;
			function loader(resolve, reject, retryCount) {
				var existingLinkTags = doc.getElementsByTagName("link");
				for (var i = 0; i < existingLinkTags.length; i++) {
					var tag = existingLinkTags[i];
					var dataHref =
						tag.getAttribute("data-href") || tag.getAttribute("href");
					if (tag.rel === "stylesheet" && dataHref === href) return resolve();
				}
				var existingStyleTags = doc.getElementsByTagName("style");
				for (i = 0; i < existingStyleTags.length; i++) {
					tag = existingStyleTags[i];
					dataHref = tag.getAttribute("data-href");
					if (dataHref === href) return resolve();
				}
				var link = doc.createElement("link");
				link.rel = "stylesheet";
				link.type = "text/css";
				var timeoutTimer = setTimeout(function() {
					onScriptComplete({ type: "timeout", target: link });
				}, timeout * 1000);
				link.onerror = link.onload = onScriptComplete;
				function onScriptComplete(event) {
					// avoid mem leaks in IE.
					link.onerror = link.onload = null;
					clearTimeout(timeoutTimer);
					switch (event.type) {
						case "error":
						case "timeout":
							if (++retryCount >= maxRetries) {
								var errorType =
									event && (event.type === "load" ? "missing" : event.type);
								var realSrc = event && event.target && event.target.src;
								var error = new Error(
									"Loading CSS '" +
										href +
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
									loader(resolve, reject, retryCount);
								}, getWaitTimeExp(retryCount));
							}
							break;
						default:
							resolve();
					}
				}
				link.href = href;
				doc.head.appendChild(link);
			}
			var rr = {};
			var promise = new Promise(function(resolve, reject) {
				rr.resolve = resolve;
				rr.reject = reject;
				loader(resolve, reject, 0);
			});
			return wrapPromise(promise, rr.resolve, rr.reject, href);
		}

		function isPromise(obj) {
			return typeof obj === "object" && obj.resolve && obj.reject;
		}

		//////////////////////////////////////////////////////////////////////////////////////////
		// global universal require/import

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

		if (typeof window === "undefined") {
			// install a global import() and require()
			universalImportNode();
		} else {
			// install a global import() and require()
			universalRequireJsonp();
			universalImportJsonp();
		}

		//////////////////////////////////////////////////////////////////////////////////////////
		// Universal module and chunk loaders

		/**
		 * universalLoader factory
		 *
		 * @param {Object} options Receives options
		 *     options.u  -> __universal__
		 *     options.r  -> __webpack_require__
		 *     options.m  -> modules
		 *     options.s  -> scriptSrc
		 *     options.sc -> cssSrc
		 *     options.i  -> installedChunks
		 *     options.ic -> installedCssChunks
		 *     options.cc -> cssChunks
		 *     options.el -> deferredModules list
		 *     options.pl -> chunkPreloadMap
		 *     options.pf -> chunkPrefetchMap
		 *     options.dp -> dependencies
		 * @returns {Promise} Promise for signaling load
		 */
		function universalLoaderFactory(options) {
			/**
			 * universalChunkLoader (webpackJsonp callback)
			 *
			 * @param {Object} data Receives options
			 *     data.i  -> chunkIds
			 *     data.m  -> moreModules
			 *     data.e  -> executeModules
			 * @returns {any} result
			 */
			// install a chunks function for chunk loading
			function universalChunkLoader(data) {
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

				// Ensure CSS for installed chunks
				for (i = 0; i < installedChunks.length; i++) {
					var chunkId = installedChunks[i];
					if (options.cc[chunkId]) {
						promises.push(options.r.e(chunkId));
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
					chunkId = installedChunks[i];
					preFetchLoadJsonp(chunkId);
					preFetchLoadJsonp(chunkId, promise);
				}

				promise
					.then(function() {
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
					})
					.catch(function(error) {
						delete global.require.cache[request];
						handleError(error);
					});
				return global.require.cache[request];
			}

			// script path function
			function scriptSrcJsonp(chunkId) {
				return "/" + options.r.p + "" + options.s(chunkId);
			}

			// css path function
			function cssSrcJsonp(chunkId) {
				return "/" + options.r.p + "" + options.sc(chunkId);
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
				// 0 means "already installed".
				// a Promise means "currently loading".
				var promises = [];
				var promise;

				// Javascript chunk loading using JSONP
				var installedChunkScript = options.i[chunkId];
				if (installedChunkScript !== 0) {
					if (installedChunkScript) {
						promise = installedChunkScript;
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
								handleError(error);
							});
						options.i[chunkId] = promise;
					}
					preFetchLoadJsonp(chunkId);
					preFetchLoadJsonp(chunkId, promise);
					promises.push(promise);
				}

				// CSS chunk loading
				var installedChunkCss = options.ic[chunkId];
				if (installedChunkCss !== 0 && options.cc[chunkId]) {
					if (installedChunkCss) {
						promise = installedChunkCss;
					} else {
						promise = loadCss(cssSrcJsonp(chunkId))
							.then(function() {
								options.ic[chunkId] = 0;
							})
							.catch(function(error) {
								delete options.ic[chunkId];
								handleError(error);
							});
						options.ic[chunkId] = promise;
					}
					promises.push(promise);
				}

				return wrapPromise(Promise.all(promises), function() {}, function() {});
			}

			// on error function for async loading
			function onErrorJsonp(err) {
				console.error(err);
				throw err; // catch this error by using import().catch()
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

			options.u.chunks = options.u.chunks || [];
			var oldUniversalChunkFunction = options.u.chunks.push.bind(
				options.u.chunks
			);
			options.u.chunks.push = universalChunkLoader;
			var chunksArray = options.u.chunks.slice();
			for (var i = 0; i < chunksArray.length; i++) {
				universalChunkLoader(chunksArray[i]);
			}
			var parentUniversalChunkFunction = oldUniversalChunkFunction;

			if (parentUniversalFunction) parentUniversalFunction(options);

			// Wait for dependencies and chunks to load...
			return loadDependencies(function() {
				// run deferred modules when all chunks ready
				return checkDeferredModules();
			});
		}

		if (!global.__universalWebpackInstalled) {
			global.__universalWebpackInstalled = true;

			// install a callback for universal modules loading
			global.webpackUniversal = global.webpackUniversal || [];
			var oldUniversalFunction = global.webpackUniversal.push.bind(
				global.webpackUniversal
			);
			global.webpackUniversal.push = universalLoaderFactory;
			var universalArray = global.webpackUniversal.slice();
			for (var i = 0; i < universalArray.length; i++) {
				universalLoaderFactory(universalArray[i]);
			}
			var parentUniversalFunction = oldUniversalFunction;
		}
	};
	runtimeInstall();
	if (typeof module !== "undefined") module.exports = runtimeInstall;
})();
