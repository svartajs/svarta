import { Adapter, AdapterOptions } from "@svarta/core";
import * as zod from "zod";

import { buildStandaloneServer } from "./build";

const optionsSchema = zod.object({
  defaultPort: zod.number().int().positive(),
  outputFile: zod.string(),
  provider: zod.enum(["tinyhttp"]),
  logger: zod
    .object({
      enabled: zod.boolean(),
    })
    .optional(),
});
export type Options = zod.TypeOf<typeof optionsSchema>;

class StandaloneAdapter implements Adapter<Options> {
  async build({ minify, routeFolder, opts }: AdapterOptions<Options>): Promise<void> {
    return buildStandaloneServer({
      routeFolder,
      minify,
      outputFile: opts.outputFile,
      logger: opts.logger?.enabled ?? true,
      defaultPort: opts.defaultPort,
    });
  }

  validateOptions(opts: unknown): opts is Options {
    const validation = optionsSchema.safeParse(opts);
    if (!validation.success) {
      console.log(validation.error);
      throw new Error("Invalid schema");
    }
    return true;
  }
}

export const adapter = new StandaloneAdapter();
