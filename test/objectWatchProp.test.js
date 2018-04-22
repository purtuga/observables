import {objectWatchProp} from "../src"
import test from "tape"

//============================================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};

test("objectWatchProp", t => {
    t.plan(9);
    t.ok("function" === typeof objectWatchProp, "exposes a function");

    let obj = { name: "paul", country: "usa" };
    let changeNotify = getChangeNotify();
    let unWatch = objectWatchProp(obj, "name", changeNotify);

    t.ok("function" === typeof unWatch, "objectWatchProp() returns function");
    t.ok("function" === typeof unWatch.destroy, "unwatch() has property 'destroy`");
    t.ok("stopWatchingAll" in changeNotify, "change notify callback has 'stopWatchingAll'");

    obj.name = "paul 1";
    obj.name = "paul 2";
    delay()
        .then(() => {
            t.equal(changeNotify.count, 1, "Change notify was called once");

            unWatch();
            obj.name = "paul";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 1, "Change notify was not invoked");

            obj = { name: "paul", country: "usa" };
            changeNotify = getChangeNotify();
            unWatch = objectWatchProp(obj, null, changeNotify);
            obj.country = "portugal";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 1, "object change notify was called once");

            obj.name = "paul 1";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 2, "object change notify was called again (2)");

            obj.name = "paul";
            obj.country = "usa";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 3, "object change notify was called again (3)");
        })
        .catch(console.error);
});

