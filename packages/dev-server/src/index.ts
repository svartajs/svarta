import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { collectRouteFiles, formatRoutePath, loadRoute } from "@svarta/core";
import chalk from "chalk";
import chokidar from "chokidar";
import esbuild from "esbuild";
import debounce from "lodash.debounce";
import { build, createDevServer, prepare } from "nitropack";

import createNitro from "./nitro";
import { buildTemplate } from "./template";

async function nitrofyRoutes(routesFolder: string): Promise<void> {
  const routes = await collectRouteFiles(routesFolder);
  console.log(`[@svarta/dev-server] Loading ${routes.length} routes`);

  for (const route of routes) {
    console.log("-----");
    console.log(chalk.bgBlack(route.path));
    const jsFile = resolve(`.svarta/tmp/route-${randomBytes(4).toString("hex")}.mjs`);

    await esbuild.build({
      bundle: true,
      banner: {
        js: "/***** svarta route *****/",
      },
      entryPoints: [route.path],
      outfile: jsFile,
      platform: "node",
      format: "esm",
      target: "es2019",
    });

    const checkResult = await loadRoute({
      ...route,
      path: jsFile,
    });

    for (const warning of checkResult.warnings) {
      console.log(chalk.yellowBright(warning.message));
      console.log();
      if (warning.suggestion) {
        console.log(warning.suggestion);
      }
    }

    const [error] = checkResult.errors;
    if (error) {
      console.log(chalk.yellowBright(error.message));
      console.log();
      if (error.suggestion) {
        console.log(chalk.yellowBright(error.suggestion));
      }
      unlinkSync(jsFile);
    }

    const tmpFile = resolve(
      `.svarta/dev/nitro/routes${route.routeSegments.reduce((path, seg) => {
        if (seg.type === "sep") {
          return path + "/";
        }
        if (seg.type === "static") {
          return path + seg.value;
        }
        if (seg.type === "param") {
          return path + `[${seg.name}]`;
        }
        return path;
      }, "")}`,
      `index.${route.method.toLowerCase()}.ts`,
    );

    mkdirSync(dirname(tmpFile), { recursive: true });
    writeFileSync(tmpFile, buildTemplate(route), "utf-8");
  }
}

export async function startSvartaDevServer(routesFolder: string) {
  process.env["NODE_ENV"] = "development";

  console.log(`[@svarta/dev-server] Starting dev server for ${routesFolder}`);

  if (existsSync(".svarta/dev")) {
    rmSync(".svarta/dev", { recursive: true });
  }
  mkdirSync(".svarta/dev/nitro/routes", { recursive: true });

  await nitrofyRoutes(routesFolder);

  const nitro = await createNitro(true);
  const devServer = createDevServer(nitro);
  await devServer.listen(+(process.env["SVARTA_PORT"] || process.env["PORT"] || 7777));
  await prepare(nitro);
  await build(nitro);

  const reloadRoutes = debounce(async () => {
    if (existsSync(".svarta/dev")) {
      rmSync(".svarta/dev", { recursive: true });
    }
    mkdirSync(".svarta/dev/nitro/routes", { recursive: true });

    await nitrofyRoutes(routesFolder);
    await build(nitro);
  }, 1000);

  chokidar
    .watch(routesFolder, {
      persistent: false,
      ignoreInitial: true,
    })
    //.on("change", reloadRoutes)
    .on("add", reloadRoutes)
    .on("unlink", reloadRoutes)
    .on("unlinkDir", reloadRoutes);
}
