import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, rmSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { collectRouteFiles } from "@svarta/core";
import chalk from "chalk";
import esbuild from "esbuild";
import { rollup } from "rollup";
import esbuildPlugin from "rollup-plugin-esbuild";

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

  collectTimer.stop();

  const transformTimer = new Timer();

  if (existsSync(output)) {
    unlinkSync(output);
  }

  if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  }
  mkdirSync(".svarta/tmp", { recursive: true });

  console.error("Transforming routes\n");

  for (const route of routes) {
    const routeSize = statSync(route.path).size;
    const tmpFile = resolve(`.svarta/tmp/route-${randomBytes(4).toString("hex")}.mjs`);
    console.error(
      `Transforming ${chalk.blueBright(relative(folder, route.path))} ${chalk.gray(
        `[${(routeSize / 1000).toFixed(2)} kB]`,
      )}\n`,
    );

    await esbuild.build({
      bundle: true,
      banner: {
        js: "/***** svarta route *****/",
      },
      entryPoints: [route.path],
      outfile: tmpFile,
      platform: "node",
      format: "esm",
      target: "es2019",
    });

    /* const bundle = await rollup({
      input: route.path,
      plugins: [
        function resolver() {
          return {
            resolveId: (file: string) => {
              return resolve(file);
            },
          };
        },
        esbuild({
          exclude: ["*"],
        }),
        commonjs(),
        json(),
      ],
      onwarn: () => {},
    });
    await bundle.write({
      file: tmpFile,
      format: "esm",
    }); */
    route.path = tmpFile; // TODO:
  }

  transformTimer.stop();

  const buildTimer = new Timer();

  const tmpFile = resolve(`.svarta/tmp/app-${randomBytes(4).toString("hex")}.mjs`);
  console.error(`Building app\n`);
  writeFileSync(tmpFile, buildTemplate(routes), "utf-8");

  const plugins = [esbuildPlugin(), nodeResolve(), commonjs(), json()];
  /*   if (minify) {
    // TODO: https://github.com/rollup/plugins/issues/1366
    // use @rollup/terser when fixed
    plugins.push(terser());
  } */
  const bundle = await rollup({
    input: tmpFile,
    plugins,
  });
  await bundle.write({
    file: output,
    format: "esm",
  });

  const appSize = statSync(output).size;
  console.error(
    `${"Output ready at"} ${chalk.blueBright(output)} ${chalk.gray(
      `[${(appSize / 1000).toFixed(2)} kB]`,
    )}\n`,
  );

  /* if (existsSync(".svarta/tmp")) {
    rmSync(".svarta/tmp", { recursive: true });
  } */

  buildTimer.stop();

  timer.stop();

  console.error(
    `Done in ${timer.asSeconds()}s ${chalk.grey(
      `(collect ${collectTimer.asMilli()}ms, transform ${transformTimer.asMilli()}ms, build ${buildTimer.asMilli()}ms)`,
    )}`,
  );
}

buildStandaloneServer(routeFolder, output, true).then(() => process.exit(0));
