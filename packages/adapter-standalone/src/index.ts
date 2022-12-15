import type { Options } from "./adapter";

export default function ({ outputFile }: Options) {
  return {
    type: "standalone",
    outputFile,
  };
}

export { adapter } from "./adapter";
