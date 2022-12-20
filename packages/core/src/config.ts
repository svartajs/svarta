import * as zod from "zod";

export const configSchema = zod.object({
  packageManager: zod.enum(["npm", "yarn", "pnpm"]),
  adapter: zod.object({
    type: zod.string(),
  }),
  routeFolder: zod.string(),
  minify: zod.boolean().optional(),
});

export type Config = zod.TypeOf<typeof configSchema>;
