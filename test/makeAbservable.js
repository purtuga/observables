import {makeObservable, objectCreateComputedProp, objectWatchProp} from "../src"
import test from "tape"

//============================================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};

test("makeObservable", t => {
    t.plan(6);

    delay()
        .then(() => {
            // Test with regular objects
            const obj = {
                key1: {
                    key1_1: "1_1",
                    key1_2: {
                        key1_2_1: "1_2_1"
                    }
                }
            };
            const computed = {};
            const changeNotify = getChangeNotify();

            makeObservable(obj);
            objectCreateComputedProp(computed, "value", () => obj.key1.key1_2.key1_2_1);
            objectWatchProp(computed, "value", changeNotify);

            t.equal(computed.value, "1_2_1", "computed returned initial value");

            obj.key1.key1_2.key1_2_1 = "1_2_1__updated";

            t.equal(computed.value, "1_2_1__updated", "computed returned updated value");

            return delay()
                .then(() => {
                    t.equal(changeNotify.count, 1, "computed prop watcher was triggered");
                })
                .catch(console.error);
        })
        .then(() => {
            // Test with arrays and its content
            // Test with regular objects
            const obj = {
                key1: {
                    key1_1: [
                        {
                            key1_1_0: "1_1_0"
                        },
                        "string here"
                    ]
                }
            };
            const computed = {};
            const changeNotify = getChangeNotify();

            makeObservable(obj);
            objectCreateComputedProp(computed, "value", () => obj.key1.key1_1[0].key1_1_0);
            objectWatchProp(computed, "value", changeNotify);

            t.equal(computed.value, "1_1_0", "computed returned initial value");

            obj.key1.key1_1[0].key1_1_0 = "1_1_0__updated";

            t.equal(computed.value, "1_1_0__updated", "computed returned updated value");

            return delay()
                .then(() => {
                    t.equal(changeNotify.count, 1, "computed prop watcher was triggered");
                })
                .catch(console.error);
        })
        .catch(console.error);
});
