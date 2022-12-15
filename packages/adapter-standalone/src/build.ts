import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import { checkRoute, collectRouteFiles } from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";

import { buildTinyHttpStandaloneServer } from "./backend/tinyhttp/build";
import { printBuildResult } from "./result";
import { Timer } from "./timer";

interface BuildOptions {
  routeFolder: string;
  outputFile: string;
  minify?: boolean;
  logger?: boolean;
}

export async function buildStandaloneServer({
  routeFolder,
  outputFile,
  minify = false,
  logger = true,
}: BuildOptions): Promise<void> {
  const timer = new Timer();

  const outputModuleFormat = outputFile.endsWith(".mjs") ? "esm" : "cjs";

  const collectTimer = new Timer();
  console.error("[@svarta/adapter-standalone] Creating a standalone server\n");
  console.error("[@svarta/adapter-standalone] Collecting routes\n");

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
  mkdirSync(".svarta/tmp", { recursive: true });

  const routes = await collectRouteFiles(routeFolder);

  for (const route of routes) {
    const tmpFile = resolve(`.svarta/tmp/route-${randomBytes(4).toString("hex")}.js`);

    await esbuild.build({
      bundle: true,
      banner: {
        js: "/***** svarta route *****/",
      },
      entryPoints: [route.path],
      outfile: tmpFile,
      platform: "node",
      format: outputModuleFormat,
      target: "es2019",
    });

    try {
      await checkRoute(tmpFile, route.routeSegments);
    } catch (error) {
      const { message } = error as Error;
      console.error(chalk.yellowBright(message));
      process.exit(1);
    }
  }

  collectTimer.stop();

  if (existsSync(outputFile)) {
    unlinkSync(outputFile);
  }

  const buildTimer = new Timer();
  await buildTinyHttpStandaloneServer(routes, outputFile, minify, logger);
  buildTimer.stop();

  timer.stop();

  printBuildResult({ routes, outputFile, timer, collectTimer, buildTimer });

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
}
