import {objectWatchProp} from "../src"
import test from "tape"

//------------------------------------------------------
const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));
const getChangeNotify = () => {function ch(){ch.count++};ch.count = 0;return ch;};


test("arrayWatch()", t => {
    t.ok("function" === typeof objectWatchProp, "exposes a function");

    delay()
        .then(() => t.end()).catch(console.error);
});
