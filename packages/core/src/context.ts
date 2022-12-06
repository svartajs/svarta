import type { RouteMethod } from "./method";

export default interface Context<T, Q extends Record<string, string>> {
  fullPath: string;
  method: RouteMethod;
  headers: Headers;
  input: T;
  params: Record<string, string>;
  query: Q;
}
