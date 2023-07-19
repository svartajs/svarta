import type { HandlerEvent } from "@svarta/core";

export const DEFAULTS = {
  origin: "*",
  methods: "*",
  allowHeaders: "*",
  exposeHeaders: "*",
};

export function cors() {
  return ({ headers }: HandlerEvent<unknown, unknown, unknown>) => {
    headers.set("Access-Control-Allow-Origin", DEFAULTS.origin);
    headers.set("Access-Control-Allow-Methods", DEFAULTS.methods);
    headers.set("Access-Control-Allow-Allow-Headers", DEFAULTS.allowHeaders);
    headers.set("Access-Control-Allow-Expose-Headers", DEFAULTS.exposeHeaders);
  };
}
