import { basename, normalize, relative } from "node:path";
import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import { walkFiles } from "walk-it";

import { ROUTE_FILE_PATTERN, tokenizeRoute } from "./fs_router";
import { RouteMethod } from "./method";
import type { RouteSegment } from "./types";

export type CollectedRoute = { path: string; routeSegments: RouteSegment[]; method: RouteMethod };

export async function collectRouteFiles(folder: string): Promise<CollectedRoute[]> {
  const files: string[] = [];
  for await (const { path } of walkFiles(folder, {
    recursive: true,
  })) {
    if (ROUTE_FILE_PATTERN.test(basename(path))) {
      files.push(path);
    } else {
      console.log(`Unsupported file in routes folder: ${path}`);
    }
  }

  const routes = files
    .map((path) => {
      const filename = basename(path);
      const [_name, methodRaw, _ext] = filename.split(".");
      const method = methodRaw.toUpperCase() as RouteMethod;

      let normalized = `/${relative(folder, path).replaceAll(windowsSeparator, posixSeperator)}`;
      if (filename.startsWith("index.")) {
        normalized = normalized.replace(filename, "");
      }

      return {
        path: normalize(path),
        method,
        routeSegments: tokenizeRoute(normalized),
      };
    })
    .sort((a, b) => {
      if (a.routeSegments.some((x) => x.type === "catchAll")) {
        return 1;
      }
      if (b.routeSegments.some((x) => x.type === "catchAll")) {
        return -1;
      }
      if (a.routeSegments.some((x) => x.type === "param")) {
        return 1;
      }
      if (b.routeSegments.some((x) => x.type === "param")) {
        return -1;
      }
      return 0;
    });

  return routes;
}
