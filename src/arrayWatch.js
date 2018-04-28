import { OBSERVABLE_IDENTIFIER, makeArrayWatchable } from "./objectWatchProp";

//========================================================================

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
        makeArrayWatchable(arr);
    }

    if (callback) {
        arr[OBSERVABLE_IDENTIFIER].storeCallback(callback);
    }

    const unWatch = () => arr[OBSERVABLE_IDENTIFIER].watchers.delete(callback);
    unWatch.destroy = unWatch;
    return unWatch;
}
export default arrayWatch;
