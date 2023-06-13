import type {
  FulfilledResult,
  RejectedResult,
  SettledResult,
  State,
  StateChangeResult,
} from "./state.ts";
import type {
  EventHandlers,
  EventHandlersEventMap,
} from "./event_handlers.d.ts";
import type { EventListeners } from "./event_listeners.d.ts";

export type { EventHandlers, EventHandlersEventMap, EventListeners };

/**
 * Emitted when a Defer Promise instance's state changes.
 *
 * @event statechange
 * @extends CustomEvent
 * @see {@link EventHandlers.onstatechange}
 */
export class StateChangeEvent extends CustomEvent<StateChangeResult> {
  constructor(newState: State, oldState: State) {
    super("statechange", { detail: { newState, oldState } });
  }
}

/**
 * Emitted when a Defer Promise instance is fulfilled.
 *
 * @event settled
 * @extends CustomEvent
 * @see {@link EventHandlers.onfulfilled}
 */
export class FulfilledEvent<T = unknown>
  extends CustomEvent<FulfilledResult<T>> {
  constructor(value: T, status: "fulfilled" = "fulfilled") {
    super("fulfilled", { detail: { value, status } });
  }
}

/**
 * Emitted when a Defer Promise instance is rejected.
 *
 * @event rejected
 * @extends CustomEvent
 * @see {@link EventHandlers.onrejected}
 */
export class RejectedEvent extends CustomEvent<RejectedResult> {
  constructor(reason: unknown, status: "rejected" = "rejected") {
    super("rejected", { detail: { reason, status } });
  }
}

/**
 * Emitted when a Defer Promise instance is settled.
 *
 * @event settled
 * @extends CustomEvent
 * @see {@link EventHandlers.onsettled}
 */
export class SettledEvent<T = unknown> extends CustomEvent<SettledResult<T>> {
  constructor(value: T, status: "fulfilled");
  constructor(reason: unknown, status: "rejected");
  constructor(valueOrRejectionReason: T, status: "fulfilled" | "rejected") {
    const detail = status === "fulfilled"
      ? { status, value: valueOrRejectionReason }
      : { status, reason: valueOrRejectionReason, value: undefined! };
    super("settled", { detail });
  }
}
