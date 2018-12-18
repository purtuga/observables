import {
    isObservable,
    isPropObservable,
    objectWatchProp,
    setupObjState,
    setupPropAsObservable
} from "../objectWatchProp.js";
import {throwIfThisIsPrototype} from "@purtuga/common/src/jsutils/throwIfThisIsPrototype.js";

//====================================================================
const NOOP = () => undefined;
NOOP.destroy = NOOP;


/**
 * Decorates a class with methods that allow it to watch observables as well
 * as add instance members (fields) to the class of either regular observables
 * or computed props.
 *
 * @param {Object} [options]
 *
 * @param {Array} [options.noMethods]
 *  If true, then class will not be decorated with the class methods (`$prop()`, `$on()`)
 *
 * @param {Array} [options.props]
 *
 * @param {Object} [options.computed]
 *
 * @returns {Function}
 */
export function ObservableMembers(options = {}) {
    return function (classDescriptor) {
        if (!options.noMethods) {
            addMethodsToClassDescriptor(classDescriptor);
        }

        // FIXME: implement `props`
        // FIXME: implement `computed`

        return classDescriptor;
    }
}

function addMethodsToClassDescriptor (classDescriptor) {
    removeKeyFromClassDescriptor("$on", classDescriptor);
    removeKeyFromClassDescriptor("$prop", classDescriptor);
    classDescriptor.elements.push(
        {
            kind: "method",
            key: "$on",
            placement: "prototype",
            descriptor: { // FIXME: use `getPropertyDescriptor()` from @purtuga/common
                configurable: true,
                value: $onClassHandler
            }
        },
        {
            kind: "method",
            key: "$prop",
            placement: "prototype",
            descriptor: { // FIXME: use `getPropertyDescriptor()` from @purtuga/common
                configurable: true,
                value: $propClassHandler
            }
        }
    );
}

function $onClassHandler(propName, callback) {
    throwIfThisIsPrototype(this);
    if (propName) {
        return objectWatchProp(this, propName, callback);
    }
    return NOOP;
}

function $propClassHandler(propName) {
    throwIfThisIsPrototype(this);
    if (propName) {
        if (isObservable(this)) {
            setupObjState(this);
        }
        if (isPropObservable(this, propName)) {
            setupPropAsObservable(this, propName);
        }
        // Update mode?
        if (arguments.length > 1) {
            this[propName] = arguments[0];
        }

        return this[propName];
    }
}

function removeKeyFromClassDescriptor(key, classDesriptor) {

}

