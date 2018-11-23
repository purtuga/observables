import {objectDefineProperty, objectKeys, isArray} from "@purtuga/common/src/jsutils/runtime-aliases";
import Set from "@purtuga/common/src/jsutils/Set"
import nextTick from "@purtuga/common/src/jsutils/nextTick"

//---------------------------------------------------------------------------
export const OBSERVABLE_IDENTIFIER = "___$observable$___"; // FIXME: this should be a Symbol()

const DEFAULT_PROP_DEFINITION = { configurable: true, enumerable: true };
let TRACKERS = new Set();
const WATCHER_IDENTIFIER = "___$watching$___";
const ARRAY_WATCHABLE_PROTO = "__$watchable$__";
const HAS_ARRAY_WATCHABLE_PROTO = `__$is${ARRAY_WATCHABLE_PROTO}`;
const ARRAY_MUTATING_METHODS = [
    "pop",
    "push",
    "shift",
    "splice",
    "unshift",
    "sort",
    "reverse"
];
const isPureObject = obj => obj && Object.prototype.toString.call(obj) === "[object Object]";
const NOTIFY_QUEUE = new Set();
let isNotifyQueued = false;

// DEV MODE
// This facilitates when in dev mode and using npm link'ed package.
if (process.env.NODE_ENV !== "production") {
    if (!window._OBSERVABLE_TRACKERS ) {
        window._OBSERVABLE_TRACKERS = TRACKERS;
    } else {
        TRACKERS = window._OBSERVABLE_TRACKERS;
    }
}

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
 *  __NOTE:__
 *  The callback will include a new non-enumerable property named `stopWatchingAll` of
 *  type `Function` that can be used to remove the given callback from all places where
 *  it is being used to watch a property. example:
 *
 *      const obj1 = { first: "john" };
 *      const obj2 = { last: "smith" };
 *      const watcher = () => console.log("changed");
 *
 *      objectWatchProp(obj, "first", watcher);
 *      objectWatchProp(obj1, "last", watcher);
 *
 *      watcher.stopWatchingAll(); // removes callback from all objects that it is watching
 *
 *
 * @return {ObjectUnwatchProp}
 * Return a function to unwatch the property. Function also has a static property named
 * `destroy` that will do the same thing (ex. `unwatch.destroy()` is same as `unwatch()`)
 *
 * @example
 *
 * const oo = {};
 * const notifyNameChanged =() => console.log(`name changed: ${oo.name}`);
 * const unWatchName = objectWatchProp(oo, "name", notifyNameChanged);
 *
 * oo.name = "paul"; // console outputs: name changed: paul
 * unWatchName(); // stop watching
 * notifyNameChanged.stopWatchingAll(); // callback's `stopWatchingAll()` can also be called.
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
 * // OR: make all properties of object observable
 * objectWatchProp(oo);
 *
 */
export function objectWatchProp(obj, prop, callback) {
    if (!obj[OBSERVABLE_IDENTIFIER]) {
        setupObjState(obj);
    }

    // Convert prop to observable?
    if (prop && !obj[OBSERVABLE_IDENTIFIER].props[prop]) {
        setupPropState(obj, prop);
        setupPropInterceptors(obj, prop);
    }
    // Else: do we need to setup the interceptors (again)?
    // (Used by Computed props when they are created against a prop has
    // been setup as an observable)
    else if (prop && obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors) {
        setupPropInterceptors(obj, prop);
    }

    if (prop && callback) {
        obj[OBSERVABLE_IDENTIFIER].props[prop].storeCallback(callback);
    }
    else if (!prop) {
        makeObservable(obj, false);

        if (callback) {
            obj[OBSERVABLE_IDENTIFIER].storeCallback(callback);
        }
    }

    /**
     * Unwatch an object property or object.
     *
     * @typedef {Function} ObjectUnwatchProp
     * @property {Function} destroy Same as function returned.
     */
    const unWatch = destroyWatcher.bind(
        obj,
        callback,
        (prop ? obj[OBSERVABLE_IDENTIFIER].props[prop] : obj[OBSERVABLE_IDENTIFIER])
    );

    unWatch.destroy = unWatch;
    return unWatch;
}

export function setupObjState(obj) {
    if (!obj[OBSERVABLE_IDENTIFIER]) {
        objectDefineProperty(obj, OBSERVABLE_IDENTIFIER, {
            configurable: true,
            writable: true,
            deep: false,
            value: {
                props: {},
                dependents: new Set(),
                watchers: new Set(),
                storeCallback: storeCallback
            }
        });
        setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].dependents, false);
        setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].watchers, true);
    }
}

function setupCallbackStore (store, async = false) {
    store.async = async;
    store.isQueued = false;
    store.notify = notify;
}

function setupPropState(obj, prop) {
    if (!obj[OBSERVABLE_IDENTIFIER].props[prop]) {
        obj[OBSERVABLE_IDENTIFIER].props[prop] = {
            val: undefined,
            dependents: new Set(),
            watchers: new Set(),
            parent: obj[OBSERVABLE_IDENTIFIER],
            storeCallback: storeCallback,
            setupInterceptors: true,
            deep: obj[OBSERVABLE_IDENTIFIER].deep
        };
        setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].props[prop].dependents, false);
        setupCallbackStore(obj[OBSERVABLE_IDENTIFIER].props[prop].watchers, true);
    }
    return obj[OBSERVABLE_IDENTIFIER].props[prop];
}

function setupPropInterceptors(obj, prop) {
    const propOldDescriptor =
        Object.getOwnPropertyDescriptor(obj, prop) || DEFAULT_PROP_DEFINITION;

    if (!propOldDescriptor.get) {
        obj[OBSERVABLE_IDENTIFIER].props[prop].val = obj[prop];

        // If prop is marked as `deep` then walk the value and convert it to observables
        if (obj[OBSERVABLE_IDENTIFIER].props[prop].deep) {
            makeObservable(obj[OBSERVABLE_IDENTIFIER].props[prop].val);
        }
    }

    objectDefineProperty(obj, prop, {
        configurable: propOldDescriptor.configurable || false,
        enumerable: propOldDescriptor.enumerable || false,
        get() {
            if (TRACKERS.size) {
                TRACKERS.forEach(
                    obj[OBSERVABLE_IDENTIFIER].props[prop].storeCallback,
                    obj[OBSERVABLE_IDENTIFIER].props[prop]
                );
            }

            if (propOldDescriptor.get) {
                return propOldDescriptor.get.call(obj);
            }

            return obj[OBSERVABLE_IDENTIFIER].props[prop].val;
        },
        set(newVal) {
            const priorVal = obj[prop];
            if (propOldDescriptor.set) {
                newVal = propOldDescriptor.set.call(obj, newVal);
            } else {
                obj[OBSERVABLE_IDENTIFIER].props[prop].val = newVal;
            }

            // If this `deep` is true and the new value is an object,
            // then ensure its observable
            if (obj[OBSERVABLE_IDENTIFIER].props[prop].deep) {
                makeObservable(newVal);
            }

            if (newVal !== priorVal) {
                obj[OBSERVABLE_IDENTIFIER].props[prop].watchers.notify();
                obj[OBSERVABLE_IDENTIFIER].props[prop].dependents.notify();
                obj[OBSERVABLE_IDENTIFIER].watchers.notify();
            }

            return newVal;
        }
    });

    obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors = false;

    // Notify object watchers that a new prop was added
    if (propOldDescriptor === DEFAULT_PROP_DEFINITION) {
        obj[OBSERVABLE_IDENTIFIER].watchers.notify();
    }
}

/**
 * Makes an object (deep) observable.
 *
 * @param {Object|Array} obj
 * @param {Boolean} [walk=true]
 *  If `true` (default), the object's property values are walked and
 *  also make observable.
 * @param {Boolean} [force=false]
 *  if true, then even if object looks like it might have already been
 *  converted to an observable, it will still be walked
 *  (if `walk` is `true`)
 *
 * @return {Object|Array} Original `obj` is returned
 */
export function makeObservable(obj, walk = true, force = false) {
    if (!isPureObject(obj) && !isArray(obj)) {
        return obj;
    }

    if (!obj[OBSERVABLE_IDENTIFIER]) {
        // OBJECT
        if (isPureObject(obj)) {
            setupObjState(obj, force);
        }
        // ARRAY
        else if (isArray(obj)) {
            makeArrayWatchable(obj, force);
        }
    }

    // If object is marked as "deep" and we are not forcing the walk,
    // then no need to do anything. Otherwise, mark this object as
    // being `deep` and keep going
    if (!force && obj[OBSERVABLE_IDENTIFIER].deep) {
        return;
    }
    else if (walk) {
        obj[OBSERVABLE_IDENTIFIER].deep = true;
    }

    if (isArray(obj)) {
        walkArray(obj);
    }
    else {
        walkObject(obj);
    }

    return obj;
}


function walkArray(arr, force) {
    for (let i=0, t=arr.length; i<t; i++) {
        makeObservable(arr[i], true, force);
    }
}

function walkObject(obj, force) {
    // make ALL props observable
    const keys = objectKeys(obj);

    for (let i=0, t=keys.length; i<t; i++) {
        if (!obj[OBSERVABLE_IDENTIFIER].props[keys[i]]) {
            setupPropState(obj, keys[i]);
            setupPropInterceptors(obj, keys[i]);
        }

        // Do we need to walk this property's value?
        if (
            !obj[OBSERVABLE_IDENTIFIER].props[keys[i]].deep ||
            force
        ) {
            obj[OBSERVABLE_IDENTIFIER].props[keys[i]].deep = true;

            if (isPureObject(obj[keys[i]])) {
                makeObservable(obj[keys[i]], true, force);
            }
        }
    }
}

function notify() {
    // this: new Set(). Set instance could have two additional attributes: async ++ isQueued

    if (!this.size) {
        return;
    }

    // If the watcher Set() is synchronous, then execute the callbacks now
    if (!this.async) {
        this.forEach(execCallback);

    } else {
        this.forEach(pushCallbacksToQueue);
    }

    queueCallbackAndScheduleRun();
}

export function queueCallbackAndScheduleRun(cb) {
    if (cb) {
        pushCallbacksToQueue(cb);
    }

    if (isNotifyQueued || !NOTIFY_QUEUE.size) {
        return;
    }

    isNotifyQueued = true;
    nextTick(flushQueue);
}

function pushCallbacksToQueue(callback) {
    NOTIFY_QUEUE.add(callback);
}

function execCallback(cb) {
    cb();
}

function flushQueue() {
    const queuedCallbacks = [...NOTIFY_QUEUE];
    NOTIFY_QUEUE.clear();
    isNotifyQueued = false;
    for (let x=0, total=queuedCallbacks.length; x<total; x++) {
        queuedCallbacks[x]();
    }
    queuedCallbacks.length = 0;
}

function storeCallback(callback) {
    // this === PropState
    if (callback.asDependent && this.dependents) {
        setCallbackAsWatcherOf(callback, this.dependents);
        this.dependents.add(callback);
    } else {
        setCallbackAsWatcherOf(callback, this.watchers);
        this.watchers.add(callback);
    }
}

export function destroyWatcher(callback, propSetup) {
    // this == obj
    if (callback) {
        // Object state does not have dependents
        if (propSetup.dependents) {
            propSetup.dependents.delete(callback);
            unsetCallbackAsWatcherOf(callback, propSetup.dependents);
        }
        propSetup.watchers.delete(callback);
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
export function setDependencyTracker(callback) {
    TRACKERS.add(callback);
}

/**
 * Removes a callback from being added to a property's watchers as they
 * are accessed.
 *
 * @param {Function} callback
 */
export function unsetDependencyTracker(callback) {
    TRACKERS.delete(callback);
}

/**
 * Removes the given callback from all property watchers lists that it may
 * be included in.
 *
 * @param {Function} callback
 */
export function stopTrackerNotification(callback) {
    if (callback && callback.stopWatchingAll) {
        callback.stopWatchingAll();
    }
}


/**
 * Store a reference to the Set instance provided on input, on the callback.
 * @private
 * @param {Function} callback
 * @param {Set} watchersSet
 */
function setCallbackAsWatcherOf(callback, watchersSet) {
    if (!callback[WATCHER_IDENTIFIER]) {
        objectDefineProperty(callback, WATCHER_IDENTIFIER, {
            configurable: true,
            writable: true,
            value: {
                watching: new Set()
            }
        });
        objectDefineProperty(callback, "stopWatchingAll", {
            configurable: true,
            writable: true,
            value() {
                callback[WATCHER_IDENTIFIER].watching.forEach(watcherList =>
                    watcherList.delete(callback)
                );
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
    if (callback[WATCHER_IDENTIFIER]) {
        callback[WATCHER_IDENTIFIER].watching.delete(watchersSet);
    }
}


export function makeArrayWatchable(arr) {
    if (!arr[OBSERVABLE_IDENTIFIER]) {
        setupObjState(arr);
    }

    // If array already has a watchable prototype, then exit
    if (arr[HAS_ARRAY_WATCHABLE_PROTO]) {
        return;
    }

    const arrCurrentProto = arr.__proto__; // eslint-disable-line

    // Create prototype interceptors?
    if (!arrCurrentProto[ARRAY_WATCHABLE_PROTO]) {
        const arrProtoInterceptor = Object.create(arrCurrentProto);
        ARRAY_MUTATING_METHODS.forEach(method => {
            objectDefineProperty(arrProtoInterceptor, method, {
                configurable: true,
                writable: true,
                value: function arrayMethodInterceptor(...args) {
                    // FIXME: need to call `makeObservable` on any value that was inserted, if `deep` is true
                    const response = arrCurrentProto[method].call(this, ...args);
                    this[OBSERVABLE_IDENTIFIER].dependents.notify();
                    this[OBSERVABLE_IDENTIFIER].watchers.notify();
                    return response;
                }
            });
        });

        // VALUE ADD: include a `size` read only attribute
        objectDefineProperty(arrProtoInterceptor, "size", {
            configurable: true,
            get() {
                if (TRACKERS.size) {
                    TRACKERS.forEach(
                        this[OBSERVABLE_IDENTIFIER].storeCallback,
                        this[OBSERVABLE_IDENTIFIER]
                    );
                }
                return this.length;
            }
        });

        // Add flag to new array interceptor prototype indicating its watchable
        objectDefineProperty(arrProtoInterceptor, HAS_ARRAY_WATCHABLE_PROTO, {
            value: true
        });

        // Store the new interceptor prototype on the real prototype
        objectDefineProperty(arrCurrentProto, ARRAY_WATCHABLE_PROTO, {
            configurable: true,
            writable: true,
            value: arrProtoInterceptor
        });
    }

    arr.__proto__ = arrCurrentProto[ARRAY_WATCHABLE_PROTO]; // eslint-disable-line
}


export default objectWatchProp;
