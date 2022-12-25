import { loadConfig, packageManager } from "@svarta/core";
import chalk from "chalk";
import { execSync } from "child_process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { build } from "./commands/build";
import { startDevelopmentServer } from "./commands/dev";

const DEFAULT_CONFIG_PATH = "svarta.config.mjs";

yargs(hideBin(process.argv))
  .scriptName("svarta")
  .version("0.0.3")
  /* TODO: deploy */
  .command(
    "init <path>",
    "Scaffold new project",
    (yargs) =>
      yargs.option("manager", {
        choices: ["npm", "yarn", "pnpm"],
        default: "npm",
      }),
    async (args) => {
      execSync(packageManager.getCreateCommand(args.manager as packageManager.Type, "svarta-app"), {
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
      const configResult = await loadConfig(argv.config);
      if (configResult.state === "success") {
        const config = configResult.data;
        console.log(`[@svarta/cli] Using adapter ${chalk.blueBright(`"${config.adapter.type}"`)}`);
        await build(config);
      } else if (configResult.state === "fs_error") {
        throw new Error(`Error while loading error: ${configResult.type}`);
      } else {
        const [issue] = configResult.error.issues;
        throw new Error(`Error while loading error; ${issue.path.join(".")}: ${issue.message}`);
      }
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
      const configResult = await loadConfig(argv.config);
      if (configResult.state === "success") {
        const config = configResult.data;
        await startDevelopmentServer(config);
      } else if (configResult.state === "fs_error") {
        throw new Error(`Error while loading error: ${configResult.type}`);
      } else {
        const [issue] = configResult.error.issues;
        throw new Error(`Error while loading error; ${issue.path.join(".")}: ${issue.message}`);
      }
    },
  )
  .demandCommand()
  .help().argv;
