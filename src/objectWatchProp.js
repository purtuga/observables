import {objectDefineProperty, objectKeys} from "common-micro-libs/src/jsutils/runtime-aliases";
import Set from "common-micro-libs/src/jsutils/Set"
import nextTick from "common-micro-libs/src/jsutils/nextTick"

//---------------------------------------------------------------------------
export const OBSERVABLE_IDENTIFIER = "___$observable$___"; // FIXME: this should be a Symbol()
const DEFAULT_PROP_DEFINITION = { configurable: true, enumerable: true };
const TRACKERS = new Set();
const WATCHER_IDENTIFIER = "___$watching$___";
const isPureObject = obj => obj && Object.prototype.toString.call(obj) === "[object Object]";
const NOTIFY_QUEUE = new Set();
let isNotifyQueued = false;

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
 *  The callback will receive a new non-enumerable property named `stopWatchingAll` of
 *  type `Function` that can be used to remove the given callback from all places where
 *  it is being used to watch a property.
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
        objectMakeObservable(obj, false);

        if (callback) {
            // FIXME: should use `storeCallback` here?
            obj[OBSERVABLE_IDENTIFIER].watchers.add(callback);
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

function setupObjState(obj) {
    if (!obj[OBSERVABLE_IDENTIFIER]) {
        objectDefineProperty(obj, OBSERVABLE_IDENTIFIER, {
            configurable: true,
            writable: true,
            deep: false,
            value: {
                props: {},
                watchers: new Set()
            }
        });
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
            deep: false // FIXME: should this default what the setting is on the object state?
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

        // FIXME: if `deep` - we should walk val?
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
            if (obj[OBSERVABLE_IDENTIFIER].props[prop].deep  && isPureObject(newVal)) {
                objectMakeObservable(newVal);
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
}

/**
 * Makes an object (deep) observable.
 *
 * @param {Object} obj
 * @param {Boolean} [walk=true]
 *  If `true` (default), the object's property values are walked and
 *  also make observable.
 * @param {Boolean} [force=false]
 *  if true, then even if object looks like it might have already been
 *  converted to an observable, it will still be walked
 *  (if `walk` is `true`)
 */
export function objectMakeObservable(obj, walk = true, force = false) {
    if (!isPureObject(obj)) {
        return;
    }

    if (!obj[OBSERVABLE_IDENTIFIER]) {
        setupObjState(obj);
    }

    // If object is marked as "deep", then no need to do anything
    // else - object has already been converted to observable.
    if (!force && obj[OBSERVABLE_IDENTIFIER].deep) {
        return;
    }
    else if (walk) {
        obj[OBSERVABLE_IDENTIFIER].deep = true;
    }

    // make ALL props observable
    objectKeys(obj).forEach(prop => {   // TODO: can this function be made static?
        if (!obj[OBSERVABLE_IDENTIFIER].props[prop]) {
            setupPropState(obj, prop);
            setupPropInterceptors(obj, prop);
        }

        // Do we need to walk this property's value?
        if (
            walk &&
            (
                !obj[OBSERVABLE_IDENTIFIER].props[prop].deep ||
                force
            )
        ) {
            obj[OBSERVABLE_IDENTIFIER].props[prop].deep = true;

            if (isPureObject(obj[prop])) {
                objectMakeObservable(obj[prop], walk, force);
            }
        }
    });
}

function notify() {
    // this: new Set(). Set instance could have two additional attributes: async ++ isQueued

    if (!this.size) {
        return;
    }

    // If the watcher Set() is synchronous, then execute the callbacks now and exit
    if (!this.async) {
        this.forEach(execCallback);
        return;
    }

    this.forEach(pushCallbacksToQueue);

    if (isNotifyQueued) {
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
    if (callback[WATCHER_IDENTIFIER]) {
        callback[WATCHER_IDENTIFIER].stopWatchingAll();
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

export default objectWatchProp;
