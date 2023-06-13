import type { Defer } from "./defer.ts";
import type { EventHandlersEventMap } from "./event_handlers.d.ts";

export interface EventListeners<T = unknown> {
  addEventListener<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;

  dispatchEvent<K extends keyof EventHandlersEventMap<T>>(
    event: EventHandlersEventMap<T>[K],
  ): boolean;
  dispatchEvent(event: Event): boolean;

  addListener<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeListener<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  removeListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;

  fire<K extends keyof EventHandlersEventMap<T>>(
    event: EventHandlersEventMap<T>[K],
  ): boolean;
  fire(event: Event): boolean;

  on<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  on(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  off<K extends keyof EventHandlersEventMap<T>>(
    type: K,
    listener: (this: Defer<T>, ev: EventHandlersEventMap<T>[K]) => void,
    options?: boolean | EventListenerOptions,
  ): void;
  off(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;

  emit<K extends keyof EventHandlersEventMap<T>>(
    event: EventHandlersEventMap<T>[K],
  ): boolean;
  emit(event: Event): boolean;
}
