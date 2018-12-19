import {
    isObservable,
    isPropObservable,
    objectWatchProp,
    setupObjState,
    setupPropAsObservable
} from "../objectWatchProp.js";
import {throwIfThisIsPrototype} from "@purtuga/common/src/jsutils/throwIfThisIsPrototype.js";
import {getPropertyDescriptor, isArray, isObject, objectKeys} from "@purtuga/common/src/jsutils/runtime-aliases.js";
import objectCreateComputedProp from "../objectCreateComputedProp.js";

//====================================================================
let isSettingUp = false;
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
 *  If true, then class will not be decorated with the class methods (`$prop()`, `$on()`, `$assign`)
 *
 * @param {Array} [options.props]
 *
 * @param {Object} [options.computed]
 *
 * @returns {Function}
 *
 * @example
 *
 * @ObservableMembers({
 *     props: ["firstName", "lastName"],
 *     computed: {
 *         name() {
 *             return `${ this.firstName } ${ this.lastName }`;
 *         }
 *     }
 * })
 * class Model {}
 *
 */
function ObservableMembers(options = {}) {
    return function (classDescriptor) {
        if (!options.noMethods) {
            addMethodsToClassDescriptor(classDescriptor);
        }

        // Add props to the prototype
        if (isArray(options.props)) {
            classDescriptor.elements.push(
                ...options.props.map(propName => getElementDescriptorForProp(propName))
            )
        }

        // Add computed to the prototype
        if (options.computed) {
            objectKeys(options.computed).forEach(
                propName => classDescriptor.elements.push(getElementDescriptorForProp(propName, options.computed[propName]))
            );
        }

        return classDescriptor;
    }
}

function observable() {
    //FIXME: create @observable prop decorator
}

function computed() {
    // FIXME: create @computed prop decorator
}


function addMethodsToClassDescriptor (classDescriptor) {
    removeKeyFromClassDescriptor("$on", classDescriptor);
    removeKeyFromClassDescriptor("$prop", classDescriptor);
    classDescriptor.elements.push(
        {
            kind: "method",
            key: "$on",
            placement: "prototype",
            descriptor: getPropertyDescriptor($onMethodHandler)
        },
        {
            kind: "method",
            key: "$prop",
            placement: "prototype",
            descriptor:getPropertyDescriptor($propMethodHandler)
        },
        {
            kind: "method",
            key: "$assign",
            placement: "prototype",
            descriptor:getPropertyDescriptor($assignMethodHandler)
        }
    );
}

function $onMethodHandler(propName, callback) {
    throwIfThisIsPrototype(this);
    if (propName) {
        return objectWatchProp(this, propName, callback);
    }
    return NOOP;
}

function $propMethodHandler(propName) {
    throwIfThisIsPrototype(this);
    if (propName) {
        ensurePropIsObservable(this, propName);

        // Update mode?
        if (arguments.length > 1) {
            this[propName] = arguments[0];
        }

        return this[propName];
    }
}

function $assignMethodHandler(obj) {
    throwIfThisIsPrototype(this);
    if (isObject(obj)) {
        objectKeys(obj).forEach(propName => {
            ensurePropIsObservable(this, propName);
            this[propName] = obj[propName];
        });
    }
}

function ensurePropIsObservable(obj, propName) {
    if (!isObservable(obj)) {
        setupObjState(obj);
    }
    if (!isPropObservable(obj, propName)) {
        setupPropAsObservable(obj, propName);
    }
}

function removeKeyFromClassDescriptor(key, {elements}) {
    for (let i = 0, t = elements.length; i < t; i++) {
        if (elements[i].key === key) {
            elements.splice(i, 1);
            break;
        }
    }
}

function getElementDescriptorForProp(propName, computedGetter) {
    const propLazySetup = function() {
        throwIfThisIsPrototype(this);

        if (isSettingUp) { // Fuck you IE
            return;
        }

        isSettingUp = true;
        delete this[propName];

        if (computedGetter) {
            objectCreateComputedProp(this, propName, computedGetter);
        } else {
            ensurePropIsObservable(this, propName);
        }

        isSettingUp = false;

        // Was property being update?
        if (arguments.length) {
            this[propName] = arguments[0];
        }

        return this[propName];
    };

    return {
        key: propName,
        kind: "method",
        placement: "prototype",
        descriptor: getPropertyDescriptor(
            undefined,
            propLazySetup,
            propLazySetup,
            true,
            true
        )
    }
}


//=====================================================[ EXPORTS ]========
export {
    ObservableMembers
}
