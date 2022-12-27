import { statSync } from "node:fs";

import { buildRoutingTree, CollectedRoute, formatRoutePath, printTree } from "@svarta/core";
import chalk from "chalk";

import { Timer } from "./timer";

interface ResultOptions {
  routeFolder: string;
  routes: CollectedRoute[];
  outputFile: string;
  timer: Timer;
  collectTimer: Timer;
  buildTimer: Timer;
  checkTimer: Timer;
}

export function printBuildResult({
  routeFolder,
  routes,
  outputFile,
  timer,
  buildTimer,
  collectTimer,
  checkTimer,
}: ResultOptions): void {
  printTree(buildRoutingTree(routeFolder, routes));

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
