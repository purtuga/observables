import {
    isObservable,
    isPropObservable,
    objectWatchProp,
    setupObjState,
    setupPropAsObservable
} from "../objectWatchProp.js";
import {throwIfThisIsPrototype} from "@purtuga/common/src/jsutils/throwIfThisIsPrototype.js";
import {getPropertyDescriptor, isArray, isObject, objectKeys} from "@purtuga/common/src/jsutils/runtime-aliases.js";
import {getElementDescriptor} from "@purtuga/common/src/jsutils/decorator-utils.js";
import objectCreateComputedProp from "../objectCreateComputedProp.js";


//====================================================================
const METHODS = [
    ["$on", $onMethodHandler],
    ["$prop", $propMethodHandler],
    ["$assign", $assignMethodHandler]
];
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

/**
 * Class member decorator that will make that member observable.
 *
 * @param {Object} [options]
 * @param {Boolean} [options.enumerable=true]
 */
function observable(options = {}) {
    const observableDecorator = function observableDecorator(elementDescriptor) {
        return getElementDescriptorForProp(
            elementDescriptor.key,
            null,
            ("enumerable" in options) ? options.enumerable : true,
            elementDescriptor.initializer || elementDescriptor.descriptor.get
        );
    };

    if (options && options.key) {
        return observableDecorator(options);
    } else {
        return observableDecorator;
    }
}


/**
 * Class member decorator that will make that member observable.
 *
 * @param {Object} [options]
 * @param {Boolean} [options.enumerable=true]
 */
function computed(options = {}) {
    const observableDecorator = function observableDecorator(elementDescriptor) {
        let computedValueGenerator;

        if (elementDescriptor.kind === "field" && elementDescriptor.initializer) {
            computedValueGenerator = elementDescriptor.initializer();
        } else {
            computedValueGenerator = elementDescriptor.descriptor.value || elementDescriptor.descriptor.get;
        }

        if (!computedValueGenerator) {
            if (process.env.NODE_ENV !== "production") {
                // eslint-disable-next-line
                console.error(`[@computed()] Computed must be setup with function value 
                which will act as the computed value generator. Example:
                '@computed ${elementDescriptor.key} = function () {/*...*/}'`);
            }

            throw new Error("no computedValueGenerator");
        }

        return getElementDescriptorForProp(
            elementDescriptor.key,
            computedValueGenerator,
            ("enumerable" in options) ? options.enumerable : true
        );
    };

    if (options && options.key) {
        return observableDecorator(options);
    } else {
        return observableDecorator;
    }
}

function addMethodsToClassDescriptor (classDescriptor) {
    classDescriptor.elements.push(
        ...METHODS.map(methodSetup => getElementDescriptor(
                methodSetup[0],
                getPropertyDescriptor(methodSetup[1])
            )
        )
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
        // Update mode?
        if (arguments.length > 1) {
            this[propName] = arguments[1];
        }
        // IMPORTANT: ensure the property lazy setup is done prior to running
        // ensurePropIsObservable. This will ensure that any prop that was defined
        // initially has its setup done, prior to evaluating if prop is observable
        // (case its a prop not initially defined).
        const response = this[propName];
        ensurePropIsObservable(this, propName);
        return response;
    }
}

function $assignMethodHandler(obj) {
    throwIfThisIsPrototype(this);
    if (isObject(obj)) {
        objectKeys(obj).forEach(propName => {
            // IMPORTANT: prop could be a "lazy" setup one,
            // so we assign value first, then ensure its observable.
            this[propName] = obj[propName];
            ensurePropIsObservable(this, propName);
        });
    }
}

function ensurePropIsObservable(obj, propName, configurable, enumerable) {
    if (!isObservable(obj)) {
        setupObjState(obj);
    }
    if (!isPropObservable(obj, propName)) {
        setupPropAsObservable(obj, propName, configurable, enumerable);
    }
}

function getElementDescriptorForProp(propName, computedGetter, enumerable = true, valueInitializer = null) {
    let isSettingUp = false;

    const propLazySetup = function() {
        throwIfThisIsPrototype(this);

        if (isSettingUp) { // Fuck you IE
            return;
        }

        isSettingUp = true;
        delete this[propName];

        if (computedGetter) {
            objectCreateComputedProp(this, propName, computedGetter, enumerable);
        } else {
            ensurePropIsObservable(this, propName, null, enumerable);
        }

        isSettingUp = false;

        // Was property being updated - if so, assign that value
        // Else, if not a computed and we have a valueInitializer, then run that.
        if (arguments.length) {
            this[propName] = arguments[0];
        } else if (!computedGetter && valueInitializer) {
            this[propName] = valueInitializer.call(this);
        }

        return this[propName];
    };

    return getElementDescriptor(
        propName,
        getPropertyDescriptor(
            undefined,
            propLazySetup,
            propLazySetup,
            true,
            enumerable
        )
    );
}


//=====================================================[ EXPORTS ]========
export {
    ObservableMembers,
    observable,
    computed
}
