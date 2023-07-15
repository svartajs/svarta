import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CollectedRoute } from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";

import { buildTemplate } from "./template";

export async function buildHonoStandaloneServer(
  routes: CollectedRoute[],
  errorHandlers: {
    "400": string;
    "404": string;
    "422": string;
  },
  outputFile: string,
  defaultPort: number,
  minify = true,
  logger = true,
): Promise<string> {
  console.log(
    `[@svarta/adapter-standalone] Building standalone app based on ${chalk.blueBright("Hono")}`,
  );

  const outputModuleFormat = outputFile.endsWith(".mjs") ? "esm" : "cjs";
  const tmpFile = resolve(`.svarta/tmp/app-${randomBytes(4).toString("hex")}.js`);
  writeFileSync(tmpFile, buildTemplate(routes, errorHandlers, defaultPort, logger), "utf-8");

  await esbuild.build({
    minify,
    bundle: true,
    banner: {
      js: "/***** svarta app *****/",
    },
    entryPoints: [tmpFile],
    outfile: outputFile,
    platform: "node",
    format: outputModuleFormat,
    target: "esnext",
  });

  return tmpFile;
}
