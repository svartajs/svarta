import { Adapter, AdapterOptions } from "@svarta/core";
import * as zod from "zod";

import { buildStandaloneServer } from "./build";

const buildOptionsSchema = zod.object({
  defaultPort: zod.number().int().positive(),
  outputFile: zod.string(),
  provider: zod.enum(["tinyhttp"]),
  logger: zod
    .object({
      enabled: zod.boolean(),
    })
    .optional(),
});
export type BuildOptions = zod.TypeOf<typeof buildOptionsSchema>;

class StandaloneAdapter implements Adapter<BuildOptions, {}> {
  async build({ minify, routeFolder, opts }: AdapterOptions<BuildOptions>): Promise<void> {
    return buildStandaloneServer({
      routeFolder,
      minify,
      outputFile: opts.outputFile,
      logger: opts.logger?.enabled ?? true,
      defaultPort: opts.defaultPort,
    });
  }

  validateOptions(opts: unknown): opts is BuildOptions {
    const validation = buildOptionsSchema.safeParse(opts);
    if (!validation.success) {
      console.log(validation.error);
      throw new Error("Invalid schema");
    }
    return true;
  }

  async deploy(_: {}): Promise<void> {
    console.log("Nothing to do");
  }
}

export const adapter = new StandaloneAdapter();
