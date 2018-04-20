!function(root, factory) {
    "object" === typeof exports && "object" === typeof module ? module.exports = factory() : "function" === typeof define && define.amd ? define([], factory) : "object" === typeof exports ? exports.Observables = factory() : root.Observables = factory();
}("undefined" !== typeof self ? self : this, function() {
    /******/
    return function(modules) {
        // webpackBootstrap
        /******/
        // The module cache
        /******/
        var installedModules = {};
        /******/
        /******/
        // The require function
        /******/
        function __webpack_require__(moduleId) {
            /******/
            /******/
            // Check if module is in cache
            /******/
            if (installedModules[moduleId]) /******/
            return installedModules[moduleId].exports;
            /******/
            // Create a new module (and put it into the cache)
            /******/
            var module = installedModules[moduleId] = {
                /******/
                i: moduleId,
                /******/
                l: false,
                /******/
                exports: {}
            };
            /******/
            /******/
            // Execute the module function
            /******/
            modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
            /******/
            /******/
            // Flag the module as loaded
            /******/
            module.l = true;
            /******/
            /******/
            // Return the exports of the module
            /******/
            return module.exports;
        }
        /******/
        /******/
        /******/
        // expose the modules object (__webpack_modules__)
        /******/
        __webpack_require__.m = modules;
        /******/
        /******/
        // expose the module cache
        /******/
        __webpack_require__.c = installedModules;
        /******/
        /******/
        // define getter function for harmony exports
        /******/
        __webpack_require__.d = function(exports, name, getter) {
            /******/
            __webpack_require__.o(exports, name) || /******/
            Object.defineProperty(exports, name, {
                /******/
                configurable: false,
                /******/
                enumerable: true,
                /******/
                get: getter
            });
        };
        /******/
        /******/
        // getDefaultExport function for compatibility with non-harmony modules
        /******/
        __webpack_require__.n = function(module) {
            /******/
            var getter = module && module.__esModule ? /******/
            function() {
                return module.default;
            } : /******/
            function() {
                return module;
            };
            /******/
            __webpack_require__.d(getter, "a", getter);
            /******/
            return getter;
        };
        /******/
        /******/
        // Object.prototype.hasOwnProperty.call
        /******/
        __webpack_require__.o = function(object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        };
        /******/
        /******/
        // __webpack_public_path__
        /******/
        __webpack_require__.p = "";
        /******/
        /******/
        // Load entry module and return exports
        /******/
        return __webpack_require__(__webpack_require__.s = 2);
    }([ /* 0 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* unused harmony export functionBind */
        /* unused harmony export functionBindCall */
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "d", function() {
            return objectDefineProperty;
        });
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "c", function() {
            return objectDefineProperties;
        });
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "e", function() {
            return objectKeys;
        });
        /* unused harmony export isArray */
        /* unused harmony export arrayForEach */
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "b", function() {
            return arrayIndexOf;
        });
        /* unused harmony export arraySplice */
        /* unused harmony export consoleLog */
        /* unused harmony export consoleError */
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return SymbolIterator;
        });
        // Function
        // functionBind(fn, fnParent)
        var functionBind = Function.bind.call.bind(Function.bind);
        // usage: functionBindCall(Array.prototype.forEach) // generates a bound function to Array.prototype.forEach.call
        var functionBindCall = functionBind(Function.call.bind, Function.call);
        // Object
        var objectDefineProperty = Object.defineProperty;
        var objectDefineProperties = Object.defineProperties;
        var objectKeys = Object.keys;
        // Array
        var arr = [];
        Array.isArray;
        functionBindCall(arr.forEach);
        var arrayIndexOf = functionBindCall(arr.indexOf);
        functionBindCall(arr.splice);
        // Logging
        var consoleLog = console.log;
        console.error;
        // Iterators
        var SymbolIterator = "undefined" !== typeof Symbol && Symbol.iterator ? Symbol.iterator : "@@iterator";
    }, /* 1 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export (binding) */
        __webpack_require__.d(__webpack_exports__, "a", function() {
            return OBSERVABLE_IDENTIFIER;
        });
        /* harmony export (immutable) */
        __webpack_exports__.b = objectWatchProp;
        /* harmony export (immutable) */
        __webpack_exports__.c = setDependencyTracker;
        /* harmony export (immutable) */
        __webpack_exports__.e = unsetDependencyTracker;
        /* harmony export (immutable) */
        __webpack_exports__.d = stopTrackerNotification;
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__ = __webpack_require__(0);
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__ = __webpack_require__(3);
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2_common_micro_libs_src_jsutils_nextTick__ = __webpack_require__(7);
        //---------------------------------------------------------------------------
        var OBSERVABLE_IDENTIFIER = "___$observable$___";
        // FIXME: this should be a Symbol()
        var DEFAULT_PROP_DEFINITION = {
            configurable: true,
            enumerable: true
        };
        var TRACKERS = new __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__.a();
        var WATCHER_IDENTIFIER = "___$watching$___";
        /**
 * A lightweight utility to Watch an object's properties and get notified when it changes.
 *
 * @param {Object} obj
 *
 * @param {String} [prop]
 *  the property to be watched. If left undefined, then all existing properties are watched.
 *
 * @param {Function} [callback]
 *  The callback to be executed when property or object changes. If left undefined, then
 *  `obj` is only made observable (internal structure created and all current enumerable'
 *  properties are made "watchable")
 *
 * @return {ObjectUnwatchProp}
 * Return a function to unwatch the property. Function also has a static property named
 * `destroy` that will do the same thing (ex. `unwatch.destroy()` is same as `unwatch()`)
 *
 * @example
 *
 * const oo = {};
 * const unWatchName = objectWatchProp(oo, "name", () => console.log(`name changed: ${oo.name}`));
 *
 * oo.name = "paul"; // console outputs: name changed: paul
 *
 * // stop watching
 * unWatchName();
 *
 * @example
 *
 * const oo = {
 *      name: "paul",
 *      country: "usa"
 * };
 *
 * // watch all changes to object
 * objectWatchProp(oo, null, () => console.log("Something changed in object"));
 *
 */
        function objectWatchProp(obj, prop, callback) {
            if (!obj[OBSERVABLE_IDENTIFIER]) {
                Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.d)(obj, OBSERVABLE_IDENTIFIER, {
                    configurable: true,
                    writable: true,
                    value: {
                        props: {},
                        watchers: new __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__.a()
                    }
                });
                setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].watchers, true);
            }
            // Convert prop to observable?
            if (prop && !obj[OBSERVABLE_IDENTIFIER].props[prop]) {
                setupPropState(obj, prop);
                setupPropInterceptors(obj, prop);
            } else prop && obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors && setupPropInterceptors(obj, prop);
            if (prop && callback) obj[OBSERVABLE_IDENTIFIER].props[prop].storeCallback(callback); else if (!prop) {
                // make ALL props observable
                Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.e)(obj).forEach(function(objProp) {
                    if (!obj[OBSERVABLE_IDENTIFIER].props[objProp]) {
                        setupPropState(obj, objProp);
                        setupPropInterceptors(obj, objProp);
                    }
                });
                callback && // FIXME: should use `storeCallback` here?
                obj[OBSERVABLE_IDENTIFIER].watchers.add(callback);
            }
            /**
     * Unwatch an object property or object.
     *
     * @typedef {Function} ObjectUnwatchProp
     * @property {Function} destroy Same as function returned.
     */
            var unWatch = destroyWatcher.bind(obj, callback, prop ? obj[OBSERVABLE_IDENTIFIER].props[prop] : obj[OBSERVABLE_IDENTIFIER]);
            unWatch.destroy = unWatch;
            return unWatch;
        }
        function setupCallbackStore(store) {
            var async = arguments.length > 1 && void 0 !== arguments[1] && arguments[1];
            store.async = async;
            store.isQueued = false;
            store.notify = notify;
            store.run = function() {
                store.forEach(execCallback);
                store.isQueued = false;
            };
        }
        function setupPropState(obj, prop) {
            if (!obj[OBSERVABLE_IDENTIFIER].props[prop]) {
                obj[OBSERVABLE_IDENTIFIER].props[prop] = {
                    val: void 0,
                    dependents: new __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__.a(),
                    watchers: new __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__.a(),
                    parent: obj[OBSERVABLE_IDENTIFIER],
                    storeCallback: storeCallback,
                    setupInterceptors: true
                };
                setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].props[prop].dependents, false);
                setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].props[prop].watchers, true);
            }
            return obj[OBSERVABLE_IDENTIFIER].props[prop];
        }
        function setupPropInterceptors(obj, prop) {
            var propOldDescriptor = Object.getOwnPropertyDescriptor(obj, prop) || DEFAULT_PROP_DEFINITION;
            propOldDescriptor.get || (obj[OBSERVABLE_IDENTIFIER].props[prop].val = obj[prop]);
            Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.d)(obj, prop, {
                configurable: propOldDescriptor.configurable || false,
                enumerable: propOldDescriptor.enumerable || false,
                get: function() {
                    TRACKERS.size && TRACKERS.forEach(function(trackerCallback) {
                        obj[OBSERVABLE_IDENTIFIER].props[prop].storeCallback(trackerCallback);
                    });
                    if (propOldDescriptor.get) return propOldDescriptor.get.call(obj);
                    return obj[OBSERVABLE_IDENTIFIER].props[prop].val;
                },
                set: function(newVal) {
                    var priorVal = obj[prop];
                    propOldDescriptor.set ? newVal = propOldDescriptor.set.call(obj, newVal) : obj[OBSERVABLE_IDENTIFIER].props[prop].val = newVal;
                    if (newVal !== priorVal) {
                        obj[OBSERVABLE_IDENTIFIER].props[prop].watchers.notify();
                        obj[OBSERVABLE_IDENTIFIER].props[prop].dependents.notify();
                        obj[OBSERVABLE_IDENTIFIER].watchers.notify();
                    }
                    return newVal;
                }
            });
            obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors = false;
        }
        function notify() {
            // this: new Set(). Set instance could have two additional attributes: async ++ isQueued
            if (!this.size || this.async && this.isQueued) return;
            if (!this.async) {
                this.forEach(execCallback);
                return;
            }
            this.isQueued = true;
            Object(__WEBPACK_IMPORTED_MODULE_2_common_micro_libs_src_jsutils_nextTick__.a)(this.run);
        }
        function execCallback(cb) {
            cb();
        }
        function storeCallback(callback) {
            // this === PropState
            if (callback.asDependent) {
                setCallbackAsWatcherOf(callback, this.dependents);
                this.dependents.add(callback);
            } else {
                setCallbackAsWatcherOf(callback, this.watchers);
                this.watchers.add(callback);
            }
        }
        function destroyWatcher(callback, propSetup) {
            // this == obj
            if (callback) {
                propSetup.dependents.delete(callback);
                propSetup.watchers.delete(callback);
                unsetCallbackAsWatcherOf(callback, propSetup.dependents);
                unsetCallbackAsWatcherOf(callback, propSetup.watchers);
            }
        }
        /**
 * Sets a callback to be added to the list of watchers for any property
 * that is accessed after this function is called.
 *
 * @param {Function} callback
 *  The callback to be added to dependency list of watchers.
 *  NOTE: the callback will modified to include a new property
 *  `stopWatchingAll()` which can be used to remove the given callback
 *  from ALL dependencies that include it.
 *
 */
        function setDependencyTracker(callback) {
            TRACKERS.add(callback);
        }
        /**
 * Removes a callback from being added to a property's watchers as they
 * are accessed.
 *
 * @param {Function} callback
 */
        function unsetDependencyTracker(callback) {
            TRACKERS.delete(callback);
        }
        /**
 * Removes the given callback from all property watchers lists that it may
 * be included in.
 *
 * @param {Function} callback
 */
        function stopTrackerNotification(callback) {
            callback[WATCHER_IDENTIFIER] && callback[WATCHER_IDENTIFIER].stopWatchingAll();
        }
        /**
 * Store a reference to the Set instance provided on input, on the callback.
 * @private
 * @param {Function} callback
 * @param {Set} watchersSet
 */
        function setCallbackAsWatcherOf(callback, watchersSet) {
            if (!callback[WATCHER_IDENTIFIER]) {
                Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.d)(callback, WATCHER_IDENTIFIER, {
                    configurable: true,
                    writable: true,
                    value: {
                        watching: new __WEBPACK_IMPORTED_MODULE_1_common_micro_libs_src_jsutils_Set__.a()
                    }
                });
                Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.d)(callback, "stopWatchingAll", {
                    configurable: true,
                    writable: true,
                    value: function() {
                        callback[WATCHER_IDENTIFIER].watching.forEach(function(watcherList) {
                            return watcherList.delete(callback);
                        });
                        callback[WATCHER_IDENTIFIER].watching.clear();
                    }
                });
            }
            callback[WATCHER_IDENTIFIER].watching.add(watchersSet);
        }
        /**
 * Removes the reference to the given Set instance from the callback function provided
 * @private
 * @param {Function} callback
 * @param {Set} watchersSet
 */
        function unsetCallbackAsWatcherOf(callback, watchersSet) {
            callback[WATCHER_IDENTIFIER] && callback[WATCHER_IDENTIFIER].watching.delete(watchersSet);
        }
    }, /* 2 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        Object.defineProperty(__webpack_exports__, "__esModule", {
            value: true
        });
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__objectWatchProp__ = __webpack_require__(1);
        /* harmony reexport (binding) */
        __webpack_require__.d(__webpack_exports__, "objectWatchProp", function() {
            return __WEBPACK_IMPORTED_MODULE_0__objectWatchProp__.b;
        });
        /* harmony reexport (binding) */
        __webpack_require__.d(__webpack_exports__, "setDependencyTracker", function() {
            return __WEBPACK_IMPORTED_MODULE_0__objectWatchProp__.c;
        });
        /* harmony reexport (binding) */
        __webpack_require__.d(__webpack_exports__, "stopTrackerNotification", function() {
            return __WEBPACK_IMPORTED_MODULE_0__objectWatchProp__.d;
        });
        /* harmony reexport (binding) */
        __webpack_require__.d(__webpack_exports__, "unsetDependencyTracker", function() {
            return __WEBPACK_IMPORTED_MODULE_0__objectWatchProp__.e;
        });
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__objectCreateComputedProp__ = __webpack_require__(8);
        /* harmony reexport (binding) */
        __webpack_require__.d(__webpack_exports__, "objectCreateComputedProp", function() {
            return __WEBPACK_IMPORTED_MODULE_1__objectCreateComputedProp__.a;
        });
    }, /* 3 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* unused harmony export Set */
        /* unused harmony export FakeSet */
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__getGlobal__ = __webpack_require__(4);
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__Iterator__ = __webpack_require__(6);
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_2__runtime_aliases__ = __webpack_require__(0);
        //============================================================
        var Set = __WEBPACK_IMPORTED_MODULE_0__getGlobal__.a.Set && __WEBPACK_IMPORTED_MODULE_0__getGlobal__.a.Set.prototype[__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.a] ? __WEBPACK_IMPORTED_MODULE_0__getGlobal__.a.Set : FakeSet;
        /* harmony default export */
        __webpack_exports__.a = Set;
        function FakeSet() {}
        Object(__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.c)(FakeSet.prototype, function(obj, key, value) {
            key in obj ? Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            }) : obj[key] = value;
            return obj;
        }({
            constructor: {
                value: FakeSet,
                configurable: true
            },
            _: {
                get: function() {
                    var values = [];
                    Object(__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.d)(this, "_", {
                        value: values
                    });
                    return values;
                }
            },
            add: {
                value: function(item) {
                    -1 === Object(__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.b)(this._, item) && this._.push(item);
                    return this;
                }
            },
            has: {
                value: function(item) {
                    return -1 !== Object(__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.b)(this._, item);
                }
            },
            size: {
                get: function() {
                    return this._.length;
                }
            },
            clear: {
                value: function() {
                    this._.splice(0);
                }
            },
            delete: {
                value: function(item) {
                    var idx = Object(__WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.b)(this._, item);
                    if (-1 !== idx) {
                        this._.splice(idx, 1);
                        return true;
                    }
                    return false;
                }
            },
            values: {
                value: function() {
                    return new __WEBPACK_IMPORTED_MODULE_1__Iterator__.a(this._);
                }
            },
            entries: {
                value: function() {
                    return new __WEBPACK_IMPORTED_MODULE_1__Iterator__.a(this._, this._);
                }
            },
            forEach: {
                value: function(cb) {
                    var _this = this;
                    this._.forEach(function(item) {
                        return cb(item, item, _this);
                    });
                }
            }
        }, __WEBPACK_IMPORTED_MODULE_2__runtime_aliases__.a, {
            value: function() {
                return this.values();
            }
        }));
    }, /* 4 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* WEBPACK VAR INJECTION */
        (function(global) {
            /* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() {
                return GLOBAL;
            });
            /* unused harmony export getGlobal */
            var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
                return typeof obj;
            } : function(obj) {
                return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
            var GLOBAL = function() {
                /* global self, window, global */
                if ("undefined" !== ("undefined" === typeof window ? "undefined" : _typeof(window))) return window;
                if ("undefined" !== ("undefined" === typeof global ? "undefined" : _typeof(global))) return global;
                if ("undefined" !== ("undefined" === typeof self ? "undefined" : _typeof(self))) return self;
                return Function("return this;")();
            }();
        }).call(__webpack_exports__, __webpack_require__(5));
    }, /* 5 */
    /***/
    function(module, exports) {
        var _typeof = "function" === typeof Symbol && "symbol" === typeof Symbol.iterator ? function(obj) {
            return typeof obj;
        } : function(obj) {
            return obj && "function" === typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
        var g;
        // This works in non-strict mode
        g = function() {
            return this;
        }();
        try {
            // This works if eval is allowed (see CSP)
            g = g || Function("return this")() || (0, eval)("this");
        } catch (e) {
            // This works if the window reference is available
            "object" === ("undefined" === typeof window ? "undefined" : _typeof(window)) && (g = window);
        }
        // g can still be undefined, but nothing to do about it...
        // We return undefined, instead of nothing here, so it's
        // easier to handle this case. if(!global) { ...}
        module.exports = g;
    }, /* 6 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export (immutable) */
        __webpack_exports__.a = FakeIterator;
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0__runtime_aliases__ = __webpack_require__(0);
        //-----------------------------------------------------------------------
        // Great reference: http://2ality.com/2015/02/es6-iteration.html
        function FakeIterator(keys, values) {
            Object(__WEBPACK_IMPORTED_MODULE_0__runtime_aliases__.d)(this, "_", {
                value: {
                    keys: keys.slice(0),
                    values: values ? values.slice(0) : null,
                    idx: 0,
                    total: keys.length
                }
            });
        }
        Object(__WEBPACK_IMPORTED_MODULE_0__runtime_aliases__.c)(FakeIterator.prototype, {
            constructor: {
                value: FakeIterator
            },
            next: {
                enumerable: true,
                configurable: true,
                value: function() {
                    var response = {
                        done: this._.idx === this._.total
                    };
                    if (response.done) {
                        response.value = void 0;
                        return response;
                    }
                    var nextIdx = this._.idx++;
                    response.value = this._.keys[nextIdx];
                    this._.values && (response.value = [ response.value, this._.values[nextIdx] ]);
                    return response;
                }
            }
        });
        Object(__WEBPACK_IMPORTED_MODULE_0__runtime_aliases__.d)(FakeIterator.prototype, __WEBPACK_IMPORTED_MODULE_0__runtime_aliases__.a, {
            value: function() {
                return this;
            }
        });
    }, /* 7 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* unused harmony export nextTick */
        var reIsNativeCode = /native code/i;
        /**
 * Executes a function at the end of the current event Loop - during micro-task processing
 *
 * @param {Function} callback
 */
        var nextTick = function() {
            if ("undefined" !== typeof setImediate && reIsNativeCode.test(setImediate.toString())) return setImediate;
            // Native Promsie? Use it.
            if ("function" === typeof Promise && reIsNativeCode.test(Promise.toString())) {
                var resolved = Promise.resolve();
                return function(fn) {
                    resolved.then(fn).catch(function(e) {
                        return console.log(e);
                    });
                };
            }
            // fallback to setTimeout
            // From: https://bugzilla.mozilla.org/show_bug.cgi?id=686201#c68
            var immediates = [];
            var processing = false;
            function processPending() {
                setTimeout(function() {
                    immediates.shift()();
                    immediates.length ? processPending() : processing = false;
                }, 0);
            }
            return function(fn) {
                immediates.push(fn);
                if (!processing) {
                    processing = true;
                    processPending();
                }
            };
        }();
        /* harmony default export */
        __webpack_exports__.a = nextTick;
    }, /* 8 */
    /***/
    function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        /* harmony export (immutable) */
        __webpack_exports__.a = objectCreateComputedProp;
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__ = __webpack_require__(0);
        /* harmony import */
        var __WEBPACK_IMPORTED_MODULE_1__objectWatchProp__ = __webpack_require__(1);
        /**
 * Creates a computed property on a given object.
 *
 * @param {Object} obj
 * @param {String} prop
 * @param {Function} setter
 *  A callback function that will be used to retrieve the computed prop's
 *  value. Function is called with a context (`this`) of the object and
 *  will receive one input param - the Object itself.
 * @param {Boolean} [enumerable=true]
 *
 */
        function objectCreateComputedProp(obj, prop, setter) {
            var enumerable = !(arguments.length > 3 && void 0 !== arguments[3]) || arguments[3];
            var propValue = void 0;
            var needsInitialization = true;
            var allowSet = false;
            var needsNewValue = true;
            var dependencyTracker = function() {
                // If this computed property has watchers or dependents,
                // then update prop value.
                // else:
                // Just mark it as needing a new value, which means that the
                // property value will not be re-generated until the next
                // time the object prop is accessed.
                obj[__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.a].props[prop].dependents.size || obj[__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.a].props[prop].watchers.size ? setPropValue() : needsNewValue = true;
            };
            var setPropValue = function(silentSet) {
                Object(__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.c)(dependencyTracker);
                try {
                    if (silentSet) propValue = setter.call(obj); else {
                        // Update is done via the prop assignment, which means that
                        // all dependent/watcher notifiers is handled as part of the
                        // objectWatchProp() functionality.
                        // Doing the update this way also supports the use of these
                        // objects with other library that may also intercept getter/setters.
                        allowSet = true;
                        obj[prop] = setter.call(obj, obj);
                    }
                } catch (e) {
                    allowSet = false;
                    needsNewValue = false;
                    Object(__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.e)(dependencyTracker);
                    throw e;
                }
                allowSet = false;
                needsNewValue = false;
                Object(__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.e)(dependencyTracker);
            };
            // Does property already exists? Delete it.
            if (prop in obj) {
                delete obj[prop];
                // Was prop an observable? if so, signal that interceptors must be redefined.
                obj[__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.a] && obj[__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.a].props[prop] && (obj[__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.a].props[prop].setupInterceptors = true);
            }
            Object(__WEBPACK_IMPORTED_MODULE_0_common_micro_libs_src_jsutils_runtime_aliases__.d)(obj, prop, {
                configurable: true,
                enumerable: !!enumerable,
                get: function() {
                    if (needsInitialization) {
                        needsInitialization = false;
                        setPropValue(true);
                    } else needsNewValue && setPropValue();
                    return propValue;
                },
                set: function(newValue) {
                    allowSet && (propValue = newValue);
                    return propValue;
                }
            });
            Object(__WEBPACK_IMPORTED_MODULE_1__objectWatchProp__.b)(obj, prop);
        }
    } ]);
});
//# sourceMappingURL=observables.js.map