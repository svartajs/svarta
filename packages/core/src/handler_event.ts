import Cookies from "./cookies";
import Headers from "./headers";
import type { RouteMethod } from "./method";

export default interface HandlerEvent<T, Context, Params extends Record<string, string> | unknown> {
  /**
   * User provided context
   */
  ctx: Context;

  /**
   * Full route path without query
   */
  path: string;

  /**
   * Full route path including query
   */
  url: string;

  /**
   * HTTP method
   */
  method: RouteMethod;

  /**
   * HTTP headers
   */
  headers: Headers;

  /**
   * Request body
   */
  input: T;

  /**
   * Route params
   */
  params: Params;

  /**
   * Route query
   */
  query: Record<string, string>;

  /**
   * Development flag
   */
  isDev: boolean;

  /**
   * Cookies
   */
  cookies: Cookies;
}

const test = ["a", "b", "c"] as const;

type Params<T extends readonly string[]> = {
  [key in T[number]]: string;
};

type p = Params<typeof test>;
