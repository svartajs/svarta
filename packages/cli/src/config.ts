import chalk from "chalk";
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

export async function loadConfig(path: string): Promise<Config> {
  console.error(`[@svarta/cli] Loading config ${chalk.yellow(path)}\n`);

  let config = await import(path);
  if (config.default) {
    config = config.default;
  }
  return configSchema.parse(config);
}
