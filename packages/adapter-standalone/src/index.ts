import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  Adapter,
  AdapterOptions,
  checkRoute,
  collectRouteFiles,
  formatRoutePath,
} from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";
import * as zod from "zod";

import { buildTemplate } from "./template";
import { Timer } from "./timer";

const optionsSchema = zod.object({
  outputFile: zod.string(),
});
type Options = zod.TypeOf<typeof optionsSchema>;

export default function ({ outputFile }: Options) {
  return {
    type: "standalone",
    outputFile,
  };
}

class StandaloneAdapter implements Adapter<Options> {
  async build({ minify, routeFolder, opts }: AdapterOptions<Options>): Promise<void> {
    return buildStandaloneServer({
      routeFolder,
      minify,
      outputFile: opts.outputFile,
    });
  }

  validateOptions(opts: unknown): opts is Options {
    return optionsSchema.safeParse(opts).success;
  }
}

export const adapter = new StandaloneAdapter();

async function buildStandaloneServer({
  routeFolder,
  outputFile,
  minify = false,
}: {
  routeFolder: string;
  outputFile: string;
  minify?: boolean;
}): Promise<void> {
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
  console.error("[@svarta/adapter-standalone] Building app\n");

  const tmpFile = resolve(`.svarta/tmp/app-${randomBytes(4).toString("hex")}.js`);
  writeFileSync(tmpFile, buildTemplate(routes), "utf-8");

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
    target: "es2019",
  });

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

  const appSize = statSync(outputFile).size;
  console.error(
    `\n${"Output ready at"} ${chalk.blueBright(outputFile)} ${chalk.grey(
      `[${(appSize / 1000).toFixed(2)} kB]`,
    )}`,
  );

  console.error(
    `\nDone in ${timer.asSeconds()}s ${chalk.grey(
      `(collect ${collectTimer.asMilli()}ms, build ${buildTimer.asMilli()}ms)`,
    )}`,
  );

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
}
