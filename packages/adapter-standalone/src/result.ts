import { statSync } from "node:fs";

import { formatRoutePath, RouteMethod, RouteSegment } from "@svarta/core";
import chalk from "chalk";

import { Timer } from "./timer";

interface ResultOptions {
  routes: { path: string; routeSegments: RouteSegment[]; method: RouteMethod }[];
  outputFile: string;
  timer: Timer;
  collectTimer: Timer;
  buildTimer: Timer;
}

export function printBuildResult({
  routes,
  outputFile,
  timer,
  buildTimer,
  collectTimer,
}: ResultOptions): void {
  const longestRoutePath = Math.max(
    ...routes.map(({ routeSegments }) => formatRoutePath(routeSegments).length),
  );
  const longestRouteMethod = Math.max(...routes.map(({ method }) => method.length));

  console.log("Routes");

  for (const route of routes) {
    const routeSize = statSync(route.path).size;
    const routePath = formatRoutePath(route.routeSegments);

    console.log(
      `${chalk.grey("├")} ${chalk.yellow(route.method)}${" ".repeat(
        longestRouteMethod - route.method.length + 1,
      )}${chalk.blueBright(routePath)}${" ".repeat(
        longestRoutePath - routePath.length + 1,
      )}${chalk.grey(`[${(routeSize / 1000).toFixed(2)} kB]`)}`,
    );
  }

  const appSize = statSync(outputFile).size;
  console.log(
    `\n${"Output ready at"} ${chalk.blueBright(outputFile)} ${chalk.grey(
      `[${(appSize / 1000).toFixed(2)} kB]`,
    )}`,
  );

  console.log(
    `\nDone in ${timer.asSeconds()}s ${chalk.grey(
      `(collect ${collectTimer.asMilli()}ms, build ${buildTimer.asMilli()}ms)`,
    )}`,
  );
}
