import { existsSync, statSync } from "node:fs";
import { parse, resolve } from "node:path";

import * as zod from "zod";
import { ZodError } from "zod";

export const configSchema = zod.object({
  packageManager: zod.enum(["npm", "yarn", "pnpm"]),
  adapter: zod.object({
    type: zod.string(),
  }),
  routeFolder: zod.string(),
  minify: zod.boolean().optional(),
});

export type Config = zod.TypeOf<typeof configSchema>;

type Result =
  | {
      state: "success";
      data: Config;
    }
  | {
      state: "validation_error";
      error: ZodError;
    }
  | {
      state: "fs_error";
      type: "missing_file" | "is_directory";
    };

export async function loadConfig(path: string): Promise<Result> {
  console.log(`[@svarta/core] Loading config at ${path}`);

  if (!existsSync(path)) {
    return {
      state: "fs_error",
      type: "missing_file",
    };
  }

  if (statSync(path).isDirectory()) {
    return {
      state: "fs_error",
      type: "is_directory",
    };
  }

  let config = await import(resolve(path));
  if (config.default) {
    config = config.default;
  }

  const result = configSchema.safeParse(config);
  if (!result.success) {
    return {
      state: "validation_error",
      error: result.error,
    };
  }

  return {
    state: "success",
    data: config,
  };
}
