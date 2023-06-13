// deno-lint-ignore-file require-await
import {
  Defer,
  defer,
  DeferFulfilledEvent,
  DeferRejectedEvent,
  DeferSettledEvent,
  DeferStateChangeEvent,
} from "../mod.ts";
import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.191.0/testing/asserts.ts";

Deno.test("resolves with the correct value", async () => {
  const deferred = new Defer<number>();

  deferred.resolve(42);

  const result = await deferred;

  assertEquals(result, 42);
});

Deno.test("resolves with the value before being settled", () => {
  const deferred = new Defer<number>();

  deferred.resolve(42);

  assertEquals(deferred.value, 42);
});

Deno.test("resolves with the correct value when using Defer.resolve with a promise-like value", async () => {
  const promiseLike = {
    then: (
      onfulfilled: (<T>(value: T) => T | PromiseLike<T>) | null | undefined,
    ) => {
      return onfulfilled?.(42);
    },
  };

  const deferred = Defer.resolve(promiseLike);

  const result = await deferred;

  assertEquals(result, 42);
});

Deno.test("resolves with the correct value when using the onfulfilled handler", async () => {
  const deferred = new Defer<number>();

  const result = await new Promise<number>((resolve) => {
    deferred.onfulfilled = resolve;
    deferred.resolve(42);
  });

  assertEquals(result, 42);
});

Deno.test("emits a statechange event when the state changes", () => {
  const deferred = new Defer<number>();
  const events: DeferStateChangeEvent[] = [];

  deferred.addEventListener("statechange", (event) => {
    events.push(event);
  });

  deferred.resolve(42);

  assertEquals(events.length, 1);
  assertEquals(events[0].detail.newState, "fulfilled");
  assertEquals(events[0].detail.oldState, "pending");
});

Deno.test("emits a fulfilled event when it is fulfilled", () => {
  const deferred = new Defer<number>();
  const events: DeferFulfilledEvent<number>[] = [];

  deferred.addEventListener("fulfilled", (event) => {
    events.push(event);
  });

  deferred.resolve(42);

  assertEquals(events.length, 1);
  assertEquals(events[0].detail.status, "fulfilled");
  assertEquals(events[0].detail.value, 42);
});

Deno.test("emits a rejected event when it is rejected", () => {
  const deferred = new Defer<number>();
  const events: DeferRejectedEvent[] = [];

  deferred.addEventListener("rejected", (event) => {
    events.push(event);
  });

  deferred.catch((reason) => {
    assertEquals(reason.message ?? reason, "Something went wrong");
  });

  deferred.reject(new Error("Something went wrong"));

  assertEquals(events.length, 1);
});

Deno.test("emits a settled event when it is settled", () => {
  const deferred = new Defer<number>();
  const events: DeferSettledEvent<number>[] = [];

  deferred.addEventListener("settled", (event) => {
    events.push(event);
  });

  deferred.resolve(42);

  assertEquals(events.length, 1);
  assertEquals(events[0].detail.status, "fulfilled");
  assertEquals(events[0].detail.value, 42);
});

Deno.test("emits events in the correct order", async () => {
  const deferred = new Defer<number>();
  const events: string[] = [];

  deferred.onfulfilled = () => {
    events.push("onfulfilled");
  };

  deferred.onrejected = () => {
    events.push("onrejected");
  };

  deferred.onsettled = () => {
    events.push("onsettled");
  };

  deferred.resolve(42);
  await deferred.then(() => {
    assertEquals(events.length, 2);
    assertEquals(events, ["onfulfilled", "onsettled"]);
  });
});

Deno.test("Defer.resolve", async () => {
  const deferred = defer<number>();
  deferred.resolve(42);
  const result = await deferred;
  assertEquals(result, 42);
});

Deno.test("Defer.reject", async () => {
  const deferred = defer<number>();
  deferred.catch((
    reason,
  ) => (reason instanceof Error ? reason.message : reason));

  assertThrows(
    () => {
      deferred.reject("Error");
      throw new Error(deferred.reason as string);
    },
    Error,
    "Error",
  );
});

Deno.test("Defer.state", () => {
  const deferred = defer<number>();
  assertEquals(deferred.state, "pending");
  deferred.resolve(42);
  assertEquals(deferred.state, "fulfilled");
});

Deno.test("DeferFulfilledHandler", async () => {
  const deferred = defer<number>({
    onfulfilled: (value) => {
      assertEquals(value, 42);
    },
  });
  deferred.resolve(42);
  await deferred;
});

Deno.test("DeferSettledHandler", async () => {
  const deferred = defer<number>({
    onsettled: (value, status) => {
      assertEquals(value, 42);
      assertEquals(status, "fulfilled");
    },
  });
  deferred.resolve(42);
  await deferred;
});

Deno.test("DeferStateChangeHandler", () => {
  const deferred = defer<number>({
    onstatechange: (newState, oldState) => {
      assertEquals(newState, "fulfilled");
      assertEquals(oldState, "pending");
    },
  });
  deferred.resolve(42);
});

Deno.test("Defer.then", async () => {
  const deferred = defer<number>();
  const result = deferred.then((value) => {
    assertEquals(value, 42);
    return "Success";
  });
  deferred.resolve(42);
  const finalResult = await result;
  assertEquals(finalResult, "Success");
});
