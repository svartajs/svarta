import { basename, normalize, relative } from "node:path";
import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import moo from "moo";
import { walkFiles } from "walk-it";

import { RouteMethod, SUPPORTED_METHODS } from "./method";
import { RouteSegment } from "./types";

export async function collectRouteFiles(
  folder: string,
): Promise<{ path: string; routeSegments: RouteSegment[]; method: RouteMethod }[]> {
  const ROUTE_FILE_PATTERN = new RegExp(`${SUPPORTED_METHODS.join("|").toLowerCase()}}.ts$`);

  const files: string[] = [];
  for await (const file of walkFiles(folder, {
    recursive: true,
  })) {
    if (ROUTE_FILE_PATTERN.test(basename(file))) {
      files.push(file);
    } else {
      console.error(`Unsupported file in routes folder: ${file}`);
    }
  }

  return files
    .map((path) => {
      const method = basename(path).replace(".ts", "").toUpperCase() as RouteMethod;

      const normalized = `/${relative(folder, path)
        .replace(windowsSeparator, posixSeperator)
        .replace(basename(path), "")}`;

      return {
        path: normalize(path),
        method,
        routeSegments: tokenizeRoute(normalized),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

let lexer = moo.compile({
  sep: "/",
  catchAll: /\[[.]{3}[a-zA-Z0-9_\-~]+\]/,
  param: /\[[a-zA-Z0-9_\-~]+\]/,
  static: /[a-zA-Z0-9_.\-~]+/,
});

export function tokenizeRoute(str: string, removeTrailingSlash = true): RouteSegment[] {
  const tokens = Array.from(lexer.reset(str));

  const segments = tokens.map(({ type, value }) => {
    if (type === "sep") {
      return { type } as RouteSegment;
    }
    if (type === "static") {
      return { type, value } as RouteSegment;
    }
    if (type === "param") {
      return { type, name: value.replace(/[\[\]]/g, "") } as RouteSegment;
    }
    return { type, name: value.replace("[...", "").replace("]", "") } as RouteSegment;
  });

  if (removeTrailingSlash) {
    if (segments.length > 1 && segments.at(-1)?.type === "sep") {
      segments.pop();
    }
  }

  return segments;
}
