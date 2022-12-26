import { SUPPORTED_METHODS } from "./method";
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

export const ROUTE_FILE_PATTERN = new RegExp(
  `^[a-zA-Z0-9_\\-~\\[\\].]+\.(${SUPPORTED_METHODS.join("|").toLowerCase()})\.tsx?$`,
);

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
    // TODO: Array.at() is only supported Node >=16.6: https://github.com/nodejs/node/pull/39534
    if (segments.length > 1 && segments.at(-1)?.type === "sep") {
      segments.pop();
    }
  }

  return segments;
}
