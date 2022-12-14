import { Config, configSchema } from "@svarta/core";
import chalk from "chalk";

export async function loadConfig(path: string): Promise<Config> {
  console.error(`[@svarta/cli] Loading config ${chalk.yellow(path)}\n`);

  let config = await import(path);
  if (config.default) {
    config = config.default;
  }
  const parseResult = configSchema.safeParse(config);
  if (!parseResult.success) {
    throw parseResult.error;
  }
  return config;
}
