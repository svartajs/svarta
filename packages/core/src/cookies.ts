type CookieKey = string;
type CookieValue = string;

/**
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes
 */
export type SetCookieOptions = {
  /**
   * Defines the host to which the cookie will be sent
   */
  domain: string;

  /**
   * Forbids JavaScript from accessing the cookie
   */
  httpOnly: boolean;

  /**
   * Indicates the maximum lifetime.
   */
  expires: Date;

  /**
   * Indicates the number of seconds until the cookie expires
   *
   * A zero or negative number will expire the cookie immediately
   */
  maxAge: number;

  /**
   * Indicates the path that must exist in the requested URL for the browser to send the Cookie header
   */
  path: string;

  /**
   * Controls whether or not a cookie is sent with cross-site requests
   */
  sameSite: "Strict" | "strict" | "Lax" | "lax" | "None" | "none";

  /**
   * If true, the cookie can only be sent over https
   */
  secure: boolean;
};

export default interface Cookies {
  get(key: CookieKey): CookieValue | null | undefined;
  set(key: CookieKey, value: CookieValue, opts?: Partial<SetCookieOptions>): void;
  entries(): [CookieKey, CookieValue][];
  keys(): CookieKey[];
  values(): CookieValue[];
}
