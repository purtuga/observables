import {trackObservableDependencies} from "../src/decorators/DependencyTracker.js"
import test from "tape"
import {makeObservable} from "../src/objectWatchProp.js";


const delay = ms => new Promise(resolve => setTimeout(resolve, ms || 2));

test("\n# DependencyTracker Decorator\n#", sub => {

    @trackObservableDependencies({
        track: {
            render: inst => inst.logRender
        },
        stop: {
            destroy: inst => inst.logRender
        }
    })
    class KlassOne {
        data = makeObservable({
            first: "Paul",
            last: "Tavares"
        });

        renderInterceptCount = 0;

        render() {
            return `${this.data.first} ${this.data.last}`;
        }

        logRender = () => this.renderInterceptCount++;

        destroy() {
            return "destroyed!";
        }
    }

    sub.test("Tracks calls to methods executes notifier on data change", t => {
        t.plan(3);

        const kOne = new KlassOne();

        kOne.render();
        t.equal(kOne.render(), "Paul Tavares", "tracked method returns value");

        kOne.data.first = "PAUL";
        delay().then(() => {
            t.equal(kOne.renderInterceptCount, 1, "Notifier called on data change");
        });

        t.equal(kOne.render(), "PAUL Tavares", "returns updated data value");
    });

    sub.test("Stops tracking when stop methods is invoked", t => {
        t.plan(3);

        const kOne = new KlassOne();

        kOne.render(); // get the notifier added to data observables
        kOne.data.first = "PAUL"; // trigger call to notifier

        delay().then(() => {
            t.equal(kOne.renderInterceptCount, 1, "Notifier called on data change");
        });

        const destroyCallReturnValue = kOne.destroy(); // should remove notifier
        kOne.data.first = "Paul";
        delay().then(() => {
            t.equal(kOne.renderInterceptCount, 1, "Notifier not called after stop method executed");
        });

        t.equal(destroyCallReturnValue, "destroyed!", "stop method should return value");
    });
});

