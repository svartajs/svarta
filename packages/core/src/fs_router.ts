import { basename, normalize, relative } from "node:path";
import { sep as posixSeperator } from "node:path/posix";
import { sep as windowsSeparator } from "node:path/win32";

import { walkFiles } from "walk-it";

import { RouteMethod, SUPPORTED_METHODS } from "./method";
import type { RouteSegment } from "./types";

export function formatRoutePath(routeSegments: RouteSegment[]): string {
  return routeSegments.reduce((acc, seg) => {
    if (seg.type === "sep") {
      return acc + "/";
    }
    if (seg.type === "static") {
      return acc + seg.value;
    }
    if (seg.type === "param") {
      return acc + `:${seg.name}`;
    }
    throw new Error(`Route Not supported: ${JSON.stringify(seg)}`);
  }, "");
}

export async function checkRoute(path: string, routeSegments: RouteSegment[]): Promise<void> {
  const { params } = await import(path);
  if (params) {
    if (!Array.isArray(params)) {
      throw new Error("Invalid params export");
    }
  }

  const definedParams = params || [];
  const realParams = routeSegments.reduce((params, seg) => {
    if (seg.type === "param" || seg.type === "catchAll") {
      params.push(seg.name);
    }
    return params;
  }, [] as string[]);

  const nonExhaustedParams = realParams.filter((param: string) => !definedParams.includes(param));

  if (nonExhaustedParams.length) {
    const routePath = formatRoutePath(routeSegments);
    throw new Error(
      `Param(s) not defined in route "${routePath}": ${nonExhaustedParams.join(
        ", ",
      )}\nTo your route file, add:\n\nexport const params = [${realParams
        .map((x) => `"${x}"`)
        .join(", ")}] as const;`,
    );
  }
}

export async function collectRouteFiles(
  folder: string,
): Promise<{ path: string; routeSegments: RouteSegment[]; method: RouteMethod }[]> {
  const ROUTE_FILE_PATTERN = new RegExp(`${SUPPORTED_METHODS.join("|").toLowerCase()}}.ts$`);

  const files: string[] = [];
  for await (const { path } of walkFiles(folder, {
    recursive: true,
  })) {
    if (ROUTE_FILE_PATTERN.test(basename(path))) {
      files.push(path);
    } else {
      console.error(`Unsupported file in routes folder: ${path}`);
    }
  }

  const routes = files
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

const SEP_REGEX = /^\//;
const CATCH_ALL_REGEX = /^\[[.]{3}([a-zA-Z0-9_\-~]+)\]/;
const PARAM_REGEX = /^\[([a-zA-Z0-9_\-~]+)\]/;
const STATIC_REGEX = /^[a-zA-Z0-9_.\-~]+/;

export function tokenizeRoute(str: string, removeTrailingSlash = true): RouteSegment[] {
  const segments: RouteSegment[] = [];

  let stream = str;

  // Slash
  while (stream.length > 0) {
    if (SEP_REGEX.test(stream)) {
      segments.push({ type: "sep" });
      stream = stream.replace(SEP_REGEX, "");
    }
    // [...Catch all]
    else if (CATCH_ALL_REGEX.test(stream)) {
      const [_, name] = stream.match(CATCH_ALL_REGEX)!;
      segments.push({ type: "catchAll", name });
      stream = stream.replace(CATCH_ALL_REGEX, "");
    }
    // [Param]
    else if (PARAM_REGEX.test(stream)) {
      const [_, name] = stream.match(PARAM_REGEX)!;
      segments.push({ type: "param", name });
      stream = stream.replace(PARAM_REGEX, "");
    }
    // Any other
    else if (STATIC_REGEX.test(stream)) {
      const [value] = stream.match(STATIC_REGEX)!;
      segments.push({ type: "static", value });
      stream = stream.replace(STATIC_REGEX, "");
    } else {
      throw new Error("Invalid route, could not tokenize!!!");
    }
  }

  if (removeTrailingSlash) {
    if (segments.length > 1 && segments.at(-1)?.type === "sep") {
      segments.pop();
    }
  }

  return segments;
}
