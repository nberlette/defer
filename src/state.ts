export type State = "pending" | "rejected" | "fulfilled";

export interface FulfilledResult<T> {
  status: "fulfilled";
  value: T;
}

export interface RejectedResult {
  status: "rejected";
  reason: unknown;
}

export interface SettledResult<T = unknown> {
  status: "fulfilled" | "rejected";
  reason?: unknown;
  value?: T;
}

export interface StateChangeResult {
  readonly newState: State;
  readonly oldState: State;
}
