import { OBSERVABLE_IDENTIFIER, setupObjState } from "./objectWatchProp";

const objectDefineProperty = Object.defineProperty;

//---------------------------------------------------------------
const WATCHABLE_PROTO = "__$watchable$__";
const IS_WATCHABLE_PROTO = `__$is${WATCHABLE_PROTO}`;
const mutatingMethods = [
    "pop",
    "push",
    "shift",
    "splice",
    "unshift",
    "sort",
    "reverse"
];

/**
 * Watch an array for changes.  Utiltiy will override the array's mutating methods
 * so that notification can be provided to watchers when it changes
 *
 * @param {Array} arr
 * @param {Function} [callback]
 *  If not defined, then array is simply made "watchable"
 */
export function arrayWatch(arr, callback) {
    if (!arr[OBSERVABLE_IDENTIFIER]) {
        setupObjState(arr);
        makeArrayWatchable(arr);
    }
    if (callback) {
        arr[OBSERVABLE_IDENTIFIER].watchers.add(callback);
    }

    const unWatch = () => arr[OBSERVABLE_IDENTIFIER].watchers.delete(callback);
    unWatch.destroy = unWatch;
    return unWatch;
}
export default arrayWatch;

function makeArrayWatchable(arr) {
    if (arr[IS_WATCHABLE_PROTO]) {
        return;
    }
    const arrCurrentProto = arr.__proto__; // eslint-disable-line

    // Create prototype interceptors?
    if (!arrCurrentProto[WATCHABLE_PROTO]) {
        const arrProtoInterceptor = Object.create(arrCurrentProto);
        mutatingMethods.forEach(method => {
            objectDefineProperty(arrProtoInterceptor, method, {
                configurable: true,
                writable: true,
                value: function arrayMethodInterceptor(...args) {
                    const response = arrCurrentProto[method].call(this, ...args);
                    arr[OBSERVABLE_IDENTIFIER].watchers.notify();
                    return response;
                }
            });
        });
        objectDefineProperty(arrProtoInterceptor, IS_WATCHABLE_PROTO, {
            value: true
        });
        objectDefineProperty(arrCurrentProto, WATCHABLE_PROTO, {
            configurable: true,
            writable: true,
            value: arrProtoInterceptor
        });
    }

    arr.__proto__ = arrCurrentProto[WATCHABLE_PROTO]; // eslint-disable-line
}
