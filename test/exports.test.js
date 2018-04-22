import * as Observables from "../src"
import test from "tape"

test("Observables public exports", t => {
    t.plan(7);

    t.equal(Object.keys(Observables).length, 6, "has expected number of exports");

    [
        "objectWatchProp",
        "objectMakeObservable",
        "setDependencyTracker",
        "stopTrackerNotification",
        "unsetDependencyTracker",
        "objectCreateComputedProp"
    ].forEach(methodName => t.ok(!!Observables[methodName], `has ${methodName}`));
});

