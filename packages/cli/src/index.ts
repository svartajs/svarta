import { resolve } from "node:path";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as zod from "zod";

const standaloneSchema = zod.object({
  type: zod.string().refine((x) => x === "standalone"),
  outputFile: zod.string(),
});

const configSchema = zod.object({
  adapter: standaloneSchema,
  routeFolder: zod.string(),
  minify: zod.boolean().optional(),
});

export type Config = zod.TypeOf<typeof configSchema>;

async function loadConfig(path: string): Promise<Config> {
  let config = await import(path);
  if (config.default) {
    config = config.default;
  }
  return configSchema.parse(config);
}

yargs(hideBin(process.argv))
  .scriptName("svarta")
  .version("0.0.0")
  .command(
    "build",
    "Build server",
    (argv) =>
      argv.option({
        config: {
          alias: ["c"],
          type: "string",
          default: resolve("./svarta.config.js"),
        },
      }),
    async (argv) => {
      const config = await loadConfig(argv.config);
      console.log("build", config);

      if (config.adapter.type === "standalone") {
        const standaloneAdapter = await import("@svarta/adapter-standalone");
        standaloneAdapter.buildStandaloneServer(
          config.routeFolder,
          config.adapter.outputFile,
          config.minify,
        );
      } else {
        console.error("Unsupported adapter", config.adapter.type);
        process.exit(1);
      }
    },
  )
  .help().argv;
