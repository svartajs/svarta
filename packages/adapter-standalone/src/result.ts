import { statSync } from "node:fs";

import { CollectedRoute, formatRoutePath } from "@svarta/core";
import chalk from "chalk";

import { Timer } from "./timer";

interface ResultOptions {
  routes: CollectedRoute[];
  outputFile: string;
  timer: Timer;
  collectTimer: Timer;
  buildTimer: Timer;
  checkTimer: Timer;
}

// TODO: make it better and move to core

export function printBuildResult({
  routes,
  outputFile,
  timer,
  buildTimer,
  collectTimer,
  checkTimer,
}: ResultOptions): void {
  const longestRoutePath = Math.max(
    ...routes.map(({ routeSegments }) => formatRoutePath(routeSegments).length),
  );
  const longestRouteMethod = Math.max(...routes.map(({ method }) => method.length));

  console.log("Routes");

  routes.forEach((route, index) => {
    const routeSize = statSync(route.path).size;
    const routePath = formatRoutePath(route.routeSegments);
    const isLastRoute = index === routes.length - 1;

    console.log(
      `${chalk.grey(isLastRoute ? "└" : "├")} ${chalk.yellow(route.method)}${" ".repeat(
        longestRouteMethod - route.method.length + 1,
      )}${chalk.blueBright(routePath)}${" ".repeat(
        longestRoutePath - routePath.length + 1,
      )}${chalk.grey(`[${(routeSize / 1000).toFixed(2)} kB]`)}`,
    );
  });

  const appSize = statSync(outputFile).size;
  console.log(
    `\n${"Output ready at"} ${chalk.blueBright(outputFile)} ${chalk.grey(
      `[${(appSize / 1000).toFixed(2)} kB]`,
    )}`,
  );

  function formatTime(timer: Timer): string {
    const ms = timer.asMilli();
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  console.log(
    `\nDone in ${formatTime(timer)} ${chalk.grey(
      `(collect ${formatTime(collectTimer)}, check ${formatTime(checkTimer)}, build ${formatTime(
        buildTimer,
      )})`,
    )}`,
  );
}
