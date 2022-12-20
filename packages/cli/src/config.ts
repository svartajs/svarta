import { resolve } from "node:path";

import { Config, configSchema } from "@svarta/core";
import chalk from "chalk";

// TODO: move into CORE, don't throw, but result

export async function loadConfig(path: string): Promise<Config> {
  console.log(`[@svarta/cli] Loading config ${chalk.yellow(path)}`);

  let config = await import(resolve(path));
  if (config.default) {
    config = config.default;
  }
  const parseResult = configSchema.safeParse(config);
  if (!parseResult.success) {
    throw parseResult.error;
  }

  // TODO: check if routesFolder exists and is dir

  return config;
}
