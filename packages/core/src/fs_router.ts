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
    throw new Error(`Route not supported: ${JSON.stringify(seg)}`);
  }, "");
}

export async function checkRoute(path: string, routeSegments: RouteSegment[]): Promise<void> {
  const route = await import(path);
  const { default: def, params } = route;

  if (!def?.handler) {
    throw new Error("Route is not exporting handler");
  }

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
  const unusedParams = definedParams.filter((param: string) => !realParams.includes(param));

  if (unusedParams.length) {
    const routePath = formatRoutePath(routeSegments);
    throw new Error(
      `Param defined but not present in route "${routePath}": ${nonExhaustedParams.join(
        ", ",
      )}\nRemove "${unusedParams[0]}" from the "params" array`,
    );
  }

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

const ROUTE_FILE_PATTERN = new RegExp(
  `^[a-zA-Z0-9_\\-~\\[\\].]+\.(${SUPPORTED_METHODS.join("|").toLowerCase()})\.tsx?$`,
);

export async function collectRouteFiles(
  folder: string,
): Promise<{ path: string; routeSegments: RouteSegment[]; method: RouteMethod }[]> {
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

      let normalized = `/${relative(folder, path).replace(windowsSeparator, posixSeperator)}`;
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

const SEP_REGEX = /^\//;
const CATCH_ALL_REGEX = /^\[[.]{3}([a-zA-Z0-9_\-~]+)\]/;
const PARAM_REGEX = /^\[([a-zA-Z0-9_\-~]+)\]/;
const STATIC_REGEX = /^[a-zA-Z0-9_\-~]+/;

export function tokenizeRoute(str: string, removeTrailingSlash = true): RouteSegment[] {
  const segments: RouteSegment[] = [];

  let stream = str;

  // Slash
  while (stream.length > 0) {
    if (SEP_REGEX.test(stream)) {
      segments.push({ type: "sep" });
      stream = stream.replace(SEP_REGEX, "");
    }
    // Route name
    else if (ROUTE_FILE_PATTERN.test(stream)) {
      const [matched] = stream.match(ROUTE_FILE_PATTERN)!;
      const routeName = matched.replace(
        new RegExp(`\\.(${SUPPORTED_METHODS.join("|").toLowerCase()})\\.tsx?$`),
        "",
      );

      const tokens = tokenizeRoute(routeName, true);
      segments.push(...tokens);

      stream = stream.replace(ROUTE_FILE_PATTERN, "");
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
