import type { Adapter, AdapterOptions } from "@svarta/core";
import * as zod from "zod";

import { buildStandaloneServer } from "./build";

const adapterOptionsSchema = zod.object({
  defaultPort: zod.number().int().positive(),
  outputFolder: zod.string(),
  runtime: zod.enum(["node"]), // TODO: deno, bun
  logger: zod
    .object({
      enabled: zod.boolean(),
    })
    .optional(),
});
export type Options = zod.TypeOf<typeof adapterOptionsSchema>;

class StandaloneAdapter implements Adapter<Options, {}> {
  async build({ minify, routeFolder, opts }: AdapterOptions<Options>): Promise<void> {
    await buildStandaloneServer({
      routeFolder,
      minify,
      outputFolder: opts.outputFolder,
      logger: opts.logger?.enabled ?? true,
      defaultPort: opts.defaultPort,
      runtime: opts.runtime,
    });
  }

  validateOptions(opts: unknown): opts is Options {
    const validation = adapterOptionsSchema.safeParse(opts);
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
