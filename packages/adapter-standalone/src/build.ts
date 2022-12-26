import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import { collectRouteFiles, loadRoutes } from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";

import { buildTinyHttpStandaloneServer } from "./backend/tinyhttp/build";
import { printBuildResult } from "./result";
import { Timer } from "./timer";

interface BuildOptions {
  routeFolder: string;
  outputFile: string;
  minify?: boolean;
  defaultPort: number;
  logger?: boolean;
}

export async function buildStandaloneServer({
  routeFolder,
  outputFile,
  defaultPort,
  minify = false,
  logger = true,
}: BuildOptions): Promise<void> {
  const timer = new Timer();

  const collectTimer = new Timer();
  console.log("[@svarta/adapter-standalone] Creating a standalone server");
  console.log("[@svarta/adapter-standalone] Collecting routes");

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
  mkdirSync(".svarta/tmp", { recursive: true });

  const routes = await collectRouteFiles(routeFolder);

  collectTimer.stop();

  const checkTimer = new Timer();

  const transformedRoutes = await Promise.all(
    routes.map(async (route) => {
      const jsFile = resolve(`.svarta/tmp/route-${randomBytes(4).toString("hex")}.mjs`);

      await esbuild.build({
        bundle: true,
        banner: {
          js: "/***** svarta route *****/",
        },
        entryPoints: [route.path.replace(windowsSeparator, posixSeperator)],
        outfile: jsFile,
        platform: "node",
        format: "esm",
        target: "es2019",
      });

      return {
        ...route,
        path: jsFile,
      };
    }),
  );

  const checkResult = await loadRoutes(transformedRoutes);

  for (const warning of checkResult.warnings) {
    console.log();
    console.log(chalk.yellowBright(warning.message));
    console.log();
    if (warning.suggestion) {
      console.log(warning.suggestion);
    }
  }

  const [error] = checkResult.errors;
  if (error) {
    console.log();
    console.log(chalk.red(error.message));
    console.log();
    if (error.suggestion) {
      console.log(chalk.redBright(error.suggestion));
    }
    throw new Error(`Build failed: ${error.message}`);
  }

  checkTimer.stop();

  if (existsSync(outputFile)) {
    unlinkSync(outputFile);
  }

  const buildTimer = new Timer();
  await buildTinyHttpStandaloneServer(routes, outputFile, defaultPort, minify, logger);
  buildTimer.stop();

  timer.stop();

  printBuildResult({ routes, outputFile, timer, collectTimer, buildTimer, checkTimer });

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
}
