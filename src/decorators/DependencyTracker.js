import {setDependencyTracker, unsetDependencyTracker, stopTrackerNotification} from "../objectWatchProp.js";
import {objectKeys} from "@purtuga/common/src/jsutils/runtime-aliases.js"

//=========================================================================================

/**
 * Intercepts calls to given Class Methods and setups up dependency trackers
 * for given methods.
 *
 * @param {Object} options
 * @param {Object<String, Function>} options.track
 * @param {Object<String, Function>} options.stop
 *
 * @return {Function}
 *
 * @example
 *
 * @trackObservableUsage({
 *     track: {
 *         _setView: inst => inst._queueUpdate
 *     },
 *     stop: {
 *         didUnmount() {
 *             return inst._queueUpdate;
 *         }
 *     }
 * });
 * class extends HTMLElement {}
 */
export function trackObservableDependencies (options){
    const superMethods = {};

    return function (classDescriptor) {
        Object.entries(options.track).forEach(([member, tracker]) => {
            setupClassMemberInterceptor(
                classDescriptor,
                superMethods,
                classDescriptor.elements.find(element => element.key === member),
                member,
                tracker
            );
        });

        // Add `stop` trackers
        if (options.stop) {
            Object.entries(options.stop).forEach(([member, tracker]) => {
                setupClassMemberInterceptor(
                    classDescriptor,
                    superMethods,
                    classDescriptor.elements.find(element => element.key === member),
                    member,
                    tracker,
                    true
                );
            });
        }

        // When class setup is done, capture the original method from the Class that this
        // one was subclassed from.
        classDescriptor.finisher = function (ClassDef) {
            const SuperClass = Object.getPrototypeOf(ClassDef);

            objectKeys(superMethods).forEach(methodName => {
                superMethods[methodName] = SuperClass.prototype[methodName];
            });
        };

        return classDescriptor;
    }
}

function setupClassMemberInterceptor (classDescriptor, superMethods, currentMemberDescriptor, memberName, getTracker, isStopMode) {
    // Method does not exist on current (sub)class... Create it now
    if (!currentMemberDescriptor) {
        superMethods[memberName] = null; // Need to get `super` method later.

        classDescriptor.elements.push({
            kind: "method",
            key: memberName,
            placement: "prototype",
            descriptor: {
                configurable: true,
                value: isStopMode
                    ? function () {
                        superMethods[memberName].call(this, ...arguments);
                        stopTrackerNotification(getTracker.call(this, this));
                    }
                    : function () {
                    const observableTracker = getTracker.call(this, this);
                    setDependencyTracker(observableTracker);
                    superMethods[memberName].call(this, ...arguments);
                    unsetDependencyTracker(observableTracker);
                }
            }
        });
    } else {
        const currentMemberMethod = currentMemberDescriptor.descriptor.value;

        currentMemberDescriptor.descriptor = Object.assign({}, currentMemberDescriptor.descriptor);
        currentMemberDescriptor.descriptor.value = isStopMode
            ? function () {
                stopTrackerNotification(getTracker.call(this, this));
            }
            : function (){
                const observableTracker = getTracker.call(this, this);
                setDependencyTracker(observableTracker);
                currentMemberMethod.call(this, ...arguments);
                unsetDependencyTracker(observableTracker);
            };
    }
}
