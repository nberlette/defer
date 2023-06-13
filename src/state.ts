export type State = "pending" | "rejected" | "fulfilled";

export interface FulfilledResult<T> {
  status: "fulfilled";
  value: T;
}

export interface RejectedResult {
  status: "rejected";
  reason: unknown;
}

interface AnySettledResult<T = unknown> {
  status: "rejected";
  reason?: unknown;
  value: T;
}

export type SettledResult<T> =
  | FulfilledResult<T>
  | RejectedResult
  | AnySettledResult<T>;

export interface StateChangeResult {
  readonly newState: State;
  readonly oldState: State;
}
