import * as Observables from "../src"
import test from "tape"

test("Observables public exports", t => {
    t.plan(8);

    t.equal(Object.keys(Observables).length, 7, "has expected number of exports");

    [
        "objectWatchProp",
        "makeObservable",
        "setDependencyTracker",
        "stopTrackerNotification",
        "unsetDependencyTracker",
        "objectCreateComputedProp",
        "arrayWatch"
    ].forEach(methodName => t.ok(!!Observables[methodName], `has ${methodName}`));
});

