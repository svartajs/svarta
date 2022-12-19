import type { Options } from "./adapter";

export default function (opts: Options): Options & { type: "standalone" } {
  return {
    ...opts,
    type: "standalone",
  };
}

export { adapter } from "./adapter";
