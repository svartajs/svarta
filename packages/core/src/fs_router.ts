import { basename, relative } from "node:path";
import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import glob from "glob";
import moo from "moo";

const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type RouteMethod = typeof SUPPORTED_METHODS[number];

type RouteSegment =
  | {
      type: "sep";
    }
  | {
      type: "static";
      value: string;
    }
  | {
      type: "param";
      name: string;
    }
  | {
      type: "variadic";
      name: string;
    };

export async function gatherRouteFiles(
  folder: string,
): Promise<{ path: string; routeSegments: RouteSegment[]; method: RouteMethod }[]> {
  const files = glob.sync("./**/{get,post,put,patch,delete}.ts", {
    absolute: true,
    cwd: folder,
  });

  return files
    .map((path) => {
      const method = basename(path).replace(".ts", "").toUpperCase() as RouteMethod;

      const normalized = `/${relative(folder, path)
        .replace(windowsSeparator, posixSeperator)
        .replace(basename(path), "")}`;

      return {
        path,
        method,
        routeSegments: tokenizeRoute(normalized),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

let lexer = moo.compile({
  sep: "/",
  param: /\[[a-zA-Z0-9_.\-~]+\]/,
  variadic: /\[[.]{3}[a-zA-Z0-9_.\-~]+\]/,
  static: /[a-zA-Z0-9_.\-~]+/,
});

export function tokenizeRoute(str: string): RouteSegment[] {
  const tokens = Array.from(lexer.reset(str));

  const segments = tokens.map(({ type, value }) => {
    if (type === "sep") {
      return { type } as RouteSegment;
    }
    if (type === "static") {
      return { type, value } as RouteSegment;
    }
    return { type, name: value.replace(/[\[\].]/g, "") } as RouteSegment;
  });

  if (segments.length > 1 && segments.at(-1)?.type === "sep") {
    segments.pop();
  }

  return segments;
}
