import { resolve } from "node:path";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { build } from "./commands/build";
import { loadConfig } from "./config";

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
      console.error(`[@svarta/cli] Starting build\n`);
      const config = await loadConfig(argv.config);
      console.error(`[@svarta/cli] Using adapter ${config.adapter.type}\n`);
      await build(config);
    },
  )
  .demandCommand()
  .help().argv;
