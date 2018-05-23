/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Germán Méndez Bravo (Kronuz)

	This comes in parts from webpack/lib/web/JsonpChunkTemplatePlugin.js
	and from webpack/lib/node/NodeNodeTemplatePlugin.js
	[https://github.com/webpack/webpack/tree/v4.8.3]
*/

(function() {
	var runtimeInstall = function() {
		var DEFAULT_TIMEOUT = 120; // 120
		var DEFAULT_MAX_RETRIES = 10; // 10

		var LOG = console.log;
		var GROUP_LOG = console.group;
		var GROUP_END = console.groupEnd;

		var win, doc, glob;
		var SERVER_SIDE = typeof window === "undefined";
		if (SERVER_SIDE) {
			glob = global;
		} else {
			win = window;
			doc = document;
			glob = win.global = win.global || win;
		}

		/**
		 * Function to register status of loaded
		 * @param {string} src - Resource src/href
		 * @param {number} status - 0/1 (loaded/not-loaded)
		 * @returns {void}
		 */
		glob._btldr = function btldr(src, status) {
			status = !!status;
			var callback = btldr[src];
			if (typeof callback === "function") {
				callback(status);
			} else {
				LOG("", "btldr", src, status);
			}
			btldr[src] = status;
		};

		/**
		 * Function to process errors, publishes to Raven if available
		 * and displays a splash screen (#failure) with a message (#failureMessage)
		 * @param {string|Error} error - Message or error
		 * @param {any} source - Source to pass to raven
		 * @returns {void}
		 */
		glob._err = function(error, source) {
			if (source && glob.Raven) {
				if (typeof error === "string") {
					glob.Raven.captureMessage(error, {
						level: "error",
						extra: { source: source }
					});
				} else {
					glob.Raven.captureException(error, {
						extra: { source: source }
					});
				}
			}
			var failure = doc.getElementById("failure");
			if (failure) {
				var failureMessage = doc.getElementById("failureMessage");
				failureMessage.innerText =
					typeof error === "string" && error
						? error
						: "A problem was encountered trying to load the page.";
				failure.style.display = "block";
				doc.body.style.overflow = "hidden";
			}
		};

		/**
		 * Function to reload window
		 * @returns {void}
		 */
		glob._rld = function() {
			glob.location.reload();
		};

		//     _       _ _ _           _ _
		//    (_) __ _(_) | |__   __ _(_) |_
		//    | |/ _` | | | '_ \ / _` | | __|
		//    | | (_| | | | |_) | (_| | | |_
		//   _/ |\__,_|_|_|_.__/ \__,_|_|\__|
		//  |__/
		function jailbait(options) {
			if (SERVER_SIDE || options.off || top !== win) return;
			var stop = options.stop || "Stop!",
				text =
					options.text ||
					"This is a browser feature intended for developers. " +
						"If someone told you to copy-paste something here to enable a " +
						'feature or "hack" someone’s account, it is a scam and will ' +
						"give them access to your account.",
				more =
					options.more ||
					"See https://en.wikipedia.org/wiki/Self-XSS for more information.";
			if ((glob.chrome || glob.safari) && !options.textonly) {
				var css = "font-family:helvetica; font-size:20px; ";
				[
					[
						stop,
						options.css1 ||
							css +
								"font-size:50px; font-weight:bold; color:red; -webkit-text-stroke:1px black;"
					],
					[text, options.css2 || css],
					[more, options.css3 || css],
					["", ""]
				].map(function(line) {
					setTimeout(console.log.bind(console, "\n%c" + line[0], line[1]));
				});
			} else {
				stop = [
					"",
					" .d8888b.  888                       888",
					"d88P  Y88b 888                       888",
					"Y88b.      888                       888",
					' "Y888b.   888888  .d88b.  88888b.   888',
					'    "Y88b. 888    d88""88b 888 "88b  888',
					'      "888 888    888  888 888  888  Y8P',
					"Y88b  d88P Y88b.  Y88..88P 888 d88P",
					' "Y8888P"   "Y888  "Y88P"  88888P"   888',
					"                           888",
					"                           888",
					"                           888"
				];
				// Split text in lines of at most 35 characters
				text = ("" + text).match(/.{35}.+?\s+|.+$/g);
				var middle = Math.floor(Math.max(0, (stop.length - text.length) / 2));
				// Concatenate such lines to the right of "Stop" banner
				for (var i = 0; i < stop.length || i < text.length; i++) {
					var line = stop[i];
					stop[i] =
						line +
						new Array(45 - line.length).join(" ") +
						(text[i - middle] || "");
				}
				// And print...
				console.log("\n\n\n" + stop.join("\n") + "\n\n" + more + "\n");
			}
		}

		jailbait({});

		//
		//   _   _       _                          _   ____              _   _
		//  | | | |_ __ (_)_   _____ _ __ ___  __ _| | |  _ \ _   _ _ __ | |_(_)_ __ ___   ___
		//  | | | | '_ \| \ \ / / _ \ '__/ __|/ _` | | | |_) | | | | '_ \| __| | '_ ` _ \ / _ \
		//  | |_| | | | | |\ V /  __/ |  \__ \ (_| | | |  _ <| |_| | | | | |_| | | | | | |  __/
		//   \___/|_| |_|_| \_/ \___|_|  |___/\__,_|_| |_| \_\\__,_|_| |_|\__|_|_| |_| |_|\___|
		//
		var handleError =
			glob.showFailureMessage ||
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
			// This comes mainly from webpack/lib/web/JsonpMainTemplatePlugin.js
			// [https://github.com/webpack/webpack/tree/v4.8.3]
			LOG("🕸", "loadScript(", src, ")");
			timeout = timeout || DEFAULT_TIMEOUT;
			maxRetries = maxRetries || DEFAULT_MAX_RETRIES;
			function loader(resolve, reject, retryCount) {
				var script;
				var btldr = glob._btldr[src];
				var btldr_type = typeof btldr;
				if (btldr_type === "undefined" || btldr_type === "boolean") {
					var existingScriptTags = doc.getElementsByTagName("script");
					for (var i = 0; i < existingScriptTags.length; i++) {
						var tag = existingScriptTags[i];
						if (tag.hasAttribute("btldr")) {
							if (tag.getAttribute("src") === src) {
								script = tag;
								break;
							}
						}
					}
				}
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
								LOG("💥", "loadScript(", src, ")", "reject()", error);
								reject(error);
							} else {
								setTimeout(function() {
									loader(resolve, reject, retryCount);
								}, getWaitTimeExp(retryCount));
							}
							break;
						default:
							LOG("👍", "loadScript(", src, ")", "resolve()");
							resolve();
					}
				}
				var timeoutTimer = setTimeout(function() {
					LOG("⌛️", src, "timed out!");
					onScriptComplete({ type: "timeout", target: script });
				}, timeout * 1000);
				if (script) {
					glob._btldr[src] = function(s) {
						LOG("", "btldr callback", src, s);
						onScriptComplete({ type: s ? "load" : "error", target: script });
					};
					if (btldr_type === "boolean") glob._btldr[src](btldr);
				} else {
					script = doc.createElement("script");
					script.charset = "utf-8";
					script.timeout = timeout;
					if (loadScript.nonce) {
						script.setAttribute("nonce", loadScript.nonce);
					}
					script.async = 1;
					script.onerror = script.onload = onScriptComplete;
					script.src = src;
					doc.head.appendChild(script);
				}
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
			// This comes mainly from mini-css-extract-plugin/src/index.js
			// and partially from webpack/lib/web/JsonpMainTemplatePlugin.js
			// [https://github.com/webpack-contrib/mini-css-extract-plugin/tree/v0.4.0]
			LOG("🕸 loadCss(", href, ")");
			timeout = timeout || DEFAULT_TIMEOUT;
			maxRetries = maxRetries || DEFAULT_MAX_RETRIES;
			function loader(resolve, reject, retryCount) {
				var link;
				var btldr = glob._btldr[href];
				var btldr_type = typeof btldr;
				if (btldr_type === "undefined" || btldr_type === "boolean") {
					var existingLinkTags = doc.getElementsByTagName("link");
					for (var i = 0; i < existingLinkTags.length; i++) {
						var tag = existingLinkTags[i];
						if (tag.hasAttribute("btldr")) {
							if (tag.rel === "stylesheet") {
								if (tag.getAttribute("href") === href) {
									link = tag;
									break;
								}
							}
						}
					}
				}
				var existingStyleTags = doc.getElementsByTagName("style");
				for (i = 0; i < existingStyleTags.length; i++) {
					tag = existingStyleTags[i];
					if (tag.getAttribute("data-href") === href) {
						resolve();
						return;
					}
				}
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
								LOG("💥", "loadScript(", href, ")", "reject()", error);
								reject(error);
							} else {
								setTimeout(function() {
									loader(resolve, reject, retryCount);
								}, getWaitTimeExp(retryCount));
							}
							break;
						default:
							LOG("👍", "loadScript(", href, ")", "resolve()");
							resolve();
					}
				}
				var timeoutTimer = setTimeout(function() {
					LOG("⌛️", href, "timed out!");
					onScriptComplete({ type: "timeout", target: link });
				}, timeout * 1000);
				if (link) {
					glob._btldr[href] = function(s) {
						onScriptComplete({ type: s ? "load" : "error", target: link });
					};
					if (btldr_type === "boolean") glob._btldr[href](btldr);
				} else {
					link = doc.createElement("link");
					link.rel = "stylesheet";
					link.type = "text/css";
					link.onerror = link.onload = onScriptComplete;
					link.href = href;
					doc.head.appendChild(link);
				}
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
			if (glob.require) {
				if (!glob.require.__universalWebpack) {
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
			glob.require = r;
		}

		function universalImportJsonp() {
			if (glob.import) {
				if (!glob.import.__universalWebpack) {
					throw new Error("An unknown import() is already installed!");
				}
				return;
			}

			i = function(request) {
				return glob.require.load(request).then(function() {
					return glob.require(request);
				});
			};
			i.__universalWebpack = true;
			glob.import = i;
		}

		function universalImportNode() {
			if (glob.import) {
				if (!glob.import.__universalWebpack) {
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
			glob.import = i;
		}

		if (SERVER_SIDE) {
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
				var request = options.r.cp;
				GROUP_LOG("Loading module", request, "...");
				var installedChunks = Object.keys(options.i);

				var promises = [];
				var chunkId;

				// Load deferred modules
				GROUP_LOG("Load deferred modules");
				for (var i = 0; i < options.el.length; i++) {
					var deferredModule = options.el[i];
					for (var j = 1; j < deferredModule.length; j++) {
						chunkId = deferredModule[j];
						promises.push(options.r.e(chunkId));
					}
				}
				GROUP_END();

				// Ensure CSS for installed chunks
				GROUP_LOG("Ensure CSS for installed chunks");
				for (i = 0; i < installedChunks.length; i++) {
					chunkId = installedChunks[i];
					if (options.cc[chunkId]) {
						promises.push(options.r.e(chunkId));
					}
				}
				GROUP_END();

				// Load dependencies
				GROUP_LOG("Load dependencies");
				for (i = 0; i < options.dp.length; i++) {
					promises.push(glob.require.load(options.dp[i]));
				}
				GROUP_END();

				// Wait for those to load and fullfil
				var promise = wrapPromise(
					Promise.all(promises),
					function() {},
					function(error) {
						throw error;
					},
					promises
				);
				var requiredModule = glob.require.cache[request];
				if (typeof requiredModule === "undefined") {
					glob.require.cache[request] = promise;
				}

				// Pre-fetching chunks
				GROUP_LOG("Pre-fetching chunks");
				for (i = 0; i < installedChunks.length; i++) {
					chunkId = installedChunks[i];
					preFetchLoadJsonp(chunkId);
					preFetchLoadJsonp(chunkId, promise);
				}
				GROUP_END();

				GROUP_END();

				GROUP_LOG("⏳", "waiting for dependencies of", request, "...");
				promise
					.then(function() {
						LOG("✅", "dependencies of", request, "loaded!");
						var requiredModule = glob.require.cache[request];
						if (isPromise(requiredModule)) {
							try {
								glob.require.cache[request] = callback();
								requiredModule.resolve();
							} catch (error) {
								delete glob.require.cache[request];
								requiredModule.reject(error);
							}
						} else {
							callback();
						}
					})
					.catch(function(error) {
						delete glob.require.cache[request];
						handleError(error);
					});
				return glob.require.cache[request];
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
					var head = doc.getElementsByTagName("head")[0];
					chunkData.forEach(function(chunkId) {
						if (typeof options.i[chunkId] === "undefined") {
							options.i[chunkId] = null;
							var link = doc.createElement("link");
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
				var installedChunks = Object.keys(options.i);

				var promises = [];
				var chunkId;

				// Load deferred modules:
				for (var i = 0; i < options.el.length; i++) {
					var deferredModule = options.el[i];
					for (var j = 1; j < deferredModule.length; j++) {
						chunkId = deferredModule[j];
						promises.push(options.r.e(chunkId));
					}
				}

				// Ensure CSS for installed chunks
				for (i = 0; i < installedChunks.length; i++) {
					chunkId = installedChunks[i];
					if (options.cc[chunkId]) {
						promises.push(options.r.e(chunkId));
					}
				}

				// Load dependencies:
				for (i = 0; i < options.dp.length; i++) {
					LOG(options.dp[i]);
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
				// 0 means "already installed".
				// a Promise means "currently loading".

				// Javascript chunk loading using require()
				var installedChunkScript = options.i[chunkId];
				LOG(scriptSrcNode(chunkId));
				if (installedChunkScript !== 0) {
					var chunk = require(scriptSrcNode(chunkId));
					options.u.chunks = options.u.chunks || [];
					options.u.chunks.push(chunk);
				}

				// CSS chunk loading
				if (options.cc[chunkId]) {
					LOG(cssSrcJsonp(chunkId));
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
			if (SERVER_SIDE) {
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

		if (!glob.__universalWebpackInstalled) {
			glob.__universalWebpackInstalled = true;

			// install a callback for universal modules loading
			glob.webpackUniversal = glob.webpackUniversal || [];
			var oldUniversalFunction = glob.webpackUniversal.push.bind(
				glob.webpackUniversal
			);
			glob.webpackUniversal.push = universalLoaderFactory;
			var universalArray = glob.webpackUniversal.slice();
			for (var i = 0; i < universalArray.length; i++) {
				universalLoaderFactory(universalArray[i]);
			}
			var parentUniversalFunction = oldUniversalFunction;
		}
	};
	runtimeInstall();
	if (typeof module !== "undefined") module.exports = runtimeInstall;
})();
