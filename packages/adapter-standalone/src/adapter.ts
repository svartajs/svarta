import { Adapter, AdapterOptions } from "@svarta/core";
import * as zod from "zod";

import { buildStandaloneServer } from "./build";

const optionsSchema = zod.object({
  outputFile: zod.string(),
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
    });
  }

  validateOptions(opts: unknown): opts is Options {
    return optionsSchema.safeParse(opts).success;
  }
}

export const adapter = new StandaloneAdapter();
