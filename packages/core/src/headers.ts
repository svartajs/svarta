type HeaderKey = string;
type HeaderValue = string;

export default interface Headers {
  get(key: HeaderKey): HeaderValue | null | undefined;
  set(key: HeaderKey, value: HeaderValue | HeaderValue[]): void;
  entries(): [HeaderKey, HeaderValue][];
  keys(): HeaderKey[];
  values(): HeaderValue[];
}
