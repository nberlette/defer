# 🦖 defer

Building upon the popular design pattern known as a Deferred Promise, `Defer`
exposes `resolve` and `reject` methods on the Promise object itself, affording
you complete control over its resolution logic. It also emits a
[number of events](#listening-to-promise-events) and supports
[custom event handlers](#using-event-handler-methods), for tracking internal
state changes or triggering custom callbacks.


## Features

- Extends the built-in `Promise` class, giving you control over when it is
  resolved or rejected.
- Fires events when the Promise is fulfilled, rejected, settled, and any time
  the internal state changes.
- Retains full support of the native Promise API, including `then`, `catch`, and
  `finally`, `Promise.all` and `Promise.allSettled`.
- Provide event handlers as constructor options to initialize the Promise with
  the handlers already attached.
- Provide a custom executor function to initialize the Promise with custom
  resolution logic.

## Quick Start

```ts
import { Defer } from "https://deno.land/x/defer/mod.ts";

const deferred = new Defer<string>(); // => Deferred { <pending> }
deferred.resolve("Hello!"); // => Deferred { <fulfilled> "Hello!" }
```


### `Defer` constructor signature

```ts
new Defer<T>();
new Defer<T>(handlers: DeferEventHandlers<T>);
new Defer<T>(executor: DeferExecutor<T>, handlers?: DeferEventHandlers<T>);
```

> **Note**: see the sections on [**_using event handler methods_**](#using-event-handler-methods) and [**_listening to promise events_**](#listening-to-promise-events) for more details on Defer's event-driven API.

### `defer` factory function

If you'd like a callable alternative to using the `new` keyword, you can import
and use the `defer` factory function instead. It has the same signature as the
`Defer` constructor, and returns a new instance of `Defer`.

```ts
import { defer } from "https://deno.land/x/defer/mod.ts";

const deferred = defer<number>(); // => Deferred { <pending> }
deferred.resolve(42); // => Deferred { <fulfilled> 42 }
```

## Usage and Examples

Creating a <b><em>Defer</em></b>red Promise using the `Defer` class is very 
straightforward; it follows the same design pattern made popular by its many 
predecessors. It provides the `resolve` and `reject` methods as properties of 
the Promise object itself.

Testing a simple deferred resolution:

```ts
const d1 = new Defer<number>(); // suspended in "pending" state
d1.state === "pending"; // => true

d1.resolve(42);

d1.state === "fulfilled"; // => true
d1.value === 42; // => true
d1; // => Deferred { <fulfilled> 42 }
```

Testing a simple deferred rejection:

```ts
const d2 = new Defer<string>();

d2.reject(new Error("Something went wrong"));

d2.state === "rejected"; // => true
d2.reason === "Something went wrong"; // => true

d2; // => Deferred { <rejected> reason: "Something went wrong" }
```

### Listening to Promise Events

Currently, the events that are emitted are `"fulfilled"`, `"rejected"`,
`"settled"`, `"statechange"`, and `"resolved"` (an alias for fulfilled).

You can listen for any of the events using the standard `addEventListener` API.
For your convenience, the methods `addListener` / `on` are aliased to
`addEventListener`, and `removeListener` / `off` are aliased to
`removeEventListener`.

```ts
const listener = ({ detail }) => {
  console.log(detail.oldState, "->", detail.newState);
};

d.addEventListener("statechange", listener); // long-hand
d.addListener("statechange", listener); // short-hand
d.on("statechange", listener); // shortest-hand
```

To remove an existing listener:

```ts
// you **must** retain a reference to the original listener
d.removeEventListener("statechange", listener); // long-hand
d.removeListener("statechange", listener); // short-hand
d.off("statechange", listener); // shortest-hand
```

#### Debugging: observing all attached listeners

```ts
const d = new Defer();

d.on("statechange", console.log);
d.on("fulfilled", console.log);
d.on("rejected", console.error);

// get an array of all attached listeners
d.listeners; // => { fulfilled: [ { callback: [Function log] } ], ... }
```

> **Note**: this special property is **non-standard**, and only available in
> Deno environments. It will not be available in runtimes that use any other
> EventTarget API, such as browsers or Node.js.

### Using Event Handler Methods

You can initialize a new instance with the event handlers already attached:

```ts
const d = new Defer<{ code: number; text: string }>({
  onfulfilled: (value) => console.debug("✅", value),
  onrejected: (reason) => console.error("⚠️", reason),
});
```

You can also assign event handler methods on the Defer instance itself, which
will be called when the corresponding event is emitted:

```ts
d.onrejected = (reason) => {
  console.error("Promise rejected:", reason);
};

// handler method names must be all lowercase 
d.onsettled = function (value, state) => {
  console.log({ value, state });
  console.log("With `this`": this.value, this.state);
};
```

### Chaining Promise Methods

Defer extends the built-in `Promise` class, so you can still use all the methods
provided by the Promise class, such as `then`, `catch`, and `finally`, to chain
asynchronous operations.

```ts
const deferred = new Defer<number>();

deferred
  .then((value) => {
    console.log("Promise resolved:", value);
    return value * 2;
  })
  .then((result) => {
    console.log("Result:", result);
  })
  .catch((error) => {
    console.error("Promise rejected:", error);
  });

deferred.resolve(21);
// => Promise resolved: 21
// => Result: 42
```

## API Reference

For a complete API reference, including detailed information on events, event
handlers, and constructor overloads, please refer to the
[API Documentation](https://deno.land/x/defer/mod.ts?doc).

## Contributing

Contributions are welcome! If you have any bug reports, feature requests, or
suggestions, please open an issue on the
[GitHub repository](https://github.com/nberlette/defer). If you want to
contribute code, feel free to open a pull request.

---

<div align="center">

[**MIT**][MIT] © [**Nicholas Berlette**][nberlette]. All rights reserved.

</div>

[MIT]: https://nick.mit-license.org "MIT (c) 2023 Nicholas Berlette. All rights reserved."
[nberlette]: https://github.com/nberlette "Nicholas Berlette's GitHub profile"
