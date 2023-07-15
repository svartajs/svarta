import Cookies from "./cookies";
import Headers from "./headers";
import type { RouteMethod } from "./method";

export default interface HandlerEvent<
  Input,
  Context,
  Params extends Record<string, string> | unknown,
> {
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
  input: Input;

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
