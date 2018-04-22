import {objectDefineProperty} from "common-micro-libs/src/jsutils/runtime-aliases"
import {
    OBSERVABLE_IDENTIFIER,
    objectWatchProp,
    setDependencyTracker,
    unsetDependencyTracker
} from "./objectWatchProp";

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
export function objectCreateComputedProp(obj, prop, setter, enumerable = true) {
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
        setPropValue();
    };
    dependencyTracker.asDependent = true;
    dependencyTracker.forProp = prop;

    const setPropValue = silentSet => {
        try {
            setDependencyTracker(dependencyTracker);
            newValue = setter.call(obj, obj);
            unsetDependencyTracker(dependencyTracker); // IMPORTANT: turn if off right after setter is run!

            if (silentSet) {
                propValue = newValue;

                // FIXME: if property is marked as "deep", then make value observable.
                //          This only needs to be done here - in silent mode. in regular
                //          update, watchProp takes care of it.

            } else {
                // Update is done via the prop assignment, which means that
                // all dependent/watcher notifiers is handled as part of the
                // objectWatchProp() functionality.
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

    // Does property already exists? Delete it.
    if (prop in obj) {
        delete obj[prop];

        // Was prop an observable? if so, signal that interceptors must be redefined.
        if (obj[OBSERVABLE_IDENTIFIER] && obj[OBSERVABLE_IDENTIFIER].props[prop]) {
            obj[OBSERVABLE_IDENTIFIER].props[prop].setupInterceptors = true;
        }
    }

    objectDefineProperty(obj, prop, {
        configurable: true,
        enumerable: !!enumerable,
        get() {
            if (needsInitialization) {
                needsInitialization = false;
                setPropValue(true);
            }
            else if (needsNewValue) {
                setPropValue();
            }

            return propValue;
        },
        set(newValue) {
            if (allowSet) {
                propValue = newValue;
            }
            return propValue;
        }
    });

    objectWatchProp(obj, prop);
    obj[OBSERVABLE_IDENTIFIER].props[prop].isComputed = true;
}

export default objectCreateComputedProp;