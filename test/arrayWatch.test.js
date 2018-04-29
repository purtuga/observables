import {arrayWatch} from "../src"
import test from "tape"

//------------------------------------------------------
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};

test("arrayWatch: Mutating methods call watchers", t => {
    t.plan(14);
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let changeNotify = getChangeNotify();
    let unWatch = arrayWatch(arr, changeNotify);

    t.ok(Array.isArray(arr), "isArray after observing");
    t.ok("function" === typeof arrayWatch, "exposes a function");
    t.ok("function" === typeof unWatch, "objectWatchProp() returns unwatch() function");
    t.ok("function" === typeof unWatch.destroy, "unwatch() has property 'destroy`");
    t.ok("stopWatchingAll" in changeNotify, "change notify callback has 'stopWatchingAll'");

    t.equal(arr.size, arr.length, "size property reports correct length");

    delay()
        .then(() => {
            const expectedSize = arr.length - 1;
            arr.pop();
            t.equal(arr.size, expectedSize, "size was reported correctly after mutation");
            return delay().then(() => t.equal(changeNotify.count, 1, "pop() notifies watchers"));
        })
        .then(() => {
            arr.push(10);
            return delay().then(() => t.equal(changeNotify.count, 2, "push() notifies watchers"));
        })
        .then(() => {
            arr.shift();
            return delay().then(() => t.equal(changeNotify.count, 3, "shift() notifies watchers"));
        })
        .then(() => {
            arr.splice(0, 0, 11);
            return delay().then(() => t.equal(changeNotify.count, 4, "splice() notifies watchers"));
        })
        .then(() => {
            arr.unshift(0, 0, 11);
            return delay().then(() => t.equal(changeNotify.count, 5, "unshift() notifies watchers"));
        })
        .then(() => {
            arr.sort();
            return delay().then(() => t.equal(changeNotify.count, 6, "sort() notifies watchers"));
        })
        .then(() => {
            arr.reverse();
            return delay().then(() => t.equal(changeNotify.count, 7, "reverse() notifies watchers"));
        })
        .catch(console.error);
});
