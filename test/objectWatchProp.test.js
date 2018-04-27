import {objectWatchProp} from "../src"
import test from "tape"

//============================================================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};

test("objectWatchProp: prop watchers", t => {
    t.plan(13);
    t.ok("function" === typeof objectWatchProp, "exposes a function");

    let obj = { name: "paul", country: "usa" };
    let changeNotify = getChangeNotify();
    let unWatch = objectWatchProp(obj, "name", changeNotify);

    t.ok("function" === typeof unWatch, "objectWatchProp() returns unwatch() function");
    t.ok("function" === typeof unWatch.destroy, "unwatch() has property 'destroy`");
    t.ok("stopWatchingAll" in changeNotify, "change notify callback has 'stopWatchingAll'");

    obj.name = "paul 1";
    obj.name = "paul 2";
    delay()
        .then(() => {
            t.equal(changeNotify.count, 1, "watcher was called once");

            unWatch();
            obj.name = "paul";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 1, "watcher was not invoked after unwatch");

            obj = { name: "paul", country: "usa" };
            changeNotify = getChangeNotify();
            unWatch = objectWatchProp(obj, null, changeNotify);

            t.ok("function" === typeof unWatch, "objectWatchProp() returns unwatch() function");
            t.ok("function" === typeof unWatch.destroy, "unwatch() has property 'destroy`");
            t.ok("stopWatchingAll" in changeNotify, "change notify callback has 'stopWatchingAll'");

            obj.country = "portugal";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 1, "object watcher was called once");

            obj.name = "paul 1";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 2, "object watcher was called again (2)");

            obj.name = "paul";
            obj.country = "usa";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 3, "object watcher was called again (3)");

            unWatch.destroy();
            obj.name = "paul 2";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 3, "object watcher was NOT invoked after unwatch.destroy()");
        })
        .catch(console.error);
});

test("objectWatchProp: watcher.stopWatchingAll()", t => {
    let obj = { name: "paul", country: "usa" };
    let changeNotify = getChangeNotify();
    objectWatchProp(obj, "name", changeNotify);
    objectWatchProp(obj, "country", changeNotify);
    obj.name = "paul 1";
    delay()
        .then(() => {
            t.equal(changeNotify.count, 1, "watcher was called for name");

            obj.country = "usa 1";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 2, "watcher was called for country");

            changeNotify.stopWatchingAll();
            obj.name = "paul";
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 2, "watcher NOT called for name after stopWatchingAll()");

            obj.country = "usa";
            return delay()
        })
        .then(() => {
            t.equal(changeNotify.count, 2, "watcher NOT called for country after stopWatchingAll()");
        })
        .then(() => t.end()).catch(console.error);
});

test("objectWatchProp: object watcher", t => {
    let obj = { name: "paul" };
    let changeNotify = getChangeNotify();
    objectWatchProp(obj, null, changeNotify);
    objectWatchProp(obj, "name");

    delay()
        .then(() => {
            t.equal(changeNotify.count, 0, "watcher not called for existing props");

            objectWatchProp(obj, "country");
            return delay();
        })
        .then(() => {
            t.equal(changeNotify.count, 1, "watcher called when new prop was observed");
        })
        .then(() => t.end()).catch(console.error);
});
