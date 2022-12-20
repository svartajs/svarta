import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { build } from "./commands/build";
import { startDevelopmentServer } from "./commands/dev";
import { loadConfig } from "./config";

const DEFAULT_CONFIG_PATH = "svarta.config.mjs";

const createCommands: Record<string, (client: string) => string> = {
  npm: (cmd) => `npm create ${cmd}`,
  yarn: (cmd) => `yarn create ${cmd}`,
  pnpm: (cmd) => `pnpm create ${cmd}`,
};

yargs(hideBin(process.argv))
  .scriptName("svarta")
  .version("0.0.0")
  /* TODO: deploy */
  .command(
    "init <path>",
    "Scaffold new project",
    (yargs) =>
      yargs.positional("path", { type: "string" }).option("manager", {
        choices: ["npm", "yarn", "pnpm"],
        default: "npm",
      }),
    async (args) => {
      execSync(createCommands[args.manager]("svarta-app"), {
        stdio: "inherit",
      });
    },
  )
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
      console.log(`[@svarta/cli] Starting build`);
      const config = await loadConfig(argv.config);
      console.log(`[@svarta/cli] Using adapter ${chalk.blueBright(`"${config.adapter.type}"`)}`);
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
      console.log(`[@svarta/cli] Starting development server`);
      const config = await loadConfig(argv.config);
      await startDevelopmentServer(config);
    },
  )
  .demandCommand()
  .help().argv;
