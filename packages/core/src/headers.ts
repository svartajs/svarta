type HeaderKey = string;
type HeaderValue = string;

// TODO: keys, forEach, values

export default interface Headers {
  get(key: HeaderKey): HeaderValue | null | undefined;
  set(key: HeaderKey, value: HeaderValue): void;
  entries(): [HeaderKey, HeaderValue][];
}
