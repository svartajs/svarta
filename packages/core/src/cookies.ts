type CookieKey = string;
type CookieValue = string;

export type SetCookieOptions = {
  domain: string;
  httpOnly: boolean;
  expires: Date;
  maxAge: number;
  path: string;
  sameSite: "Strict" | "strict" | "Lax" | "lax" | "None" | "none";
  secure: boolean;
};

export default interface Cookies {
  get(key: CookieKey): CookieValue | null | undefined;
  set(key: CookieKey, value: CookieValue, opts?: Partial<SetCookieOptions>): void;
  entries(): [CookieKey, CookieValue][];
  keys(): CookieKey[];
  values(): CookieValue[];
}
