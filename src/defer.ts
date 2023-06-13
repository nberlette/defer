// deno-lint-ignore-file ban-types
import type { State } from "./state.ts";
import {
  EventHandlers,
  EventHandlersEventMap,
  EventListeners,
  FulfilledEvent,
  RejectedEvent,
  SettledEvent,
  StateChangeEvent,
} from "./events.ts";

type Resolver<T> = (value: T | PromiseLike<T>) => void;
type Rejecter = (reason?: unknown) => void;
interface Executor<T> {
  (resolve: Resolver<T>, reject: Rejecter): void;
}

type Listeners<T> = {
  [K in keyof EventHandlersEventMap<T>]?: {
    readonly callback: EventListener;
    readonly options?: EventListenerOptions;
  }[];
};

export interface Defer<T>
  extends Promise<T>, EventHandlers<T>, EventListeners<T> {
  readonly state: State;

  resolve(value?: T | PromiseLike<T>): void | T | Promise<T>;

  reject(reason?: unknown): void;

  then<TResult1 extends T = T, TResult2 = never>(
    onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2>;

  then<TResult1 extends T = T, TResult2 = never>(
    onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2>;
}

/**
 * Creates a Promise with `reject` and `resolve` functions placed as methods
 * on the promise object itself. Also adds a `state` property, which will be
 * either `"pending"`, `"settled"` or `"rejected"`. The state property can be
 * "watched" for changes by assigning a function to `onstatechange`
 *
 * @example
 * ```typescript
 * import { Defer } from "./defer.ts";
 *
 * const p = defer<number>();
 * // ...
 * p.resolve(42);
 * ```
 */
export class Defer<T = unknown> extends Promise<T> {
  constructor(executor?: Executor<T>);
  constructor(handlers: EventHandlers<T>);
  constructor(executor: Executor<T>, handlers?: EventHandlers<T>);
  constructor(
    executorOrHandlers: Executor<T> | EventHandlers<T>,
    handlers?: EventHandlers<T>,
  );
  constructor(
    executor: Executor<T> | EventHandlers<T> = (_res, _rej) => {},
    handlers?: EventHandlers<T>,
  ) {
    let resolve!: Resolver<T>;
    let reject!: Rejecter;

    if (executor && typeof executor !== "function") {
      if (typeof executor === "object" && !Array.isArray(executor)) {
        handlers = executor;
      }
      executor = undefined!;
    }

    const exec: Executor<T> = (executor ?? ((res, rej) => {
      resolve = res;
      reject = rej;
    })) as Executor<T>;

    // Credit for this workaround goes to Aleksandras-Novikovas
    // https://gist.github.com/domenic/8ed6048b187ee8f2ec75?permalink_comment_id=3863179#gistcomment-3863179
    super((res, rej) => exec(resolve = res, reject = rej));

    if (resolve && reject) {
      this.#resolve = resolve;
      this.#reject = reject;
    } else if (exec && "resolve" in exec && "reject" in exec) {
      this.#executor = exec;
      this.#resolve = exec.resolve as Resolver<T>;
      this.#reject = exec.reject as Rejecter;
    }

    this.#handlers = handlers ?? {};

    const descriptor = {
      enumerable: false,
      configurable: true,
      writable: false,
    };

    for (const method of ["resolve", "reject"] as const) {
      Object.defineProperty(this, method, {
        ...descriptor,
        enumerable: true,
        value: Object.defineProperty(
          this[method].bind(this),
          "name",
          { value: method },
        ),
      });
    }

    Object.defineProperties(this, {
      state: {
        get: () => this.#state,
        enumerable: true,
        configurable: false,
      },
      listeners: {
        get: () => this.#listeners,
        enumerable: false,
        configurable: false,
      },
      handlers: {
        get: () => this.#handlers,
        enumerable: false,
        configurable: false,
      },
      executor: {
        get: () => this.#executor,
        enumerable: false,
        configurable: false,
      },
    });

    const eventListeners = [
      ["addEventListener", "addListener", "on", "once"],
      ["removeEventListener", "removeListener", "off"],
      ["dispatchEvent", "fire", "emit"],
    ] as const;

    for (const listeners of eventListeners) {
      const [listener] = listeners;

      Object.defineProperties(this, {
        ...(listeners as readonly string[]).reduce((acc, key) => {
          const fn = this.#eventTarget[listener].bind(this.#eventTarget);
          let value: typeof fn = fn;
          if (key === "once") {
            // deno-lint-ignore no-explicit-any
            value = (...args: any[]) => {
              const [type, listener, options = {}] = args;
              fn(type, listener, { ...options, once: true });
            };
          }
          return ({ ...acc, [key]: { ...descriptor, value } });
        }, {} as PropertyDescriptorMap),
      });
    }
  }

  #eventTarget = new EventTarget();
  #executor?: Executor<T>;
  #handlers: EventHandlers<T>;
  #reject!: (reason?: unknown) => void;
  #resolve!: (value: T | PromiseLike<T>) => void;
  #state: State = "pending";
  #reason?: unknown;
  #value?: T | undefined;

  get #listeners(): Listeners<T> {
    // deno-lint-ignore no-explicit-any
    return (this.#eventTarget as any)[
      Object.getOwnPropertySymbols(this.#eventTarget).find((s) =>
        String(s) === "Symbol()"
      )!
    ].listeners;
  }

  public get value(): T | undefined {
    return this.#value ?? undefined;
  }

  public get reason(): unknown {
    return this.#reason;
  }

  public get executor(): Executor<T> | undefined {
    return this.#executor;
  }

  public get handlers(): EventHandlers<T> {
    return this.#handlers;
  }

  public get listeners() {
    return this.#listeners;
  }

  public reject(reason?: unknown) {
    this.#changeState("rejected");

    this.#reject(reason);
    this.#reason = reason;
    this.#value = undefined;

    this.dispatchEvent(new RejectedEvent(reason));
    this.onrejected?.call?.(this as Defer<T>, reason);
    this.#settle(reason);
  }

  public resolve(value?: T | PromiseLike<T>) {
    this.#changeState("fulfilled");

    this.#resolve?.(value!);
    this.#value = value as T;
    this.#reason = undefined;

    this.dispatchEvent(new FulfilledEvent(value!));
    this.onfulfilled?.call?.(this as Defer<T>, value as T);
    this.onresolved?.call?.(this as Defer<T>, value as T);

    this.#settle(value);
  }

  public reset(): Defer<T> {
    const reset = Reflect.construct(
      Defer,
      this.executor ? [this.executor, this.handlers] : [this.handlers],
    ) as Defer<T>;

    // attach all existing event listeners
    for (const [event, listeners] of Object.entries(this.listeners)) {
      for (const { callback, options } of listeners ?? []) {
        if (typeof callback !== "function") continue;
        reset.addEventListener(event, callback, options);
      }
    }

    return reset;
  }

  public override then<TResult1 extends T = T, TResult2 = never>(
    onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected: (reason: unknown) => TResult2 | PromiseLike<TResult2>,
  ): Promise<TResult1 | TResult2>;

  public override then<TResult1 extends T = T, TResult2 = never>(
    onfulfilled: (value: T) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;

  public override then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2>;

  public override then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    const result = super.then(onfulfilled, onrejected);
    return result;
  }

  #noop = () => {};

  public get onfulfilled() {
    return (...args: Parameters<EventHandlers<T>["onfulfilled"] & {}>): void =>
      Reflect.apply(this.handlers?.onfulfilled ?? this.#noop, this, args);
  }

  public set onfulfilled(value) {
    if (typeof value === "function") {
      this.#handlers.onfulfilled = value;
    } else if (value == null) {
      Reflect.deleteProperty(this.#handlers, "onfulfilled");
    } else {
      throw new TypeError(
        `Expected 'onfulfilled' to be a function, got ${typeof value}`,
      );
    }
  }

  public get onrejected() {
    return (...args: Parameters<EventHandlers<T>["onrejected"] & {}>): void =>
      Reflect.apply(this.handlers?.onrejected ?? this.#noop, this, args);
  }

  public set onrejected(value) {
    if (typeof value === "function") {
      this.#handlers.onrejected = value;
    } else if (value == null) {
      Reflect.deleteProperty(this.#handlers, "onrejected");
    } else {
      throw new TypeError(
        `Expected 'onrejected' to be a function, got ${typeof value}`,
      );
    }
  }

  public get onresolved() {
    return (...args: Parameters<EventHandlers<T>["onresolved"] & {}>): void =>
      Reflect.apply(this.handlers?.onresolved ?? this.#noop, this, args);
  }

  public set onresolved(value) {
    if (typeof value === "function") {
      this.#handlers.onresolved = value;
    } else if (value == null) {
      Reflect.deleteProperty(this.#handlers, "onresolved");
    } else {
      throw new TypeError(
        `Expected 'onresolved' to be a function, got ${typeof value}`,
      );
    }
  }

  public get onstatechange() {
    return (
      ...args: Parameters<EventHandlers<T>["onstatechange"] & {}>
    ): void =>
      Reflect.apply(this.handlers?.onstatechange ?? this.#noop, this, args);
  }

  public set onstatechange(value) {
    if (typeof value === "function") {
      this.#handlers.onstatechange = value;
    } else if (value == null) {
      Reflect.deleteProperty(this.#handlers, "onstatechange");
    } else {
      throw new TypeError(
        `Expected 'onstatechange' to be a function, got ${typeof value}`,
      );
    }
  }

  public get onsettled() {
    return (...args: Parameters<EventHandlers<T>["onsettled"] & {}>): void =>
      Reflect.apply(this.handlers?.onsettled ?? this.#noop, this, args);
  }

  public set onsettled(value) {
    if (typeof value === "function") {
      this.#handlers.onsettled = value;
    } else if (value == null) {
      Reflect.deleteProperty(this.#handlers, "onsettled");
    } else {
      throw new TypeError(
        `Expected 'onsettled' to be a function, got ${typeof value}`,
      );
    }
  }

  #changeState<const S extends State>(state: S): asserts this is this & {
    readonly state: S;
  } {
    const previous = this.#state;
    this.#state = state;
    this.dispatchEvent(new StateChangeEvent(this.state, previous));
    this.onstatechange(this.state, previous);
  }

  #settle(valueOrReason: unknown) {
    if (this.state === "fulfilled") {
      this.dispatchEvent(new SettledEvent(valueOrReason, "fulfilled"));
    } else {
      this.dispatchEvent(new SettledEvent(valueOrReason, "rejected"));
    }
    this.onsettled(valueOrReason, this.state);
  }

  /** @internal */
  [Symbol.for("nodejs.util.inspect.custom")](
    depth: number,
    // deno-lint-ignore no-explicit-any
    options: any,
    inspect: (value: unknown, ...args: unknown[]) => string,
  ): string {
    options = {
      showHidden: false,
      ...options,
      depth: (options.depth == null ? depth ?? 3 : options.depth) - 1,
      colors: true,
      compact: 2,
      getters: true,
    };

    const tag = `${this.constructor.name}`;
    const { state, value, reason } = this;

    if (options.depth < 0 || depth < 1) {
      return options.stylize(`[${tag} <${state}>]`, "special");
    }

    return `${tag} ${
      state === "pending"
        ? `{ ${options.stylize(`<${state}>`, "special")} }`
        : (value
          ? `{ ${inspect(value, options)} }`
          : inspect({ reason }, options)).replace(
            /(?<=^{) /,
            options.stylize(` <${state}> `, "special"),
          )
    }`;
  }

  static override all<T>(
    values: Iterable<T | PromiseLike<T>>,
  ): Defer<Awaited<T>[]> {
    return Defer.resolve(Promise.all(values));
  }

  static override allSettled<T>(
    values: Iterable<T | PromiseLike<T>>,
  ): Defer<PromiseSettledResult<Awaited<T>>[]> {
    return Defer.resolve(Promise.allSettled(values));
  }

  static override reject<T = never>(reason?: unknown): Defer<T> {
    const deferred = new Defer<T>();
    return deferred.reject(reason), deferred;
  }

  static override resolve<T>(value?: T | PromiseLike<T>): Defer<T> {
    const deferred = new Defer<T>();
    return deferred.resolve(value), deferred;
  }

  // static get [Symbol.species](): typeof Promise {
  //   return Defer as typeof Promise;
  // }

  static [Symbol.hasInstance](that: unknown): that is Defer {
    return typeof that === "object" && that !== null && (
      that instanceof Defer || (
        that instanceof Promise &&
        "resolve" in that && typeof that.resolve === "function" &&
        "reject" in that && typeof that.reject === "function"
      )
    );
  }
}

/**
 * Factory function for creating a deferred promise without the `new` keyword.
 * Optionally accepts a custom executor function and/or event handlers.
 *
 * @param {EventHandlers<T>} [handlers] - Event handlers to attach to the deferred promise upon creation.
 * @returns {Defer<T>} A new deferred promise.
 */
function defer<T>(handlers?: EventHandlers<T>): Defer<T>;
/**
 * @param {Executor<T>} executor - A function that is passed with the arguments `resolve` and `reject`.
 */
function defer<T>(executor: Executor<T>): Defer<T>;
/**
 * @param {[] | [handlers: EventHandlers<T>] | [executor: Executor<T>, handlers: EventHandlers<T>]} args - Arguments to pass to the deferred promise constructor.
 */
function defer<T>(
  ...args:
    | []
    | [executor: Executor<T>, handlers?: EventHandlers<T>]
    | [handlers: EventHandlers<T>]
): Defer<T>;
function defer<T>(
  // deno-lint-ignore no-explicit-any
  executor?: any,
  handlers?: EventHandlers<T> | undefined,
) {
  return Reflect.construct(Defer, [executor, handlers]);
}

type ID<T> = T;

interface DeferFactory extends ID<typeof Defer> {
  <T>(): Defer<T>;
  <T>(handlers: EventHandlers<T>): Defer<T>;
  <T>(executor: Executor<T>): Defer<T>;
  <T>(executor: Executor<T>, handlers?: EventHandlers<T>): Defer<T>;

  readonly prototype: Defer<unknown>;
}

export const deferred: DeferFactory = defer as DeferFactory;

// deno-lint-ignore no-empty-interface
export interface deferred<T> extends Defer<T> {}

export { Defer as Deferred, deferred as defer };
