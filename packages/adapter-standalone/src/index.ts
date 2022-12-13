import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { checkRoute, collectRouteFiles, formatRoutePath } from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";

import { buildTemplate } from "./template";
import { Timer } from "./timer";

const routeFolder = resolve("./demo/routes");
const output = resolve("../../server.mjs");

export async function buildStandaloneServer(
  folder: string,
  output: string,
  minify = false,
): Promise<void> {
  const timer = new Timer();

  const collectTimer = new Timer();

  console.error("Creating a standalone server\n");

  console.error("Collecting routes\n");

  const routes = await collectRouteFiles(folder);

  for (const { path, routeSegments } of routes) {
    try {
      await checkRoute(path, routeSegments);
    } catch (error) {
      const { message } = error as Error;
      console.error(chalk.yellowBright(message));
      process.exit(1);
    }
  }

  collectTimer.stop();

  const transformTimer = new Timer();

  const outputModuleFormat = output.endsWith(".mjs") ? "esm" : "cjs";
  if (existsSync(output)) {
    unlinkSync(output);
  }

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
  mkdirSync(".svarta/tmp", { recursive: true });

  console.error("Transforming routes\n");

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

    route.path = tmpFile; // TODO:
  }

  transformTimer.stop();

  const buildTimer = new Timer();

  const tmpFile = resolve(`.svarta/tmp/app-${randomBytes(4).toString("hex")}.js`);
  console.error(`Building app\n`);
  writeFileSync(tmpFile, buildTemplate(routes), "utf-8");

  await esbuild.build({
    minify,
    bundle: true,
    banner: {
      js: "/***** svarta app *****/",
    },
    entryPoints: [tmpFile],
    outfile: output,
    platform: "node",
    format: outputModuleFormat,
    target: "es2019",
  });

  /* if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  } */

  buildTimer.stop();

  timer.stop();

  const longestRoutePath = Math.max(
    ...routes.map(({ routeSegments }) => formatRoutePath(routeSegments).length),
  );
  const longestRouteMethod = Math.max(...routes.map(({ method }) => method.length));

  console.error("Routes");

  for (const route of routes) {
    const routeSize = statSync(route.path).size;
    const routePath = formatRoutePath(route.routeSegments);

    console.error(
      `${chalk.grey("├")} ${chalk.yellow(route.method)}${" ".repeat(
        longestRouteMethod - route.method.length + 1,
      )}${chalk.blueBright(routePath)}${" ".repeat(
        longestRoutePath - routePath.length + 1,
      )}${chalk.grey(`[${(routeSize / 1000).toFixed(2)} kB]`)}`,
    );
  }

  const appSize = statSync(output).size;
  console.error(
    `\n${"Output ready at"} ${chalk.blueBright(output)} ${chalk.grey(
      `[${(appSize / 1000).toFixed(2)} kB]`,
    )}`,
  );

  console.error(
    `\nDone in ${timer.asSeconds()}s ${chalk.grey(
      `(collect ${collectTimer.asMilli()}ms, transform ${transformTimer.asMilli()}ms, build ${buildTimer.asMilli()}ms)`,
    )}`,
  );
}

buildStandaloneServer(routeFolder, output, true).then(() => process.exit(0));
