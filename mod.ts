import { Defer, defer, Deferred, deferred } from "./src/defer.ts";
export {
  type EventHandlers as DeferEventHandlers,
  type EventHandlersEventMap as DeferEventHandlersEventMap,
  type EventListeners as DeferEventListeners,
  FulfilledEvent as DeferFulfilledEvent,
  RejectedEvent as DeferRejectedEvent,
  SettledEvent as DeferSettledEvent,
  StateChangeEvent as DeferStateChangeEvent,
} from "./src/events.ts";

export { Defer, defer, Deferred, deferred };
export default deferred;
