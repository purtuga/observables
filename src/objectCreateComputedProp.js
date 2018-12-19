import {defineProperty} from "@purtuga/common/src/jsutils/runtime-aliases.js"
import nextTick from "@purtuga/common/src/jsutils/nextTick.js"
import {
    OBSERVABLE_IDENTIFIER,
    objectWatchProp,
    setDependencyTracker,
    unsetDependencyTracker,
    makeObservable
} from "./objectWatchProp.js";

//================================================================================
let alwaysForceExec = false;

/**
 * Creates a computed property on a given object.
 *
 * @param {Object} obj
 *
 * @param {String} prop
 *
 * @param {Function} setter
 *  A callback function that will be used to retrieve the computed prop's
 *  value. Function is called with a context (`this`) of the object and
 *  will receive one input param - the Object itself.
 *  Callback is executed only when the property is accessed or a tracked
 *  dependency changes AND watchers or dependents on this computed exist.
 *  To force a value to be generated everytime (even if no dependents/watchers)
 *  add a property to the function named `forceExec=true`.
 *
 * @param {Boolean} [enumerable=true]
 *
 * @example
 * const obj = {
 *     firstName: "paul",
 *     lastName: "Tavares"
 * };
 *
 * objectCreateComputedProp(obj, "name", function () {
 *     return `${ this.firstName } ${ this.lastName }`;
 * });
 *
 * // Or, to always force the callback to generate a value
 * function generateName() {
 *     return `${ this.firstName } ${ this.lastName }`;
 * }
 * generateName.forceExec = true;
 * objectCreateComputedProp(obj, "name", genereateName);
 *
 *
 */
function objectCreateComputedProp(obj, prop, setter, enumerable = true) {
    let propValue;
    let newValue;
    let needsInitialization = true;
    let allowSet = false;
    let needsNewValue = true;

    const dependencyTracker = () => {
        if (needsNewValue) {
            return;
        }

        needsNewValue = true;

        // If we have watchers on this computed prop, then queue the
        // value generator function.
        // else, just notify dependents.
        if (alwaysForceExec || setter.forceExec || obj[OBSERVABLE_IDENTIFIER].props[prop].watchers.size) {
            nextTick.queue(setPropValue);
        }
        else if (obj[OBSERVABLE_IDENTIFIER].props[prop].dependents.size) {
            obj[OBSERVABLE_IDENTIFIER].props[prop].dependents.notify();
        }
    };

    const setPropValue = silentSet => {
        // if there is no longer a need to regenerate the value, exit.
        // this can happen when other logic accesses the computed getter
        // between scheduled updates.
        if (!needsNewValue) {
            return;
        }

        try {
            setDependencyTracker(dependencyTracker);
            newValue = setter.call(obj, obj);
            unsetDependencyTracker(dependencyTracker); // IMPORTANT: turn if off right after setter is run!

            if (silentSet) {
                propValue = newValue;

                if (obj[OBSERVABLE_IDENTIFIER].props[prop].deep) {
                    makeObservable(propValue);
                }
            } else {
                // Update is done via the prop assignment, which means that
                // handing of `deep` and all dependent/watcher notifiers is handled
                // as part of the objectWatchProp() functionality.
                // Doing the update this way also supports the use of these
                // objects with other library that may also intercept getter/setters.
                allowSet = true;
                needsNewValue = false;
                obj[prop] = newValue;
            }
        } catch (e) {
            allowSet = false;
            needsNewValue = false;
            newValue = undefined;
            unsetDependencyTracker(dependencyTracker);
            throw e;
        }

        allowSet = false;
        needsNewValue = false;
        newValue = undefined;
    };

    dependencyTracker.asDependent = true;
    dependencyTracker.forProp = setPropValue.forProp = prop;

    // Does property already exists? Delete it.
    if (prop in obj) {
        delete obj[prop];

        // Was prop an observable? if so, signal that interceptors must be redefined.
        if (obj[OBSERVABLE_IDENTIFIER] && obj[OBSERVABLE_IDENTIFIER].props[prop]) {
            obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors = true;
        }
    }

    defineProperty(
        obj,
        prop,
        undefined,
        function(){
            if (needsInitialization) {
                needsInitialization = false;
                setPropValue(true);
            }
            else if (needsNewValue) {
                setPropValue();
            }

            return propValue;
        },
        function () {
            if (allowSet) {
                propValue = newValue;
            }
            return propValue;
        },
        true,
        !!enumerable
    );

    objectWatchProp(obj, prop);
}

/**
 * Set/unset the `forceExec` which (when `true` causes all computed value generator
 * to always be called on dependency changes (even if internally to this library,
 * there are no watchers/dependents on it).
 *
 * @param {Boolean} force
 */
function setForceExec(force) {
    alwaysForceExec = force;
}

//=======================================================[ EXPORTS ]==========
export default objectCreateComputedProp;
export { objectCreateComputedProp, setForceExec }