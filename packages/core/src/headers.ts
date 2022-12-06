type HeaderKey = string;
type HeaderValue = string;

export default interface Headers {
  get(key: HeaderKey): HeaderValue | null | undefined;
  set(key: HeaderKey, value: HeaderValue): void;
  entries(): [HeaderKey, HeaderValue][];
}
