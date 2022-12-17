import Cookies from "./cookies";
import Headers from "./headers";
import type { RouteMethod } from "./method";

export default interface RouteInput<T, Context> {
  // User provided context
  ctx: Context;

  // TODO: also add basePath

  // Full route path including query
  fullPath: string;

  // HTTP method
  method: RouteMethod;

  // HTTP headers
  headers: Headers;

  // Request body
  input: T;

  // Route params
  params: Record<string, string>;

  // Route query
  query: Record<string, string>;

  // Development flag
  isDev: boolean;

  // Cookies
  cookies: Cookies;
}
