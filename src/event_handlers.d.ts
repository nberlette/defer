import type {
  FulfilledEvent,
  RejectedEvent,
  SettledEvent,
  StateChangeEvent,
} from "./events.ts";
import type { Defer } from "./defer.ts";
import type { State } from "./state.ts";

export interface EventHandlers<T = unknown> {
  /**
   * Emitted when a Defer Promise instance is fulfilled, meaning it has
   * fully resolved to a value without encountering an error. At the time of
   * emission, the Promise's state will be `"fulfilled"`.
   *
   * @see {@link DeferFulfilledEvent}
   */
  onfulfilled?: (this: Defer<T>, value: T) => void;

  /**
   * Emitted when a Defer Promise instance is rejected, meaning it has
   * encountered an error. At the time of emission, the Promise's state will
   * be `"rejected"`.
   *
   * @see {@link DeferRejectedEvent}
   */
  onrejected?: (this: Defer<T>, reason: unknown) => void;

  /**
   * Emitted when a Defer Promise instance is settled, meaning it has been
   * either fulfilled or rejected. At the time of emission, the Promise's state
   * will be either `"fulfilled"` or `"rejected"`, indicating their outcome.
   *
   * **Note**: This is fired **after** any `"fulfilled"` or `"rejected"` events.
   * @see {@link DeferSettledEvent}
   */
  onsettled?: {
    (this: Defer<T>, value: T, status: "fulfilled"): void;
    (this: Defer<T>, reason: unknown, status: "rejected"): void;
    (this: Defer<T>, valueOrRejectedReason: unknown, status: State): void;
  };

  /**
   * Emitted whenever a Defer Promise's state changes to a new value. This
   * event is fired **before** any `"fulfilled"` or `"rejected"` events, and
   * **before** the Promise is actually completely settled.
   *
   * @see {@link DeferStateChangeEvent}
   */
  onstatechange?: (this: Defer<T>, newState: State, oldState: State) => void;

  /** @see {@link DeferResolvedEvent} */
  onresolved?: (this: Defer<T>, value: T) => void;
}

export interface EventHandlersEventMap<T = unknown> {
  /**
   * Emitted when a Defer Promise instance is fulfilled, meaning it has
   * fully resolved to a value without encountering an error. At the time of
   * emission, the Promise's state will be `"fulfilled"`.
   */
  "fulfilled": FulfilledEvent<T>;
  /**
   * Alias for {@link settled|the 'fulfilled' event}
   */
  "resolved": FulfilledEvent<T>;
  /**
   * Emitted when a Defer Promise instance is rejected, meaning it has
   * encountered an error. At the time of emission, the Promise's state will
   * be `"rejected"`.
   */
  "rejected": RejectedEvent;
  /**
   * Emitted when a Defer Promise instance is settled, meaning it has been
   * either fulfilled or rejected. At the time of emission, the Promise's state
   * will be either `"fulfilled"` or `"rejected"`, indicating their outcome.
   *
   * **Note**: This is fired **after** any `"fulfilled"` or `"rejected"` events.
   */
  "settled": SettledEvent<T>;
  /**
   * Emitted whenever a Defer Promise's state changes to a new value. This
   * event is fired **before** any `"fulfilled"` or `"rejected"` events, and
   * **before** the Promise is actually completely settled.
   */
  "statechange": StateChangeEvent;
}
