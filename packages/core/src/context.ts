import Headers from "./headers";
import type { RouteMethod } from "./method";

export default interface RouteInput<T, Context /*,Q extends Record<string, string>*/> {
  ctx: Context; // User provided context
  fullPath: string;
  method: RouteMethod;
  headers: Headers;
  input: T;
  params: Record<string, string>;
  // query: Q;
}
