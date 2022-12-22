import type { BuildOptions } from "./adapter";

export default function (opts: BuildOptions): BuildOptions & { type: "standalone" } {
  return {
    ...opts,
    type: "standalone",
  };
}

export type { BuildOptions };
export { adapter } from "./adapter";
