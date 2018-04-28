import {objectCreateComputedProp, objectWatchProp} from "../src"
import test from "tape"

//============================================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};

test("objectCreateComputedProp", sub => {

    sub.test("\n# objectCreateComputedProp: no watchers\n#", t => {
        t.plan(6);

        const obj = {
            v1: "value 1",
            v2: "value 2"
        };
        const generateValue = () => {
            generateValue.count++;
            return `${obj.v1} - ${obj.v2}`;
        };

        generateValue.count = 0;
        objectWatchProp(obj);

        objectCreateComputedProp(obj, "value", generateValue);

        t.ok(Object.getOwnPropertyNames(obj).indexOf("value") !== -1, "computed prop was created");
        t.equal(generateValue.count, 0, "Computed value generator not yet called");

        t.equal(generateValue.count, 0, "Setting a watcher on computed prop does NOT trigger value generator");
        t.equal(obj.value, "value 1 - value 2", "computed value generator return expected value");
        t.equal(generateValue.count, 1, "Computed value generator was executed once");

        // Trigger changes/notification
        obj.v1 = "value 1.a";

        return delay()
            .then(() => {
                t.equal(generateValue.count, 1, "Update to dependency did NOT trigger value generator (no watchers)");
            })
            .catch(console.error);
    });

    sub.test("\n# objectCreateComputedProp: with watchers\n#", t => {
        t.plan(4);

        const obj = {
            v1: "value 1",
            v2: "value 2"
        };
        const generateValue = () => {
            generateValue.count++;
            return `${obj.v1} - ${obj.v2}`;
        };
        const computedNotify = getChangeNotify();

        generateValue.count = 0;
        objectWatchProp(obj);

        objectCreateComputedProp(obj, "value", generateValue);
        objectWatchProp(obj, "value", computedNotify);

        t.equal(obj.value, "value 1 - value 2", "computed value generator return expected value");

        // Trigger changes/notification
        obj.v1 = "value 1.a";

        t.equal(generateValue.count, 1, "Update computed value is async");

        return delay()
            .then(() => {
                t.equal(generateValue.count, 2, "Update to dependency triggers value generator when watchers exist");
                t.equal(computedNotify.count, 1, "Update to dependency notifies watchers");
            })
            .catch(console.error);
    });
});
