import { statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { sep as posixSeparator } from "node:path/posix";

import chalk from "chalk";

import { CollectedRoute, collectRouteFiles } from "./collect_routes";
import { formatRoutePath } from "./fs_router";

interface Node {
  name: string;
  path: string;
  children: Node[];
  isDir: boolean;
  route: CollectedRoute | null;
}

export function buildRoutingTree(baseFolder: string, routes: CollectedRoute[]): Node {
  baseFolder = resolve(baseFolder);

  const root: Node = {
    name: "",
    children: [],
    path: baseFolder,
    isDir: true,
    route: null,
  };

  for (const route of routes) {
    const pathSplits = relative(baseFolder, route.path).split(posixSeparator).filter(Boolean);
    let chosenNode = root;
    let depth = 0;

    for (let i = 0; i < pathSplits.length; i++) {
      const split = pathSplits[i];
      const isLast = i === pathSplits.length - 1;

      if (isLast) {
        chosenNode.children.push({
          name: split,
          path: resolve(chosenNode.path, split),
          children: [],
          isDir: false,
          route: {
            ...route,
            routeSegments: [...route.routeSegments.filter((x) => x.type !== "sep")].slice(depth),
          },
        });
      } else {
        const nextNode = chosenNode.children.find((child) => child.name === split);
        if (nextNode) {
          chosenNode = nextNode;
        } else {
          const nextNode: Node = {
            name: split,
            path: resolve(chosenNode.path, split),
            isDir: true,
            children: [],
            route: null,
          };
          chosenNode.children.push(nextNode);
          chosenNode = nextNode;
        }
        depth++;
      }
    }
  }

  return root;
}

export function printTree(tree: Node, indent = 4, depth = 0) {
  const spaces = " ".repeat(depth * indent);

  if (!tree.name) {
    console.log("Routes");
  } else {
    console.log(`${spaces}-- /${tree.name}`);
  }

  for (const node of tree.children.filter((x) => !x.isDir)) {
    const routeSize = statSync(node.path).size;
    console.log(
      `${" ".repeat(indent)}${spaces}- ${chalk.yellow(node.route!.method)} ${chalk.blueBright(
        `/${formatRoutePath(node.route!.routeSegments)} ${chalk.grey(
          `[${(routeSize / 1000).toFixed(2)} kB]`,
        )}`,
      )}`,
    );
  }

  for (const folder of tree.children.filter((x) => x.isDir)) {
    printTree(folder, indent, depth + 1);
  }
}
