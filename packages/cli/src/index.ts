import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { build } from "./commands/build";
import { startDevelopmentServer } from "./commands/dev";
import { loadConfig } from "./config";

const DEFAULT_CONFIG_PATH = "svarta.config.mjs";

yargs(hideBin(process.argv))
  .scriptName("svarta")
  .version("0.0.0")
  /* TODO: init */
  /* TODO: deploy */
  .command(
    "build",
    "Build server",
    (argv) =>
      argv.option({
        config: {
          alias: ["c"],
          type: "string",
          default: DEFAULT_CONFIG_PATH,
          description: "Config file path",
        },
      }),
    async (argv) => {
      console.log(`[@svarta/cli] Starting build\n`);
      const config = await loadConfig(argv.config);
      console.log(`[@svarta/cli] Using adapter ${chalk.blueBright(`"${config.adapter.type}"`)}\n`);
      await build(config);
    },
  )
  .command(
    "dev",
    "Run development server",
    (argv) =>
      argv.option({
        config: {
          alias: ["c"],
          type: "string",
          default: DEFAULT_CONFIG_PATH,
          description: "Config file path",
        },
      }),
    async (argv) => {
      console.log(`[@svarta/cli] Starting development server\n`);
      const config = await loadConfig(argv.config);
      await startDevelopmentServer(config);
    },
  )
  .demandCommand()
  .help().argv;
