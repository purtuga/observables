# observables

Enable the ability for Arrays and Objects to notify listeners when their content changes. Use it to create reactive interfaces or trigger logic when data changes. In addition, Computed Properties - properties whose value is generated when dependencies changes - can also be created.


## Installation

```bash
$ npm install @purtuga/observables --save
```

## Observe Objects

Observable Objects are normal JavaScript Objects whose properties can be "watched" for changes. 

```javascript
import { objectWatchProp } from "observables"

const user = {
    firstName: "Paul", 
    lastName: "Tavares" 
};
const unWatchFirst = objectWatchProp(user, "firstName", () => console.log("first named changed"));

user.firstName = "Jack"; // console: "first named changed"

// Stop listening to event
unWatchFirst();
```

To get notified of all changes to the object, leave the second param empty

```
objectWatchProp(user, null, () => console.log("Object changed."));
```


## Observe Arrays
Arrays, like object, can be observed for changes. Note however, that due to the nature of Arrays in javascript, not all changes can be captured - example: direct array member creation (`arr[arr.length] = 'new value'`)can not be detected.  Only changes that are done via the Array's mutating methods will notify Watchers of changes.

```javascript
import { watchArray } from "observables"

const users = [];
const unWatchUsers watchArray(users, () => console.log("array changed"));

users.push("Paul", "Jack"); // Console: "array changed"

// Stop listening for changes
unWatchUsers();
```

### Observed Arrays `size` Property
Arrays that are made Observable will also have a new Array property (read only) named `size` which return the size (`length`) of the array with one added value: any dependency trackers are automatically set as Watchers of the array. This makes it ideal to use with Computed Properties (see below)

```javascript
import { watchArray } from "observables"

const users = [];
watchArray(users);

users.push(1, 2);
console.log(users.size); // Console: 2
```


## Convert Objects/Arrays to Observables
To recursively convert objects and arrays to observables, use the `makeObservable` method.  This is ideal when wanting to create computed properties (see below) that may have dependencies comming from multiple objects or arrays.

```javascript
import { makeObservable } from "observable"

const obj = {
    key1: {
        key1_1: {
            key1_1_1: "value 1-1-1"
        },
        keys1_2: [
            {
                k1: "v1"
            }
        ]
    }
};

makeObservable(obj); // Makes all Objects/Arrays observable

```

## Create Computed Properties

Computed properties allow you to create properties whose value is generated via a callback function. If that callback function, in its logic, uses properties from __any__ observable property, then it will notify its watchers and cause the value to be regenerated. Computed properties, like other observable object properties, can be watched for changes.


```javascript
import {
    objectCreateComputedProp,
    makeObservable
} from "observables"

const user = {
    firstName: "Paul", 
    lastName: "Tavares" 
};

makeObservable(user);

// Create `fullName` computed property
objectCreateComputedProp(user, "fullName", () => `${ user.firstName } ${ user.lastname }`);

console.log(user.fullName); // Console: Paul Tavares

user.firstName = "Jack";
console.log(user.fullName); // Console: Jack Tavares

```

Computed properties also work with Arrays that have been converted to observables. Here is an example:

```javascript
import {
    objectCreateComputedProp,
    makeObservable
} from "observables"

const user = {
    firstName: "Paul", 
    lastName: "Tavares",
    permissions: [
        "view",
        "create"
    ]
};

makeObservable(user);

objectCreateComputedProp(user, "summary", () => `${ user.firstName } ${ user.lastname } Has ${ user.permissions.size } Permission(s)`);

console.log(user.summary); // Console: "Paul Tavares Has 2 Permission(s)"

user.permissions.push("modify");
console.log(user.summary); // Console: "Paul Tavares Has 3 Permission(s)"

```

## Decorators

The following decorators are available under `src/decorators` (but not in the built module).

>   **NOTE:** Decorators (as of this writing) are at Stage 2 and continue to undergo heavy changes to its spec. The decorators provided here are supported only in Build chains that use `Babel` + ` @babel/plugin-proposal-decorators` plugin with the `legacy` options set to `false`. They are based from a spec version that was valid around the start of 2019 ([this one](https://github.com/tc39/proposal-decorators/blob/master/previous/METAPROGRAMMING.md)) If you are using Typescript, this is likely not to work since the version of Decorators Typescript supports is an erlier spec version. For more about decorators, see https://github.com/tc39/proposal-decorators#faq


### DependencyTracker Class Decorator

Intercept Class methods and setup observable dependency trackers prior to executing the method.

Example:

```javascript
import {makeObservable} from "@purtuga/observables";
import {trackObservableDependencies} from "@purtuga/observables/src/decorators/DependencyTracker.js"

//============================================================

@trackObservableDependencies({
    track: {
        // When `getValue()` method is called, adds `_updateValue` as a change notifier
        // for any observable data that is accessed
        getName() { return this._updateValue; }
    },
    stop: {
        // When `destroy()` is called, it will remove `_updateValue` method from any
        // Observable that has it as a change notifier 
        destroy() {
            return this._updateValue;
        }
    }
})
class Person {
    constructor(data) {
        this._data = makeObservable(data);
    }
    
    _value = "";
    _updateValue = () => this._value = `${this._data.first} ${this._data.last}`;
    
    getName() {
        return this._value;
    }
}

const data = {
    first: "Paul",
    last: "Tavares"
};
const person = new Person(data);

console.log(person.getName()); // Paul Tavares

data.first = "Bill";
data.last = "Smith";

console.log(person.getName()); // Bill Smith

```

This decorator takes the following options:

-   `track`: `{Object}` The methods that will be intercepted. The Object's Key is the method name and its value must be a function that returns the callback that will be used as the dependency tracker notifier. The Function will be called with a context (`this`) of the Class instance and will also be given that class instance as the first argument. NOTE: the returned method should probably (in most cases) be a class bound method since it will be called as if it was a "global" function not a method.  
-   `stop`: `{Object}` The methods that will be intercepted in order to remove all dependency track notification from a tracker notifier. Just like the above options, this object's key value must be a function that will be called with the class instance.



## License

MIT License